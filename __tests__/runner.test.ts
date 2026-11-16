import { beforeEach, describe, expect, it, mock } from "bun:test";

import * as actionsCore from "@actions/core";

import type { ActionInputs } from "../src/types";

const mockInfo = mock<typeof actionsCore.info>();
const mockWarning = mock<typeof actionsCore.warning>();
mock.module("@actions/core", () => ({
  ...actionsCore,
  debug: mock<typeof actionsCore.debug>(),
  info: mockInfo,
  warning: mockWarning,
}));

const mockAgentCreate = mock();
const mockAgentSend = mock();
const mockRunCancel = mock(() => Promise.resolve());
const mockDispose = mock(() => Promise.resolve());
const mockModelsList = mock();

mock.module("@cursor/sdk", () => ({
  Agent: {
    create: mockAgentCreate,
  },
  Cursor: {
    models: { list: mockModelsList },
  },
}));

const { runAgent } = await import("../src/runner");

const baseInputs: ActionInputs = {
  apiKey: "test-key",
  model: { id: "composer-2.5" },
  permissions: "read-only",
  prompt: "Analyze this code",
  timeout: 300,
  workingDirectory: ".",
};

const assistantEvent = (text: string) => ({
  agent_id: "agent-test",
  message: {
    content: [{ text, type: "text" as const }],
    role: "assistant" as const,
  },
  run_id: "run-test",
  type: "assistant" as const,
});

const thinkingEvent = (text: string) => ({
  agent_id: "agent-test",
  run_id: "run-test",
  text,
  type: "thinking" as const,
});

const readToolCall = (status: "running" | "completed") => ({
  agent_id: "agent-test",
  args: { path: "src/index.ts" },
  call_id: "call-1",
  name: "read",
  run_id: "run-test",
  status,
  type: "tool_call" as const,
});

const mockStreamSuccess = async function* mockStreamSuccess() {
  yield assistantEvent("Hello from stream chunk 1. ");
  yield assistantEvent("And chunk 2.");
};

const mockStreamError = async function* mockStreamError() {
  yield assistantEvent("Starting...");
  throw new Error("Stream aborted");
};

/**
 * Yields only after 1.1s so a 1s action timeout can fire first.
 * @yields {ReturnType<typeof assistantEvent>} The assistant event that arrives too late.
 */
const streamAfter1100ms = async function* streamAfter1100ms() {
  await Bun.sleep(1100);
  yield assistantEvent("too late");
};

/**
 * Completes only after 1.2s when cancel is unsupported (timeout still scheduled).
 * @yields {ReturnType<typeof assistantEvent>} The assistant event that arrives after the timeout.
 */
const streamAfter1200ms = async function* streamAfter1200ms() {
  await Bun.sleep(1200);
  yield assistantEvent("ok");
};

const finishedWait = (result: string) => () =>
  Promise.resolve({
    id: "run-test",
    result,
    status: "finished" as const,
  });

/** A promise that never settles, for runs that ignore cancellation. */
const pending = <T = never>(): Promise<T> => Promise.withResolvers<T>().promise;

const neverEndingStream = () => ({
  [Symbol.asyncIterator]: () => ({
    next: () => pending<IteratorResult<unknown>>(),
  }),
});

const catalog = [
  {
    displayName: "Grok 4.7",
    id: "grok-4.7",
    variants: [
      {
        displayName: "Medium",
        isDefault: true,
        params: [{ id: "reasoning_effort", value: "medium" }],
      },
    ],
  },
];

const erroredRun = (message: string) => ({
  cancel: mockRunCancel,
  stream: mockStreamSuccess,
  supports: (op: string) => op === "cancel",
  wait: () =>
    Promise.resolve({
      error: { message },
      id: "run-test",
      result: "",
      status: "error" as const,
    }),
});

describe("runAgent", () => {
  beforeEach(() => {
    mock.clearAllMocks();
    mockDispose.mockImplementation(() => Promise.resolve());
    mockModelsList.mockResolvedValue(catalog);

    mockAgentCreate.mockResolvedValue({
      [Symbol.asyncDispose]: mockDispose,
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
      model: { id: "composer-2.5" },
      tools: expect.arrayContaining(["read", "grep"]),
    });

    expect(mockAgentSend).toHaveBeenCalledWith("Analyze this code");
    expect(mockRunCancel).not.toHaveBeenCalled();
    expect(result.exitCode).toBe(0);
    expect(result.status).toBe("finished");
    expect(result.stdout).toBe("Hello from stream chunk 1. And chunk 2.");
    expect(result.stderr).toBe("");
  });

  it("passes the author's model params to Agent.create", async () => {
    const model = {
      id: "grok-4.7",
      params: [{ id: "reasoning_effort", value: "medium" }],
    };
    await runAgent({ ...baseInputs, model });
    expect(mockAgentCreate).toHaveBeenLastCalledWith(
      expect.objectContaining({ model })
    );
  });

  it("runs a bare id with the catalog's default settings", async () => {
    await runAgent({ ...baseInputs, model: { id: "grok-4.7" } });

    expect(mockModelsList).toHaveBeenCalledTimes(1);
    expect(mockModelsList).toHaveBeenCalledWith({ apiKey: "test-key" });
    expect(mockAgentCreate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        model: {
          id: "grok-4.7",
          params: [{ id: "reasoning_effort", value: "medium" }],
        },
      })
    );
  });

  it("sends the author's model unchanged when the catalog request fails", async () => {
    mockModelsList.mockRejectedValue(new Error("catalog down"));

    const result = await runAgent({ ...baseInputs, model: { id: "grok-4.7" } });

    expect(mockAgentCreate).toHaveBeenLastCalledWith(
      expect.objectContaining({ model: { id: "grok-4.7" } })
    );
    expect(result.exitCode).toBe(0);
  });

  it("sends the author's model unchanged when the catalog is too slow", async () => {
    mockModelsList.mockReturnValue(pending());

    const result = await runAgent(
      { ...baseInputs, model: { id: "grok-4.7" } },
      { catalogTimeoutMs: 50 }
    );

    expect(mockAgentCreate).toHaveBeenLastCalledWith(
      expect.objectContaining({ model: { id: "grok-4.7" } })
    );
    expect(result.exitCode).toBe(0);
  });

  it("passes the permission level to Agent.create as tool restrictions", async () => {
    await runAgent({ ...baseInputs, permissions: "read-write" });
    expect(mockAgentCreate).toHaveBeenLastCalledWith(
      expect.objectContaining({ disallowedTools: ["shell", "task"] })
    );

    await runAgent({ ...baseInputs, permissions: "full" });
    const fullCall = mockAgentCreate.mock.calls.at(-1)?.[0];
    expect(fullCall).not.toHaveProperty("tools");
    expect(fullCall).not.toHaveProperty("disallowedTools");
    expect(mockWarning).not.toHaveBeenCalledWith(
      expect.stringContaining("permissions")
    );
  });

  it("returns exitCode 1 and surfaces stderr when SDK throws an error", async () => {
    mockAgentCreate.mockRejectedValue(new Error("Invalid API key"));

    const result = await runAgent(baseInputs);

    expect(result.exitCode).toBe(1);
    expect(result.status).toBe("error");
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
      wait: () =>
        Promise.resolve({
          id: "run-test",
          result: "",
          status: "cancelled" as const,
        }),
    });

    const result = await runAgent({ ...baseInputs, timeout: 1 });

    expect(mockRunCancel).toHaveBeenCalled();
    expect(result.exitCode).toBe(1);
    expect(result.status).toBe("cancelled");
    expect(result.stderr).toContain("timed out");
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
    expect(result.status).toBe("finished");
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
    expect(result.status).toBe("error");
    expect(result.stderr).toContain("Stream aborted");
    expect(mockWarning).toHaveBeenCalledWith(
      expect.stringContaining("Stream aborted")
    );
  });

  it("returns exitCode 1 and surfaces error message when run.wait() finishes with error status", async () => {
    mockAgentSend.mockResolvedValue({
      cancel: mockRunCancel,
      stream: mockStreamSuccess,
      supports: (op: string) => op === "cancel",
      wait: () =>
        Promise.resolve({
          error: { message: "Internal server error during turn" },
          id: "run-test",
          result: "",
          status: "error" as const,
        }),
    });

    const result = await runAgent(baseInputs);

    expect(result.exitCode).toBe(1);
    expect(result.status).toBe("error");
    expect(result.stderr).toContain("Internal server error during turn");
    expect(mockWarning).toHaveBeenCalledWith(
      expect.stringContaining("Internal server error during turn")
    );
  });

  it("captures usage and duration from run.wait()", async () => {
    mockAgentSend.mockResolvedValue({
      cancel: mockRunCancel,
      stream: mockStreamSuccess,
      supports: (op: string) => op === "cancel",
      wait: () =>
        Promise.resolve({
          durationMs: 4200,
          id: "run-test",
          result: "Done analysis",
          status: "finished" as const,
          usage: {
            cacheReadTokens: 10,
            cacheWriteTokens: 5,
            inputTokens: 100,
            outputTokens: 50,
            totalTokens: 150,
          },
        }),
    });

    const result = await runAgent(baseInputs);

    expect(result.exitCode).toBe(0);
    expect(result.durationMs).toBe(4200);
    expect(result.usage?.totalTokens).toBe(150);
  });

  it("collects only assistant text when the run is cancelled before a result exists", async () => {
    const mixedStream = async function* mixedStream() {
      yield thinkingEvent("Let me think about this.");
      yield assistantEvent("Partial ");
      yield {
        agent_id: "agent-test",
        run_id: "run-test",
        text: "subagent chatter",
        type: "task" as const,
      };
      yield assistantEvent("answer");
    };
    mockAgentSend.mockResolvedValue({
      cancel: mockRunCancel,
      stream: mixedStream,
      supports: (op: string) => op === "cancel",
      wait: () =>
        Promise.resolve({ id: "run-test", status: "cancelled" as const }),
    });

    const result = await runAgent(baseInputs);

    expect(result.stdout).toBe("Partial answer");
    expect(result.status).toBe("cancelled");
    expect(result.exitCode).toBe(1);
  });

  it("logs each tool call once and keeps tool events out of the answer", async () => {
    const toolStream = async function* toolStream() {
      yield readToolCall("running");
      yield readToolCall("completed");
      yield assistantEvent("the answer");
    };
    mockAgentSend.mockResolvedValue({
      cancel: mockRunCancel,
      stream: toolStream,
      supports: (op: string) => op === "cancel",
      wait: finishedWait("the answer"),
    });

    const result = await runAgent(baseInputs);

    const toolLines = mockInfo.mock.calls.filter(
      ([line]) => line === "read src/index.ts"
    );
    expect(toolLines).toHaveLength(1);
    expect(result.stdout).toBe("the answer");
  });

  it("prefers the final result text over the streamed text when the run finishes", async () => {
    const partialStream = async function* partialStream() {
      yield assistantEvent("streamed draft");
    };
    mockAgentSend.mockResolvedValue({
      cancel: mockRunCancel,
      stream: partialStream,
      supports: (op: string) => op === "cancel",
      wait: finishedWait("final answer"),
    });

    const result = await runAgent(baseInputs);

    expect(result.stdout).toBe("final answer");
    expect(result.exitCode).toBe(0);
  });

  it("stops waiting when the run ignores the cancel request", async () => {
    mockAgentSend.mockResolvedValue({
      cancel: mockRunCancel,
      stream: neverEndingStream,
      supports: (op: string) => op === "cancel",
      wait: () => pending(),
    });

    const startedAt = Date.now();
    const result = await runAgent(
      { ...baseInputs, timeout: 1 },
      { cancelGraceMs: 200, disposeTimeoutMs: 200 }
    );

    expect(Date.now() - startedAt).toBeLessThan(3000);
    expect(mockRunCancel).toHaveBeenCalled();
    expect(result.exitCode).toBe(1);
    expect(result.status).toBe("cancelled");
    expect(result.stderr).toContain("timed out");
    expect(mockDispose).toHaveBeenCalledTimes(1);
  }, 5000);

  it("releases the agent after a successful run", async () => {
    await runAgent(baseInputs);
    expect(mockDispose).toHaveBeenCalledTimes(1);
  });

  it("releases the agent when send throws", async () => {
    mockAgentSend.mockRejectedValue(new Error("send exploded"));

    const result = await runAgent(baseInputs);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("send exploded");
    expect(mockDispose).toHaveBeenCalledTimes(1);
  });

  it("returns even when releasing the agent hangs", async () => {
    mockDispose.mockImplementation(() => pending());

    const result = await runAgent(baseInputs, { disposeTimeoutMs: 100 });

    expect(result.exitCode).toBe(0);
    expect(mockWarning).toHaveBeenCalledWith(
      expect.stringContaining("did not release")
    );
  });

  it("lists the key's models when Agent.create rejects the model", async () => {
    mockAgentCreate.mockRejectedValue(
      new Error("Cannot use this model: nope. Available models: grok-4.7")
    );

    const result = await runAgent(baseInputs);

    expect(mockModelsList).toHaveBeenCalledTimes(1);
    expect(result.exitCode).toBe(1);
    expect(result.availableModels).toBe(
      [
        "Models this API key can use:",
        "- grok-4.7 (Grok 4.7)",
        "  - grok-4.7[reasoning_effort=medium] (Medium) [default]",
      ].join("\n")
    );
  });

  it("lists the key's models when the run result is a model error", async () => {
    mockAgentSend.mockResolvedValue(
      erroredRun("Model unavailable on Plus. Switch to an included model.")
    );

    const result = await runAgent(baseInputs);

    expect(mockModelsList).toHaveBeenCalledTimes(1);
    expect(result.exitCode).toBe(1);
    expect(result.availableModels).toContain("- grok-4.7 (Grok 4.7)");
  });

  it("lists no models for an error that is not about a model", async () => {
    mockAgentSend.mockResolvedValue(erroredRun("Internal server error"));

    const result = await runAgent(baseInputs);

    expect(result.availableModels).toBeUndefined();
  });

  it("lists no models after a successful run", async () => {
    const result = await runAgent(baseInputs);

    expect(result.availableModels).toBeUndefined();
  });

  it("keeps the run's outcome when the model lookup fails", async () => {
    mockModelsList.mockRejectedValue(new Error("catalog down"));
    mockAgentCreate.mockRejectedValue(new Error("Cannot use this model: nope"));

    const result = await runAgent(baseInputs);

    expect(result.exitCode).toBe(1);
    expect(result.status).toBe("error");
    expect(result.stderr).toBe("Cannot use this model: nope");
    expect(result.availableModels).toBeUndefined();
  });
});
