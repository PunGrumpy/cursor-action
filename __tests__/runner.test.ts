import { beforeEach, describe, expect, it, mock } from "bun:test";

import * as actionsCore from "@actions/core";
import type { ExecOptions } from "@actions/exec";

import type { ActionInputs } from "../src/types";

type ExecFn = (
  commandLine: string,
  args?: string[],
  options?: ExecOptions
) => Promise<number>;

type GetExecOutputFn = (
  commandLine: string,
  args?: string[],
  options?: ExecOptions
) => Promise<{ exitCode: number; stderr: string; stdout: string }>;

const mockExec = mock<ExecFn>();
const mockGetExecOutput = mock<GetExecOutputFn>();
const mockWarning = mock<typeof actionsCore.warning>();

mock.module("@actions/core", () => ({
  ...actionsCore,
  debug: mock<typeof actionsCore.debug>(),
  info: mock<typeof actionsCore.info>(),
  warning: mockWarning,
}));

mock.module("@actions/exec", () => ({
  exec: mockExec,
  getExecOutput: mockGetExecOutput,
}));

const { runAgent } = await import("../src/runner");

/** All `exec` invocations from the last test run. */
const getExecCalls = (): {
  args?: string[];
  commandLine: string;
  options?: ExecOptions;
}[] =>
  mockExec.mock.calls.map((call) => {
    const [commandLine, args, options] = call as [
      string,
      string[] | undefined,
      ExecOptions | undefined,
    ];
    return { args, commandLine, options };
  });

/** First `exec` invocation from the last test run (asserts the call exists). */
const getExecCall = (): {
  args?: string[];
  commandLine: string;
  options?: ExecOptions;
} => {
  const calls = getExecCalls();
  expect(calls.length).toBeGreaterThan(0);
  const [first] = calls;
  if (first === undefined) {
    throw new Error("expected exec to have been called");
  }
  return first;
};

const baseInputs: ActionInputs = {
  apiKey: "test-key",
  cursorVersion: "latest",
  model: "auto",
  permissions: "read-only",
  prompt: "Analyze this code",
  timeout: 300,
  workingDirectory: ".",
};

describe("runAgent", () => {
  beforeEach(() => {
    mock.clearAllMocks();
    mockGetExecOutput.mockImplementation((_cmd, args) => {
      if (args?.includes("--version")) {
        return Promise.resolve({
          exitCode: 0,
          stderr: "",
          stdout: "cursor-agent 9.9.9-test\n",
        });
      }
      return Promise.resolve({
        exitCode: 0,
        stderr: "",
        stdout: "OK\n",
      });
    });
  });

  it("calls cursor-agent with correct base args", async () => {
    mockExec.mockResolvedValue(0);

    const result = await runAgent(baseInputs);

    expect(result.cliVersion).toBe("cursor-agent 9.9.9-test");
    expect(mockExec).toHaveBeenCalledWith(
      "cursor-agent",
      expect.arrayContaining(["chat", "Analyze this code", "--no-interactive"]),
      expect.objectContaining({
        cwd: expect.any(String),
        env: expect.objectContaining({
          CURSOR_API_KEY: "test-key",
          NO_COLOR: "1",
        }),
        ignoreReturnCode: true,
      })
    );
    expect(mockGetExecOutput).toHaveBeenCalledWith(
      "cursor-agent",
      expect.arrayContaining(["-p", "--trust", "--output-format"]),
      expect.objectContaining({ silent: true })
    );
  });

  it("includes --model flag", async () => {
    mockExec.mockResolvedValue(0);
    await runAgent(baseInputs);

    const { args } = getExecCall();
    expect(args).toContain("--model");
    expect(args).toContain("auto");
  });

  it("includes read-only permission flag", async () => {
    mockExec.mockResolvedValue(0);
    await runAgent({ ...baseInputs, permissions: "read-only" });

    const { args } = getExecCall();
    expect(args).toContain("--allow-read");
    expect(args).not.toContain("--allow-write");
  });

  it("includes read-write permission flags", async () => {
    mockExec.mockResolvedValue(0);
    await runAgent({ ...baseInputs, permissions: "read-write" });

    const { args } = getExecCall();
    expect(args).toContain("--allow-read");
    expect(args).toContain("--allow-write");
  });

  it("includes full permission flags", async () => {
    mockExec.mockResolvedValue(0);
    await runAgent({ ...baseInputs, permissions: "full" });

    const { args } = getExecCall();
    expect(args).toContain("--allow-read");
    expect(args).toContain("--allow-write");
    expect(args).toContain("--allow-run");
  });

  it("returns correct exit code", async () => {
    mockExec.mockResolvedValue(42);
    const result = await runAgent(baseInputs);
    expect(result.exitCode).toBe(42);
    expect(mockExec).toHaveBeenCalledTimes(2);
  });

  it("surfaces stderr in a warning when cursor-agent fails", async () => {
    mockExec.mockImplementation((_cmd, _args, options) => {
      options?.listeners?.stderr?.(Buffer.from("Invalid API key\n"));
      return Promise.resolve(1);
    });

    await runAgent(baseInputs);

    expect(mockExec).toHaveBeenCalledTimes(1);
    expect(mockWarning).toHaveBeenCalledWith(
      expect.stringContaining("cursor-agent stderr:")
    );
    expect(mockWarning).toHaveBeenCalledWith(
      expect.stringContaining("Invalid API key")
    );
  });

  it("does not fall back to print when chat fails with substantive stderr", async () => {
    mockExec.mockImplementation((_cmd, _args, options) => {
      options?.listeners?.stderr?.(Buffer.from("billing error for model\n"));
      return Promise.resolve(1);
    });

    const result = await runAgent(baseInputs);

    expect(mockExec).toHaveBeenCalledTimes(1);
    expect(result.invocationMode).toBe("chat");
    expect(result.diagnostics).toContain("Auth/Entitlement preflight");
    expect(result.diagnostics).toContain("Primary (chat)");
    expect(result.diagnostics).not.toContain("Fallback (print)");
  });

  it("falls back to headless print when chat exits with no output", async () => {
    mockExec.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

    const result = await runAgent(baseInputs);

    expect(mockExec).toHaveBeenCalledTimes(2);
    expect(mockGetExecOutput).toHaveBeenCalledWith(
      "cursor-agent",
      ["--version"],
      expect.objectContaining({ silent: true })
    );
    const [, second] = getExecCalls();
    const [firstPrintArg] = second?.args ?? [];
    expect(firstPrintArg).toBe("-p");
    expect(second?.args).toContain("--trust");
    expect(second?.args).toContain("--output-format");
    expect(second?.args).toContain("text");
    expect(result.exitCode).toBe(0);
    expect(result.invocationMode).toBe("print");
  });

  it("falls back to print when stderr suggests unknown command", async () => {
    mockExec
      .mockImplementationOnce((_cmd, _args, options) => {
        options?.listeners?.stderr?.(
          Buffer.from("Error: unknown command chat\n")
        );
        return Promise.resolve(1);
      })
      .mockResolvedValueOnce(0);

    await runAgent(baseInputs);

    expect(mockExec).toHaveBeenCalledTimes(2);
    const [, secondUnknown] = getExecCalls();
    const [firstPrintArgUnknown] = secondUnknown?.args ?? [];
    expect(firstPrintArgUnknown).toBe("-p");
  });

  it("adds --force on print fallback for read-write permissions", async () => {
    mockExec.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

    await runAgent({ ...baseInputs, permissions: "read-write" });

    const [, secondRw] = getExecCalls();
    const printArgs = secondRw?.args;
    expect(printArgs).toContain("--force");
  });

  it("does not add --force on print fallback for read-only", async () => {
    mockExec.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

    await runAgent({ ...baseInputs, permissions: "read-only" });

    const [, secondRo] = getExecCalls();
    const printArgs = secondRo?.args;
    expect(printArgs).not.toContain("--force");
  });

  it("merges stderr and sets diagnostics when both invocations fail", async () => {
    mockExec
      .mockResolvedValueOnce(1)
      .mockImplementationOnce((_cmd, _args, options) => {
        options?.listeners?.stderr?.(Buffer.from("print mode failed\n"));
        return Promise.resolve(2);
      });

    const result = await runAgent(baseInputs);

    expect(result.exitCode).toBe(2);
    expect(result.invocationMode).toBe("print");
    expect(result.stderr).toContain("primary (chat)");
    expect(result.stderr).toContain("fallback (print -p)");
    expect(result.diagnostics).toContain("Hints:");
    expect(result.diagnostics).toContain("CURSOR_API_KEY");
  });

  it("sets CURSOR_DISABLE_UPDATE for pinned versions", async () => {
    mockExec.mockResolvedValue(0);
    await runAgent({ ...baseInputs, cursorVersion: "2026.03.20-44cb435" });

    const { options } = getExecCall();
    expect(options?.env?.CURSOR_DISABLE_UPDATE).toBe("1");
  });

  it("does not set CURSOR_DISABLE_UPDATE for latest", async () => {
    mockExec.mockResolvedValue(0);
    await runAgent({ ...baseInputs, cursorVersion: "latest" });

    const { options } = getExecCall();
    expect(options?.env?.CURSOR_DISABLE_UPDATE).toBeUndefined();
  });
});
