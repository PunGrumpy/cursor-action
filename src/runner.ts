import { resolve } from "node:path";

import { debug, info, warning } from "@actions/core";
import { exec, getExecOutput } from "@actions/exec";
import type { ExecOptions } from "@actions/exec";

import type { ActionInputs, AgentInvocationMode, AgentResult } from "./types";

const PERMISSION_FLAGS: Record<ActionInputs["permissions"], string[]> = {
  full: ["--allow-read", "--allow-write", "--allow-run"],
  "read-only": ["--allow-read"],
  "read-write": ["--allow-read", "--allow-write"],
};

const buildChatArgs = (inputs: ActionInputs): string[] => {
  const args: string[] = [
    "chat",
    inputs.prompt,
    "--no-interactive",
    "--model",
    inputs.model,
  ];

  const permFlags = PERMISSION_FLAGS[inputs.permissions];
  args.push(...permFlags);

  return args;
};

/**
 * Headless print mode (`-p` / `--print`) per Cursor CLI docs; omits `chat` subcommand
 * and legacy `--allow-*` flags which may not apply to print mode.
 */
const buildPrintArgs = (inputs: ActionInputs): string[] => {
  const args: string[] = [
    "-p",
    "--no-interactive",
    "--output-format",
    "text",
    "--model",
    inputs.model,
  ];

  if (inputs.permissions === "read-write" || inputs.permissions === "full") {
    args.push("--force");
  }

  args.push(inputs.prompt);
  return args;
};

const isEmptyIo = (stdout: string, stderr: string): boolean =>
  !stdout.trim() && !stderr.trim();

const stderrSuggestsCliMismatch = (stderr: string): boolean => {
  const s = stderr.toLowerCase();
  return (
    s.includes("unknown command") ||
    s.includes("unrecognized") ||
    s.includes("invalid option") ||
    s.includes("did you mean") ||
    s.includes("error: unknown")
  );
};

const shouldTryPrintFallback = (result: {
  exitCode: number;
  stderr: string;
  stdout: string;
}): boolean => {
  if (result.exitCode === 0) {
    return false;
  }
  if (isEmptyIo(result.stdout, result.stderr)) {
    return true;
  }
  return stderrSuggestsCliMismatch(result.stderr);
};

const fetchCliVersionLine = async (
  env: NonNullable<ExecOptions["env"]>,
  cwd: string
): Promise<string> => {
  try {
    const out = await getExecOutput("cursor-agent", ["--version"], {
      cwd,
      env,
      ignoreReturnCode: true,
      silent: true,
    });
    const line = (out.stdout || out.stderr).trim();
    return line || "(no output from cursor-agent --version)";
  } catch {
    return "(could not run cursor-agent --version)";
  }
};

const buildExecEnv = (inputs: ActionInputs): NonNullable<ExecOptions["env"]> => {
  const baseEnv = Object.fromEntries(
    Object.entries(process.env).filter(
      (entry): entry is [string, string] => entry[1] !== undefined
    )
  );

  return {
    ...baseEnv,
    CURSOR_API_KEY: inputs.apiKey,
    NO_COLOR: "1",
    ...(inputs.cursorVersion === "latest"
      ? {}
      : { CURSOR_DISABLE_UPDATE: "1" }),
  };
};

const runAgentOnce = async (
  args: string[],
  options: ExecOptions
): Promise<{ exitCode: number; stderr: string; stdout: string }> => {
  let stdout = "";
  let stderr = "";
  const exitCode = await exec("cursor-agent", args, {
    ...options,
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
  });
  return { exitCode, stderr, stdout };
};

const failureHints = (inputs: ActionInputs): string =>
  [
    "Confirm CURSOR_API_KEY is set and valid for Cursor Agent / headless use.",
    "Some accounts require a Pro/Business plan for agent features; API-key-only usage may be restricted.",
    `If using a custom model, ensure "${inputs.model}" is supported for your account.`,
    "Try pinning cursor-version to a known lab build id if the CLI contract changed.",
  ].join("\n");

const buildDiagnostics = (
  cliVersion: string | undefined,
  inputs: ActionInputs,
  chat: { exitCode: number; stderr: string; stdout: string },
  print?: { exitCode: number; stderr: string; stdout: string }
): string => {
  const parts: string[] = [
    `Invocation: primary=chat, fallback=headless print (-p)`,
    cliVersion ? `cursor-agent --version: ${cliVersion}` : "",
    `Model: ${inputs.model} | Permissions: ${inputs.permissions}`,
    "",
    `Primary (chat) exit ${chat.exitCode}:`,
    chat.stderr.trim() || chat.stdout.trim()
      ? `stderr: ${chat.stderr.trim() || "(empty)"}\nstdout: ${chat.stdout.trim() || "(empty)"}`
      : "(no stdout/stderr)",
  ];
  if (print) {
    parts.push(
      "",
      `Fallback (print) exit ${print.exitCode}:`,
      print.stderr.trim() || print.stdout.trim()
        ? `stderr: ${print.stderr.trim() || "(empty)"}\nstdout: ${print.stdout.trim() || "(empty)"}`
        : "(no stdout/stderr)"
    );
  }
  parts.push("", "Hints:", failureHints(inputs));
  return parts.filter(Boolean).join("\n");
};

const warnOnFailure = (
  exitCode: number,
  stdout: string,
  stderr: string,
  inputs: ActionInputs,
  extras?: { cliVersion?: string; invocationMode?: AgentInvocationMode }
): void => {
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
      const mode = extras?.invocationMode
        ? ` (mode: ${extras.invocationMode})`
        : "";
      const ver = extras?.cliVersion
        ? ` cursor-agent --version: ${extras.cliVersion}.`
        : "";
      warning(
        `cursor-agent exited with code ${exitCode} with no stdout or stderr${mode}${ver} ` +
          failureHints(inputs).split("\n")[0]
      );
    }
  }
};

/**
 * Runs cursor-agent with the given inputs.
 * Captures stdout and stderr separately.
 * Does NOT throw on non-zero exit codes — callers decide how to handle them.
 * @returns The stdout, stderr, and exit code.
 */
export const runAgent = async (inputs: ActionInputs): Promise<AgentResult> => {
  const cwd = resolve(inputs.workingDirectory);
  const env = buildExecEnv(inputs);

  const baseOptions: ExecOptions = {
    cwd,
    env,
  };

  info(`Running cursor-agent in: ${cwd}`);
  info(`Model: ${inputs.model} | Permissions: ${inputs.permissions}`);

  const chatController = new AbortController();
  const chatTimeout = setTimeout(() => {
    chatController.abort();
  }, inputs.timeout * 1000);

  let chatResult: { exitCode: number; stderr: string; stdout: string };
  try {
    chatResult = await runAgentOnce(buildChatArgs(inputs), baseOptions);
  } catch (error) {
    if (chatController.signal.aborted) {
      throw new Error(
        `cursor-agent timed out after ${inputs.timeout}s. ` +
          `Increase the 'timeout' input if your prompt requires longer processing.`,
        { cause: error }
      );
    }
    throw error;
  } finally {
    clearTimeout(chatTimeout);
  }

  if (chatResult.exitCode === 0) {
    return {
      ...chatResult,
      invocationMode: "chat",
    };
  }

  let cliVersion: string | undefined;
  cliVersion = await fetchCliVersionLine(env, cwd);
  debug(`cursor-agent --version: ${cliVersion}`);

  if (!shouldTryPrintFallback(chatResult)) {
    warnOnFailure(
      chatResult.exitCode,
      chatResult.stdout,
      chatResult.stderr,
      inputs,
      {
        cliVersion,
        invocationMode: "chat",
      }
    );
    return {
      ...chatResult,
      cliVersion,
      diagnostics: buildDiagnostics(cliVersion, inputs, chatResult),
      invocationMode: "chat",
    };
  }

  info(
    "Primary `cursor-agent chat` failed in a way that suggests a CLI mismatch or silent failure; " +
      "retrying with headless print mode (`-p`, --output-format text)."
  );

  const printController = new AbortController();
  const printTimeout = setTimeout(() => {
    printController.abort();
  }, inputs.timeout * 1000);

  let printResult: { exitCode: number; stderr: string; stdout: string };
  try {
    printResult = await runAgentOnce(buildPrintArgs(inputs), baseOptions);
  } catch (error) {
    if (printController.signal.aborted) {
      throw new Error(
        `cursor-agent timed out after ${inputs.timeout}s. ` +
          `Increase the 'timeout' input if your prompt requires longer processing.`,
        { cause: error }
      );
    }
    throw error;
  } finally {
    clearTimeout(printTimeout);
  }

  if (printResult.exitCode === 0) {
    return {
      ...printResult,
      cliVersion,
      invocationMode: "print",
    };
  }

  warnOnFailure(
    printResult.exitCode,
    printResult.stdout,
    printResult.stderr,
    inputs,
    {
      cliVersion,
      invocationMode: "print",
    }
  );

  const mergedStderr = [
    "--- cursor-action: primary (chat) ---",
    chatResult.stderr.trim() || "(empty)",
    "--- cursor-action: fallback (print -p) ---",
    printResult.stderr.trim() || "(empty)",
  ].join("\n");

  return {
    cliVersion,
    diagnostics: buildDiagnostics(cliVersion, inputs, chatResult, printResult),
    exitCode: printResult.exitCode,
    invocationMode: "print",
    stderr: mergedStderr,
    stdout: printResult.stdout,
  };
};
