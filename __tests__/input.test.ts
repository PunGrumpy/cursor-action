import { beforeEach, describe, expect, it, mock } from "bun:test";

import * as actionsCore from "@actions/core";

const mockGetInput = mock<typeof actionsCore.getInput>();
const mockWarning = mock<typeof actionsCore.warning>();

mock.module("@actions/core", () => ({
  ...actionsCore,
  getInput: mockGetInput,
  warning: mockWarning,
}));

const { getInputs } = await import("../src/input");

const setupInputs = (overrides: Record<string, string> = {}): void => {
  const defaults: Record<string, string> = {
    "api-key": "test-api-key",
    "cursor-version": "latest",
    model: "auto",
    permissions: "read-only",
    prompt: "Review this code",
    timeout: "300",
    "working-directory": ".",
    ...overrides,
  };
  mockGetInput.mockImplementation((name) => defaults[name] ?? "");
};

describe("getInputs", () => {
  beforeEach(() => {
    mock.clearAllMocks();
  });

  it("returns valid inputs with defaults", () => {
    setupInputs();
    const inputs = getInputs();
    expect(inputs.cursorVersion).toBe("latest");
    expect(inputs.apiKey).toBe("test-api-key");
    expect(inputs.prompt).toBe("Review this code");
    expect(inputs.model).toBe("auto");
    expect(inputs.permissions).toBe("read-only");
    expect(inputs.timeout).toBe(300);
  });

  it("accepts a pinned semver version", () => {
    setupInputs({ "cursor-version": "1.2.3" });
    const inputs = getInputs();
    expect(inputs.cursorVersion).toBe("1.2.3");
  });

  it("accepts a pinned semver version with v prefix", () => {
    setupInputs({ "cursor-version": "v1.2.3" });
    const inputs = getInputs();
    expect(inputs.cursorVersion).toBe("v1.2.3");
  });

  it("accepts a pinned Cursor lab build id", () => {
    setupInputs({ "cursor-version": "2026.03.20-44cb435" });
    const inputs = getInputs();
    expect(inputs.cursorVersion).toBe("2026.03.20-44cb435");
  });

  it("accepts a pinned lab build id with v prefix", () => {
    setupInputs({ "cursor-version": "v2026.03.20-44cb435" });
    const inputs = getInputs();
    expect(inputs.cursorVersion).toBe("v2026.03.20-44cb435");
  });

  it("throws on invalid permission value", () => {
    setupInputs({ permissions: "superuser" });
    expect(() => getInputs()).toThrow(/Invalid 'permissions'/);
  });

  it("throws on invalid timeout", () => {
    setupInputs({ timeout: "abc" });
    expect(() => getInputs()).toThrow(/Invalid 'timeout'/);
  });

  it("throws on zero timeout", () => {
    setupInputs({ timeout: "0" });
    expect(() => getInputs()).toThrow(/Invalid 'timeout'/);
  });

  it("throws on empty prompt", () => {
    setupInputs({ prompt: "   " });
    expect(() => getInputs()).toThrow(/cannot be empty/);
  });

  it("throws on invalid version format", () => {
    setupInputs({ "cursor-version": "not-a-version" });
    expect(() => getInputs()).toThrow(/Invalid 'cursor-version'/);
  });

  it("warns on very long timeout", () => {
    setupInputs({ timeout: "7200" });
    getInputs();
    expect(mockWarning).toHaveBeenCalledWith(
      expect.stringContaining("unusually long")
    );
  });

  it("accepts all valid permission values", () => {
    for (const perm of ["read-only", "read-write", "full"] as const) {
      setupInputs({ permissions: perm });
      const inputs = getInputs();
      expect(inputs.permissions).toBe(perm);
    }
  });
});
