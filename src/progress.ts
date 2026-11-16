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

const reportsError = (result: unknown): boolean =>
  typeof result === "object" &&
  result !== null &&
  Reflect.get(result, "status") === "error";

/**
 * One log line per finished tool call. Running events are skipped because the
 * server can stream them while the model is still writing the arguments.
 */
export const toolCallLine = (event: SDKMessage): string | undefined => {
  if (event.type !== "tool_call" || event.status === "running") {
    return undefined;
  }
  const failed = event.status === "error" || reportsError(event.result);
  return [event.name, targetOf(event.name, event.args), failed ? "failed" : ""]
    .filter((part) => part !== "")
    .join(" ");
};
