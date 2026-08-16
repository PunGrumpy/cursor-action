import { beforeEach, describe, expect, it, mock } from "bun:test";

import * as actionsCore from "@actions/core";

import type { ActionInputs } from "../src/types";

const mockWarning = mock<typeof actionsCore.warning>();
mock.module("@actions/core", () => ({
  ...actionsCore,
  debug: mock<typeof actionsCore.debug>(),
  info: mock<typeof actionsCore.info>(),
  warning: mockWarning,
}));

const mockAgentCreate = mock();
const mockAgentSend = mock();
const mockRunCancel = mock(() => Promise.resolve());

mock.module("@cursor/sdk", () => ({
  Agent: {
    create: mockAgentCreate,
  },
}));

const { runAgent } = await import("../src/runner");

const baseInputs: ActionInputs = {
  apiKey: "test-key",
  model: "default",
  permissions: "read-only",
  prompt: "Analyze this code",
  timeout: 300,
  workingDirectory: ".",
};

const mockStreamSuccess = async function* mockStreamSuccess() {
  yield { text: "Hello from stream chunk 1. " };
  yield { text: "And chunk 2." };
};

const mockStreamError = async function* mockStreamError() {
  yield { text: "Starting..." };
  throw new Error("Stream aborted");
};

/**
 * Yields only after 1.1s so a 1s action timeout can fire first.
 * @yields {{ text: string }} The chunk that arrives too late.
 */
const streamAfter1100ms = async function* streamAfter1100ms() {
  await Bun.sleep(1100);
  yield { text: "too late" };
};

/**
 * Completes only after 1.2s when cancel is unsupported (timeout still scheduled).
 * @yields {{ text: string }} The chunk that arrives after the timeout.
 */
const streamAfter1200ms = async function* streamAfter1200ms() {
  await Bun.sleep(1200);
  yield { text: "ok" };
};

const finishedWait = (result: string) => () =>
  Promise.resolve({
    id: "run-test",
    result,
    status: "finished" as const,
  });

describe("runAgent", () => {
  beforeEach(() => {
    mock.clearAllMocks();

    mockAgentCreate.mockResolvedValue({
      send: mockAgentSend,
    });

    mockAgentSend.mockResolvedValue({
      cancel: mockRunCancel,
      stream: mockStreamSuccess,
      supports: (op: string) => op === "cancel",
      wait: finishedWait("Hello from stream chunk 1. And chunk 2."),
    });
  });

  it("calls Agent.create with correct inputs and returns successful response", async () => {
    const result = await runAgent(baseInputs);

    expect(mockAgentCreate).toHaveBeenCalledWith({
      apiKey: "test-key",
      local: { cwd: expect.any(String) },
      model: { id: "default" },
    });

    expect(mockAgentSend).toHaveBeenCalledWith("Analyze this code");
    expect(mockRunCancel).not.toHaveBeenCalled();
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe("Hello from stream chunk 1. And chunk 2.");
    expect(result.stderr).toBe("");
  });

  it("warns when permissions is not read-only that the SDK does not use this input", async () => {
    await runAgent({ ...baseInputs, permissions: "read-write" });

    expect(mockWarning).toHaveBeenCalledWith(
      expect.stringContaining("permissions")
    );
  });

  it("returns exitCode 1 and surfaces stderr when SDK throws an error", async () => {
    mockAgentCreate.mockRejectedValue(new Error("Invalid API key"));

    const result = await runAgent(baseInputs);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Invalid API key");
    expect(mockWarning).toHaveBeenCalledWith(
      expect.stringContaining("Invalid API key")
    );
  });

  it("calls run.cancel when timeout elapses before the stream yields", async () => {
    mockRunCancel.mockClear();
    mockAgentSend.mockResolvedValue({
      cancel: mockRunCancel,
      stream: streamAfter1100ms,
      supports: (op: string) => op === "cancel",
      wait: finishedWait(""),
    });

    await runAgent({ ...baseInputs, timeout: 1 });

    expect(mockRunCancel).toHaveBeenCalled();
  }, 5000);

  it("does not call run.cancel when cancel is unsupported", async () => {
    mockRunCancel.mockClear();
    mockAgentSend.mockResolvedValue({
      cancel: mockRunCancel,
      stream: streamAfter1200ms,
      supports: () => false,
      wait: finishedWait("done"),
    });

    const result = await runAgent({ ...baseInputs, timeout: 1 });

    expect(mockRunCancel).not.toHaveBeenCalled();
    expect(result.exitCode).toBe(0);
  }, 5000);

  it("returns exitCode 1 when stream throws an error", async () => {
    mockAgentSend.mockResolvedValue({
      cancel: mockRunCancel,
      stream: mockStreamError,
      supports: (op: string) => op === "cancel",
      wait: finishedWait(""),
    });

    const result = await runAgent(baseInputs);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Stream aborted");
    expect(mockWarning).toHaveBeenCalledWith(
      expect.stringContaining("Stream aborted")
    );
  });
});
