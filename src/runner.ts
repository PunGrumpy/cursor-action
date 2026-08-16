import path from "node:path";

import { info, warning } from "@actions/core";
import { Agent } from "@cursor/sdk";

import type { ActionInputs, AgentResult } from "./types";

export const runAgent = async (inputs: ActionInputs): Promise<AgentResult> => {
  const cwd = path.resolve(inputs.workingDirectory);

  info(`Running Cursor Agent in: ${cwd}`);
  info(`Model: ${inputs.model}`);
  if (inputs.permissions !== "read-only") {
    warning(
      "The `permissions` input is not passed to Cursor SDK Agent.create; " +
        "tool access follows your API key / account, not this field."
    );
  }

  let stdout = "";
  let stderr = "";
  let exitCode = 0;

  try {
    const agent = await Agent.create({
      apiKey: inputs.apiKey,
      local: { cwd },
      model: { id: inputs.model },
    });

    const run = await agent.send(inputs.prompt);

    const timeoutMs = inputs.timeout * 1000;
    let cancelTimer: ReturnType<typeof setTimeout> | undefined;
    if (timeoutMs > 0 && Number.isFinite(timeoutMs)) {
      cancelTimer = setTimeout(() => {
        // Fire-and-forget: timeout handler must not block the timer callback.
        // eslint-disable-next-line no-void -- intentional detached async work
        void (async () => {
          if (run.supports("cancel")) {
            try {
              await run.cancel();
            } catch {
              // Best-effort cancel on timeout; errors are surfaced via stream/result.
            }
          }
        })();
      }, timeoutMs);
    }

    try {
      for await (const event of run.stream()) {
        if ("text" in event && typeof event.text === "string") {
          stdout += event.text;
        }
      }

      await run.wait();
      const finalResult = run.result;
      if (finalResult && typeof finalResult === "string") {
        stdout = finalResult;
      }
    } finally {
      if (cancelTimer !== undefined) {
        clearTimeout(cancelTimer);
      }
    }
  } catch (error) {
    exitCode = 1;
    if (error instanceof Error) {
      stderr += error.message;
      if (error.cause) {
        stderr += `\nCause: ${error.cause}`;
      }
    } else {
      stderr += String(error);
    }
    warning(`Agent execution failed: ${stderr}`);
  }

  return {
    diagnostics: exitCode === 0 ? undefined : stderr,
    exitCode,
    stderr,
    stdout,
  };
};
