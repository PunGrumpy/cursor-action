/** Cursor CLI lab artifacts use build ids like `2026.03.20-44cb435`. */
export const CURSOR_LAB_VERSION_RE = /^\d+\.\d+\.\d+(?:-[A-Za-z0-9]+)?$/;

/**
 * Parses a plain-text latest-version response body (single line, optional `v` prefix).
 */
export const parseLabVersionString = (body: string): string | null => {
  const firstLine =
    body.trim().replace(/^v/, "").split(/\r?\n/)[0]?.trim() ?? "";
  return CURSOR_LAB_VERSION_RE.test(firstLine) ? firstLine : null;
};

/**
 * Extracts the lab build id from the official bash or PowerShell install script body.
 */
export const extractLabVersionFromInstallScript = (
  body: string
): string | null => {
  const m = body.match(/https:\/\/downloads\.cursor\.com\/lab\/([^/'"\s]+)\//);
  const candidate = m?.[1]?.trim();
  if (!candidate || !CURSOR_LAB_VERSION_RE.test(candidate)) {
    return null;
  }
  return candidate;
};
