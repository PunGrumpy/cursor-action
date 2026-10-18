import type { AgentOptions } from "@cursor/sdk";

import type { Permission } from "./types";

export type ToolRestrictions = Pick<AgentOptions, "disallowedTools" | "tools">;

/**
 * Tool names come from the SDK's `ToolName` vocabulary
 * (node_modules/@cursor/sdk/dist/esm/options.d.ts). `Agent.create` throws a
 * ConfigurationError for a name it does not know, so only use names from that
 * literal list.
 */
const READ_ONLY_TOOLS = [
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
] as const;

/** File edits stay available; commands and subagents (which carry their own shell) do not. */
const READ_WRITE_DISALLOWED_TOOLS = ["shell", "task"] as const;

export const toolRestrictionsFor = (
  permission: Permission
): ToolRestrictions => {
  switch (permission) {
    case "read-only": {
      return { tools: [...READ_ONLY_TOOLS] };
    }
    case "read-write": {
      return { disallowedTools: [...READ_WRITE_DISALLOWED_TOOLS] };
    }
    case "full": {
      return {};
    }
    default: {
      const unhandled: never = permission;
      throw new Error(`Unhandled permissions value: ${String(unhandled)}`);
    }
  }
};
