import { describe, expect, it } from "bun:test";

import type { SDKMessage } from "@cursor/sdk";

import { toolCallLine } from "../src/progress";

const MAX_TARGET_LENGTH = 160;

const toolCall = (
  name: string,
  args?: unknown,
  overrides: {
    result?: unknown;
    status?: "running" | "completed" | "error";
  } = {}
): SDKMessage => ({
  agent_id: "agent-test",
  args,
  call_id: "call-1",
  name,
  result: overrides.result,
  run_id: "run-test",
  status: overrides.status ?? "completed",
  type: "tool_call",
});

describe("toolCallLine", () => {
  it("names the tool and its path", () => {
    expect(toolCallLine(toolCall("read", { path: "src/index.ts" }))).toBe(
      "read src/index.ts"
    );
  });

  it("skips running events, whose arguments may still be streaming", () => {
    expect(
      toolCallLine(toolCall("read", { path: "src/in" }, { status: "running" }))
    ).toBeUndefined();
  });

  it("collapses whitespace and newlines in a shell command", () => {
    const command = "bun test\n  --bail\t\t&&   echo done\n";
    expect(toolCallLine(toolCall("shell", { command }))).toBe(
      "shell bun test --bail && echo done"
    );
  });

  it("joins a list of paths", () => {
    expect(
      toolCallLine(toolCall("readLints", { paths: ["a.ts", "b.ts"] }))
    ).toBe("readLints a.ts, b.ts");
  });

  it("prints only the name of a tool with no known target field", () => {
    expect(toolCallLine(toolCall("unknown", { url: "x" }))).toBe("unknown");
  });

  it.each([
    ["missing", undefined],
    ["null", null],
    ["a string", "src/index.ts"],
  ])("prints only the name when args is %s", (_label, args) => {
    expect(toolCallLine(toolCall("read", args))).toBe("read");
  });

  it("prints only the name when the target field is not a string", () => {
    expect(toolCallLine(toolCall("read", { path: 7 }))).toBe("read");
  });

  it("cuts a long command to 160 characters and marks the cut", () => {
    const line = toolCallLine(toolCall("shell", { command: "x".repeat(500) }));
    expect(line).toBe(`shell ${"x".repeat(MAX_TARGET_LENGTH)}…`);
  });

  it("marks a completed call whose result is an error as failed", () => {
    const result = { error: { message: "ENOENT" }, status: "error" };
    expect(
      toolCallLine(toolCall("read", { path: "src/index.ts" }, { result }))
    ).toBe("read src/index.ts failed");
  });

  it("does not mark a shell command that exited non-zero as failed", () => {
    const result = { status: "success", value: { exitCode: 1 } };
    expect(
      toolCallLine(toolCall("shell", { command: "bun test" }, { result }))
    ).toBe("shell bun test");
  });

  it("marks an event with error status as failed", () => {
    expect(toolCallLine(toolCall("grep", undefined, { status: "error" }))).toBe(
      "grep failed"
    );
  });

  it("ignores events that are not tool calls", () => {
    const event: SDKMessage = {
      agent_id: "agent-test",
      message: { content: [{ text: "hi", type: "text" }], role: "assistant" },
      run_id: "run-test",
      type: "assistant",
    };
    expect(toolCallLine(event)).toBeUndefined();
  });
});
