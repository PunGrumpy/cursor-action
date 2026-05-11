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

mock.module("@cursor/sdk", () => ({
  Agent: {
    create: mockAgentCreate,
  },
}));

const { runAgent } = await import("../src/runner");

const baseInputs: ActionInputs = {
  apiKey: "test-key",
  model: "auto",
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

describe("runAgent", () => {
  beforeEach(() => {
    mock.clearAllMocks();

    mockAgentCreate.mockResolvedValue({
      send: mockAgentSend,
    });

    mockAgentSend.mockResolvedValue({
      result: Promise.resolve("Hello from stream chunk 1. And chunk 2."),
      stream: mockStreamSuccess,
    });
  });

  it("calls Agent.create with correct inputs and returns successful response", async () => {
    const result = await runAgent(baseInputs);

    expect(mockAgentCreate).toHaveBeenCalledWith({
      apiKey: "test-key",
      local: { cwd: expect.any(String) },
      model: { id: "auto" },
      permissions: "read-only",
      timeout: 300,
    });

    expect(mockAgentSend).toHaveBeenCalledWith("Analyze this code");
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe("Hello from stream chunk 1. And chunk 2.");
    expect(result.stderr).toBe("");
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

  it("returns exitCode 1 when stream throws an error", async () => {
    mockAgentSend.mockResolvedValue({
      get result() {
        return Promise.reject(new Error("Stream aborted"));
      },
      stream: mockStreamError,
    });

    const result = await runAgent(baseInputs);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Stream aborted");
    expect(mockWarning).toHaveBeenCalledWith(
      expect.stringContaining("Stream aborted")
    );
  });
});
