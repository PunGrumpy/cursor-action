import { beforeEach, describe, expect, it, mock } from "bun:test";

import * as actionsCore from "@actions/core";
import type { ExecOptions } from "@actions/exec";

import type { ActionInputs } from "../src/types";

type ExecFn = (
  commandLine: string,
  args?: string[],
  options?: ExecOptions
) => Promise<number>;

const mockExec = mock<ExecFn>();
const mockWarning = mock<typeof actionsCore.warning>();

mock.module("@actions/core", () => ({
  ...actionsCore,
  debug: mock<typeof actionsCore.debug>(),
  info: mock<typeof actionsCore.info>(),
  warning: mockWarning,
}));

mock.module("@actions/exec", () => ({
  exec: mockExec,
}));

const { runAgent } = await import("../src/runner");

/** First `exec` invocation from the last test run (asserts the call exists). */
const getExecCall = (): {
  args?: string[];
  commandLine: string;
  options?: ExecOptions;
} => {
  expect(mockExec).toHaveBeenCalled();
  const [call] = mockExec.mock.calls;
  expect(call).toBeDefined();
  if (call === undefined) {
    throw new Error("expected exec to have been called");
  }
  const [commandLine, args, options] = call as [
    string,
    string[] | undefined,
    ExecOptions | undefined,
  ];
  return { args, commandLine, options };
};

const baseInputs: ActionInputs = {
  apiKey: "test-key",
  cursorVersion: "latest",
  model: "claude-sonnet-4-5",
  permissions: "read-only",
  prompt: "Analyze this code",
  timeout: 300,
  workingDirectory: ".",
};

describe("runAgent", () => {
  beforeEach(() => {
    mock.clearAllMocks();
  });

  it("calls cursor-agent with correct base args", async () => {
    mockExec.mockResolvedValue(0);

    await runAgent(baseInputs);

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
  });

  it("includes --model flag", async () => {
    mockExec.mockResolvedValue(0);
    await runAgent(baseInputs);

    const { args } = getExecCall();
    expect(args).toContain("--model");
    expect(args).toContain("claude-sonnet-4-5");
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
  });

  it("surfaces stderr in a warning when cursor-agent fails", async () => {
    mockExec.mockImplementation((_cmd, _args, options) => {
      options?.listeners?.stderr?.(Buffer.from("Invalid API key\n"));
      return Promise.resolve(1);
    });

    await runAgent(baseInputs);

    expect(mockWarning).toHaveBeenCalledWith(
      expect.stringContaining("cursor-agent stderr:")
    );
    expect(mockWarning).toHaveBeenCalledWith(
      expect.stringContaining("Invalid API key")
    );
  });

  it("sets CURSOR_DISABLE_UPDATE for pinned versions", async () => {
    mockExec.mockResolvedValue(0);
    await runAgent({ ...baseInputs, cursorVersion: "1.2.3" });

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
