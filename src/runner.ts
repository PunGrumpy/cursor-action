import { resolve } from "node:path";

import { debug, info, warning } from "@actions/core";
import { exec } from "@actions/exec";
import type { ExecOptions } from "@actions/exec";

import type { ActionInputs, AgentResult } from "./types";

const PERMISSION_FLAGS: Record<ActionInputs["permissions"], string[]> = {
  full: ["--allow-read", "--allow-write", "--allow-run"],
  "read-only": ["--allow-read"],
  "read-write": ["--allow-read", "--allow-write"],
};

const buildArgs = (inputs: ActionInputs): string[] => {
  const args: string[] = [
    "chat",
    inputs.prompt,
    "--no-interactive",
    "--model",
    inputs.model,
  ];

  // Append permission flags
  const permFlags = PERMISSION_FLAGS[inputs.permissions];
  args.push(...permFlags);

  return args;
};

/**
 * Runs cursor-agent with the given inputs.
 * Captures stdout and stderr separately.
 * Does NOT throw on non-zero exit codes — callers decide how to handle them.
 * @returns The stdout, stderr, and exit code.
 */
export const runAgent = async (inputs: ActionInputs): Promise<AgentResult> => {
  const args = buildArgs(inputs);

  let stdout = "";
  let stderr = "";
  const baseEnv = Object.fromEntries(
    Object.entries(process.env).filter(
      (entry): entry is [string, string] => entry[1] !== undefined
    )
  );

  const options: ExecOptions = {
    cwd: resolve(inputs.workingDirectory),
    env: {
      ...baseEnv,
      CURSOR_API_KEY: inputs.apiKey,
      NO_COLOR: "1",
      ...(inputs.cursorVersion === "latest"
        ? {}
        : { CURSOR_DISABLE_UPDATE: "1" }),
    },
    ignoreReturnCode: true,
    listeners: {
      stderr: (data: Buffer) => {
        stderr += data.toString();
        debug(`cursor-agent stderr: ${data.toString().trim()}`);
      },
      stdout: (data: Buffer) => {
        stdout += data.toString();
      },
    },
    silent: false,
  };

  info(`Running cursor-agent in: ${resolve(inputs.workingDirectory)}`);
  info(`Model: ${inputs.model} | Permissions: ${inputs.permissions}`);

  // Apply timeout via AbortController
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => {
    controller.abort();
  }, inputs.timeout * 1000);

  let exitCode: number;
  try {
    exitCode = await exec("cursor-agent", args, options);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(
        `cursor-agent timed out after ${inputs.timeout}s. ` +
          `Increase the 'timeout' input if your prompt requires longer processing.`,
        { cause: error }
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutHandle);
  }

  if (exitCode !== 0) {
    const errTail = stderr.trim();
    if (errTail) {
      const maxLen = 12_000;
      const clipped =
        errTail.length > maxLen
          ? `${errTail.slice(0, maxLen)}\n… (stderr truncated)`
          : errTail;
      warning(`cursor-agent stderr:\n${clipped}`);
    } else {
      const outTail = stdout.trim();
      if (outTail) {
        const maxLen = 4000;
        const clipped =
          outTail.length > maxLen
            ? `${outTail.slice(0, maxLen)}\n… (stdout truncated)`
            : outTail;
        warning(
          `cursor-agent exited with code ${exitCode} and empty stderr; stdout:\n${clipped}`
        );
      } else {
        warning(
          `cursor-agent exited with code ${exitCode} with no stdout or stderr. ` +
            `Confirm CURSOR_API_KEY is set, the key is valid, and the model name is supported by your account.`
        );
      }
    }
  }

  return { exitCode, stderr, stdout };
};
