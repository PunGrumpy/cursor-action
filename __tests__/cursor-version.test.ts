import { describe, expect, it } from "bun:test";

import {
  extractLabVersionFromInstallScript,
  parseLabVersionString,
} from "../src/cursor-version";

describe("parseLabVersionString", () => {
  it("accepts lab build id with optional v prefix and trailing newline", () => {
    expect(parseLabVersionString("v2026.03.20-44cb435\n")).toBe(
      "2026.03.20-44cb435"
    );
  });

  it("rejects S3 AccessDenied XML bodies", () => {
    expect(
      parseLabVersionString(
        '<?xml version="1.0"?><Error><Code>AccessDenied</Code></Error>'
      )
    ).toBeNull();
  });
});

describe("extractLabVersionFromInstallScript", () => {
  it("parses DOWNLOAD_URL from bash installer", () => {
    const script = `DOWNLOAD_URL="https://downloads.cursor.com/lab/2026.03.20-44cb435/\${OS}/\${ARCH}/agent-cli-package.tar.gz"`;
    expect(extractLabVersionFromInstallScript(script)).toBe(
      "2026.03.20-44cb435"
    );
  });

  it("parses lab URL from PowerShell installer", () => {
    const script = `$downloadUrl = 'https://downloads.cursor.com/lab/2026.03.20-44cb435/'`;
    expect(extractLabVersionFromInstallScript(script)).toBe(
      "2026.03.20-44cb435"
    );
  });
});
