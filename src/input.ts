import { getInput, warning } from "@actions/core";

import { parseModel } from "./model";
import type { ActionInputs, Permission } from "./types";

const DEFAULT_MODEL = "composer-2.5";
const VALID_PERMISSIONS: Permission[] = ["read-only", "read-write", "full"];
/** Longest delay Node's timers accept; the runner skips the deadline beyond it. */
const MAX_TIMER_MS = 2_147_483_647;
/** The variable `@actions/core` reads for the `api-key` input. */
const API_KEY_ENV = "INPUT_API-KEY";

export const getInputs = (): ActionInputs => {
  const cursorVersionRaw = getInput("cursor-version", { required: false });
  const cursorVersion =
    cursorVersionRaw.trim().length > 0 ? cursorVersionRaw.trim() : undefined;
  const apiKey = getInput("api-key", { required: true });
  // Shell commands and hooks the agent runs inherit process.env; the SDK gets the key directly.
  Reflect.deleteProperty(process.env, API_KEY_ENV);
  const prompt = getInput("prompt", { required: true });
  const model = parseModel(
    getInput("model", { required: false }) || DEFAULT_MODEL
  );
  const workingDirectory =
    getInput("working-directory", { required: false }) || ".";
  const permissionsRaw =
    getInput("permissions", { required: false }) || "read-only";
  const timeoutRaw = getInput("timeout", { required: false }) || "300";

  if (cursorVersion && cursorVersion !== "latest") {
    warning(
      "The 'cursor-version' input is deprecated. The Action now uses the official @cursor/sdk " +
        "which automatically manages the agent version."
    );
  }

  if (!VALID_PERMISSIONS.includes(permissionsRaw as Permission)) {
    throw new Error(
      `Invalid 'permissions' value: '${permissionsRaw}'. ` +
        `Must be one of: ${VALID_PERMISSIONS.join(", ")}`
    );
  }

  const timeout = Math.trunc(Number(timeoutRaw));
  if (
    !Number.isFinite(timeout) ||
    timeout <= 0 ||
    timeout * 1000 > MAX_TIMER_MS
  ) {
    throw new Error(
      `Invalid 'timeout' value: '${timeoutRaw}'. Must be a positive integer (seconds) of at most ${Math.floor(MAX_TIMER_MS / 1000)}.`
    );
  }

  if (timeout > 3600) {
    warning(
      `Timeout is set to ${timeout}s (${Math.round(timeout / 60)}min). ` +
        "This is unusually long. Consider if your prompt can be shortened."
    );
  }

  if (!prompt.trim()) {
    throw new Error("The 'prompt' input cannot be empty.");
  }

  return {
    apiKey,
    ...(cursorVersion === undefined ? {} : { cursorVersion }),
    model,
    permissions: permissionsRaw as Permission,
    prompt,
    timeout,
    workingDirectory,
  };
};
