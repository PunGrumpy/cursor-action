import { describe, expect, it } from "bun:test";

import type { SDKMessage } from "@cursor/sdk";

import { toolCallLine } from "../src/progress";

const MAX_TARGET_LENGTH = 160;

const toolCall = (
  name: string,
  args?: unknown,
  overrides: {
    callId?: string;
    status?: "running" | "completed" | "error";
  } = {}
): SDKMessage => ({
  agent_id: "agent-test",
  args,
  call_id: overrides.callId ?? "call-1",
  name,
  run_id: "run-test",
  status: overrides.status ?? "running",
  type: "tool_call",
});

describe("toolCallLine", () => {
  it("names the tool and its path", () => {
    expect(
      toolCallLine(toolCall("read", { path: "src/index.ts" }), new Set())
    ).toBe("read src/index.ts");
  });

  it("collapses whitespace and newlines in a shell command", () => {
    const command = "bun test\n  --bail\t\t&&   echo done\n";
    expect(toolCallLine(toolCall("shell", { command }), new Set())).toBe(
      "shell bun test --bail && echo done"
    );
  });

  it("joins a list of paths", () => {
    expect(
      toolCallLine(
        toolCall("readLints", { paths: ["a.ts", "b.ts"] }),
        new Set()
      )
    ).toBe("readLints a.ts, b.ts");
  });

  it("prints only the name of a tool with no known target field", () => {
    expect(toolCallLine(toolCall("webFetch", { url: "x" }), new Set())).toBe(
      "webFetch"
    );
  });

  it.each([
    ["missing", undefined],
    ["null", null],
    ["a string", "src/index.ts"],
  ])("prints only the name when args is %s", (_label, args) => {
    expect(toolCallLine(toolCall("read", args), new Set())).toBe("read");
  });

  it("prints only the name when the target field is not a string", () => {
    expect(toolCallLine(toolCall("read", { path: 7 }), new Set())).toBe("read");
  });

  it("cuts a long command to 160 characters and marks the cut", () => {
    const line = toolCallLine(
      toolCall("shell", { command: "x".repeat(500) }),
      new Set()
    );
    expect(line).toBe(`shell ${"x".repeat(MAX_TARGET_LENGTH)}…`);
  });

  it("logs a call once when it reports running and then completed", () => {
    const seen = new Set<string>();
    const args = { path: "src/index.ts" };
    expect(toolCallLine(toolCall("read", args), seen)).toBe(
      "read src/index.ts"
    );
    expect(
      toolCallLine(toolCall("read", args, { status: "completed" }), seen)
    ).toBeUndefined();
  });

  it("logs each distinct call", () => {
    const seen = new Set<string>();
    expect(
      toolCallLine(toolCall("grep", { pattern: "TODO" }, { callId: "a" }), seen)
    ).toBe("grep TODO");
    expect(
      toolCallLine(
        toolCall("grep", { pattern: "FIXME" }, { callId: "b" }),
        seen
      )
    ).toBe("grep FIXME");
  });

  it("adds a failure line after the running line", () => {
    const seen = new Set<string>();
    const args = { path: "src/index.ts" };
    toolCallLine(toolCall("read", args), seen);
    expect(
      toolCallLine(toolCall("read", args, { status: "error" }), seen)
    ).toBe("read src/index.ts failed");
  });

  it("reports a failure without a target as the name and failed", () => {
    expect(
      toolCallLine(
        toolCall("webFetch", undefined, { status: "error" }),
        new Set()
      )
    ).toBe("webFetch failed");
  });

  it("ignores events that are not tool calls", () => {
    const event: SDKMessage = {
      agent_id: "agent-test",
      message: { content: [{ text: "hi", type: "text" }], role: "assistant" },
      run_id: "run-test",
      type: "assistant",
    };
    expect(toolCallLine(event, new Set())).toBeUndefined();
  });
});
