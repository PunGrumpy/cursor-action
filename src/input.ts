import { getInput, warning } from "@actions/core";

import { CURSOR_LAB_VERSION_RE } from "./cursor-version";
import type { ActionInputs, Permission } from "./types";

const VALID_PERMISSIONS: Permission[] = ["read-only", "read-write", "full"];

/**
 * Reads, validates, and returns all action inputs.
 * @returns The validated action inputs.
 * @throws Throws descriptive errors for invalid inputs so users get clear feedback.
 */
export const getInputs = (): ActionInputs => {
  const cursorVersion =
    getInput("cursor-version", { required: false }) || "latest";
  const apiKey = getInput("api-key", { required: true });
  const prompt = getInput("prompt", { required: true });
  const model = getInput("model", { required: false }) || "auto";
  const workingDirectory =
    getInput("working-directory", { required: false }) || ".";
  const permissionsRaw =
    getInput("permissions", { required: false }) || "read-only";
  const timeoutRaw = getInput("timeout", { required: false }) || "300";

  // Validate permissions
  if (!VALID_PERMISSIONS.includes(permissionsRaw as Permission)) {
    throw new Error(
      `Invalid 'permissions' value: '${permissionsRaw}'. ` +
        `Must be one of: ${VALID_PERMISSIONS.join(", ")}`
    );
  }

  // Validate timeout
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

  // Validate version: "latest" or a published lab build id (see official install script / latest-version)
  const normalizedCursorVersion = cursorVersion.replace(/^v/, "");
  if (
    cursorVersion !== "latest" &&
    !CURSOR_LAB_VERSION_RE.test(normalizedCursorVersion)
  ) {
    throw new Error(
      `Invalid 'cursor-version' value: '${cursorVersion}'. ` +
        `Use 'latest', or pin an exact build id that exists on Cursor's CDN ` +
        `(e.g. the value from https://downloads.cursor.com/lab/latest-version, ` +
        `like '2026.03.20-44cb435'). Arbitrary values like '1.2.3' are not published and will fail to download.`
    );
  }

  // Validate prompt is not empty
  if (!prompt.trim()) {
    throw new Error("The 'prompt' input cannot be empty.");
  }

  return {
    apiKey,
    cursorVersion,
    model,
    permissions: permissionsRaw as Permission,
    prompt,
    timeout,
    workingDirectory,
  };
};
