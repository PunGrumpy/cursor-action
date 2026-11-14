import type { SDKMessage } from "@cursor/sdk";

/** The argument that names what each tool acts on. */
const TARGET_FIELD: Readonly<Record<string, string>> = {
  delete: "path",
  edit: "path",
  glob: "globPattern",
  grep: "pattern",
  ls: "path",
  mcp: "toolName",
  read: "path",
  readLints: "paths",
  semSearch: "query",
  shell: "command",
  task: "description",
  write: "path",
};

const MAX_TARGET_LENGTH = 160;
const WHITESPACE = /\s+/gu;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const rawTarget = (name: string, args: unknown): string => {
  const field = TARGET_FIELD[name];
  if (field === undefined || typeof args !== "object" || args === null) {
    return "";
  }
  const value: unknown = Reflect.get(args, field);
  if (typeof value === "string") {
    return value;
  }
  return isStringArray(value) ? value.join(", ") : "";
};

const targetOf = (name: string, args: unknown): string => {
  const target = rawTarget(name, args).replace(WHITESPACE, " ").trim();
  return target.length > MAX_TARGET_LENGTH
    ? `${target.slice(0, MAX_TARGET_LENGTH)}…`
    : target;
};

/** One log line for the first event of each tool call, and one more if it fails. */
export const toolCallLine = (
  event: SDKMessage,
  seen: Set<string>
): string | undefined => {
  if (event.type !== "tool_call") {
    return undefined;
  }
  const failed = event.status === "error";
  if (!failed && seen.has(event.call_id)) {
    return undefined;
  }
  seen.add(event.call_id);
  const target = targetOf(event.name, event.args);
  return [event.name, target, failed ? "failed" : ""]
    .filter((part) => part !== "")
    .join(" ");
};
