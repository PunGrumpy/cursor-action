import { getInput, warning } from "@actions/core";

import type { ActionInputs, Permission } from "./types";

const VALID_PERMISSIONS: Permission[] = ["read-only", "read-write", "full"];

export const getInputs = (): ActionInputs => {
  const cursorVersionRaw = getInput("cursor-version", { required: false });
  const cursorVersion =
    cursorVersionRaw.trim().length > 0 ? cursorVersionRaw.trim() : undefined;
  const apiKey = getInput("api-key", { required: true });
  const prompt = getInput("prompt", { required: true });
  const model = getInput("model", { required: false }) || "auto";
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

  const timeout = Number.parseInt(timeoutRaw, 10);
  if (Number.isNaN(timeout) || timeout <= 0) {
    throw new Error(
      `Invalid 'timeout' value: '${timeoutRaw}'. Must be a positive integer (seconds).`
    );
  }

  if (timeout > 3600) {
    warning(
      `Timeout is set to ${timeout}s (${Math.round(timeout / 60)}min). ` +
        `This is unusually long — consider if your prompt can be shortened.`
    );
  }

  if (!prompt.trim()) {
    throw new Error("The 'prompt' input cannot be empty.");
  }

  return {
    apiKey,
    ...(cursorVersion !== undefined ? { cursorVersion } : {}),
    model,
    permissions: permissionsRaw as Permission,
    prompt,
    timeout,
    workingDirectory,
  };
};
