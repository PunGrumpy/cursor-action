import { beforeEach, describe, expect, it, mock } from "bun:test";

import * as actionsHttpClient from "@actions/http-client";

const mockHttpGet = mock();

class MockHttpClient {
  public get = mockHttpGet;
}

mock.module("@actions/http-client", () => ({
  ...actionsHttpClient,
  HttpClient: MockHttpClient,
}));

const { buildDownloadUrl, resolveVersion } = await import("../src/installer");

describe("resolveVersion", () => {
  beforeEach(() => {
    mock.clearAllMocks();
  });

  it("resolves latest from Cursor endpoint and normalizes v prefix", () => {
    mockHttpGet.mockResolvedValue({
      message: { statusCode: 200 },
      readBody: mock(() => Promise.resolve("v2026.03.20-44cb435\n")),
    });

    expect(resolveVersion("latest")).resolves.toBe("2026.03.20-44cb435");
    expect(mockHttpGet).toHaveBeenCalledTimes(1);
    expect(mockHttpGet).toHaveBeenCalledWith(
      "https://downloads.cursor.com/lab/latest-version"
    );
  });

  it("falls back to install script when latest-version is non-200", () => {
    const accessDeniedXml = `<?xml version="1.0" encoding="UTF-8"?><Error><Code>AccessDenied</Code></Error>`;
    const bashSnippet = `DOWNLOAD_URL="https://downloads.cursor.com/lab/2026.03.20-44cb435/\${OS}/\${ARCH}/agent-cli-package.tar.gz"`;

    mockHttpGet
      .mockResolvedValueOnce({
        message: { statusCode: 403 },
        readBody: mock(() => Promise.resolve(accessDeniedXml)),
      })
      .mockResolvedValueOnce({
        message: { statusCode: 200 },
        readBody: mock(() =>
          Promise.resolve(`#!/usr/bin/env bash\n${bashSnippet}\n`)
        ),
      });

    expect(resolveVersion("latest")).resolves.toBe("2026.03.20-44cb435");
    expect(mockHttpGet).toHaveBeenCalledTimes(2);
    expect(mockHttpGet).toHaveBeenNthCalledWith(
      1,
      "https://downloads.cursor.com/lab/latest-version"
    );
    expect(mockHttpGet).toHaveBeenNthCalledWith(
      2,
      "https://cursor.com/install"
    );
  });

  it("returns pinned version without calling network", () => {
    expect(resolveVersion("v1.2.3")).resolves.toBe("1.2.3");
    expect(mockHttpGet).not.toHaveBeenCalled();
  });
});

describe("buildDownloadUrl", () => {
  it("uses windows path segment and zip extension for win32", () => {
    expect(buildDownloadUrl("1.2.3", "win32", "x64")).toBe(
      "https://downloads.cursor.com/lab/1.2.3/windows/x64/agent-cli-package.zip"
    );
  });

  it("uses tar.gz for linux and darwin", () => {
    expect(buildDownloadUrl("1.2.3", "linux", "arm64")).toBe(
      "https://downloads.cursor.com/lab/1.2.3/linux/arm64/agent-cli-package.tar.gz"
    );
    expect(buildDownloadUrl("1.2.3", "darwin", "x64")).toBe(
      "https://downloads.cursor.com/lab/1.2.3/darwin/x64/agent-cli-package.tar.gz"
    );
  });
});
