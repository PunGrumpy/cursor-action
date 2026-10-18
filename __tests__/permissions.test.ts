import { describe, expect, it } from "bun:test";

import { toolRestrictionsFor } from "../src/permissions";

describe("toolRestrictionsFor", () => {
  it("allows only read, search, and web tools for read-only", () => {
    const restrictions = toolRestrictionsFor("read-only");
    expect(restrictions.disallowedTools).toBeUndefined();
    expect(restrictions.tools).toEqual([
      "read",
      "grep",
      "glob",
      "ls",
      "semSearch",
      "readLints",
      "webSearch",
      "webFetch",
      "readTodos",
      "updateTodos",
    ]);
    expect(restrictions.tools).not.toContain("shell");
    expect(restrictions.tools).not.toContain("edit");
    expect(restrictions.tools).not.toContain("task");
    expect(restrictions.tools).not.toContain("mcp");
  });

  it("denies shell and subagents for read-write", () => {
    expect(toolRestrictionsFor("read-write")).toEqual({
      disallowedTools: ["shell", "task"],
    });
  });

  it("leaves the default toolset for full", () => {
    expect(toolRestrictionsFor("full")).toEqual({});
  });
});
