import { resolve } from "node:path";

import { info, warning } from "@actions/core";
import { Agent } from "@cursor/sdk";
import type { AgentOptions } from "@cursor/sdk";

import type { ActionInputs, AgentResult } from "./types";

export const runAgent = async (inputs: ActionInputs): Promise<AgentResult> => {
  const cwd = resolve(inputs.workingDirectory);

  info(`Running Cursor Agent in: ${cwd}`);
  info(`Model: ${inputs.model} | Permissions: ${inputs.permissions}`);

  let stdout = "";
  let stderr = "";
  let exitCode = 0;

  try {
    const agent = await Agent.create({
      apiKey: inputs.apiKey,
      local: { cwd },
      model: { id: inputs.model },
      permissions: inputs.permissions,
      timeout: inputs.timeout,
    } as AgentOptions);

    const run = await agent.send(inputs.prompt);

    for await (const event of run.stream()) {
      if ("text" in event && typeof event.text === "string") {
        stdout += event.text;
      }
    }

    const finalResult = await run.result;
    if (finalResult && typeof finalResult === "string") {
      stdout = finalResult;
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
