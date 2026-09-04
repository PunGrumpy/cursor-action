import path from "node:path";

import { info, warning } from "@actions/core";
import { Agent } from "@cursor/sdk";
import type { RunResult } from "@cursor/sdk";

import type { ActionInputs, AgentResult, TokenUsageStats } from "./types";

const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.cause
      ? `${error.message}\nCause: ${error.cause}`
      : error.message;
  }
  return String(error);
};

const mapUsage = (usage: RunResult["usage"]): TokenUsageStats | undefined => {
  if (!usage) {
    return undefined;
  }
  const {
    cacheReadTokens,
    cacheWriteTokens,
    inputTokens,
    outputTokens,
    totalTokens,
  } = usage;
  return {
    cacheReadTokens,
    cacheWriteTokens,
    inputTokens,
    outputTokens,
    totalTokens,
  };
};

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
  let status = "finished";
  let durationMs: number | undefined;
  let usage: TokenUsageStats | undefined;

  try {
    const agent = await Agent.create({
      apiKey: inputs.apiKey,
      local: { cwd },
      model: { id: inputs.model },
    });

    const run = await agent.send(inputs.prompt);

    const timeoutMs = inputs.timeout * 1000;
    let cancelTimer: ReturnType<typeof setTimeout> | undefined;
    let timedOut = false;

    if (timeoutMs > 0 && Number.isFinite(timeoutMs)) {
      cancelTimer = setTimeout(() => {
        timedOut = true;
        // Fire-and-forget: timeout handler must not block the timer callback.
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

      const runResult = await run.wait();
      ({ durationMs } = runResult);
      usage = mapUsage(runResult.usage);

      if (runResult.result && typeof runResult.result === "string") {
        stdout = runResult.result;
      }

      ({ status } = runResult);
      if (status === "error") {
        exitCode = 1;
        const msg = runResult.error?.message ?? "Agent run failed with error.";
        stderr += stderr ? `\n${msg}` : msg;
        warning(`Agent execution failed: ${msg}`);
      } else if (status === "cancelled") {
        exitCode = 1;
        const msg = timedOut
          ? `Agent run timed out after ${inputs.timeout}s and was cancelled.`
          : "Agent run was cancelled.";
        stderr += stderr ? `\n${msg}` : msg;
        warning(msg);
      }
    } finally {
      if (cancelTimer !== undefined) {
        clearTimeout(cancelTimer);
      }
    }
  } catch (error) {
    exitCode = 1;
    status = "error";
    stderr += extractErrorMessage(error);
    warning(`Agent execution failed: ${stderr}`);
  }

  return {
    diagnostics: exitCode === 0 ? undefined : stderr,
    durationMs,
    exitCode,
    status,
    stderr,
    stdout,
    usage,
  };
};
