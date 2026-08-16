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
    model: "default",
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
    expect(inputs.model).toBe("default");
    expect(inputs.permissions).toBe("read-only");
    expect(inputs.timeout).toBe(300);
  });

  it("warns if cursor-version is provided and not latest", () => {
    setupInputs({ "cursor-version": "1.2.3" });
    const inputs = getInputs();
    expect(inputs.cursorVersion).toBe("1.2.3");
    expect(mockWarning).toHaveBeenCalledWith(
      expect.stringContaining("deprecated")
    );
  });

  it("treats empty cursor-version as omitted (undefined), matching optional typing", () => {
    setupInputs({ "cursor-version": "" });
    const inputs = getInputs();
    expect(inputs.cursorVersion).toBeUndefined();
    expect(mockWarning).not.toHaveBeenCalledWith(
      expect.stringContaining("deprecated")
    );
  });

  it("trims cursor-version whitespace", () => {
    setupInputs({ "cursor-version": "  1.0.0  " });
    const inputs = getInputs();
    expect(inputs.cursorVersion).toBe("1.0.0");
    expect(mockWarning).toHaveBeenCalledWith(
      expect.stringContaining("deprecated")
    );
  });

  it("throws on invalid permission value", () => {
    setupInputs({ permissions: "superuser" });
    expect(() => getInputs()).toThrow(/Invalid 'permissions'/u);
  });

  it("throws on invalid timeout", () => {
    setupInputs({ timeout: "abc" });
    expect(() => getInputs()).toThrow(/Invalid 'timeout'/u);
  });

  it("throws on zero timeout", () => {
    setupInputs({ timeout: "0" });
    expect(() => getInputs()).toThrow(/Invalid 'timeout'/u);
  });

  it("throws on empty prompt", () => {
    setupInputs({ prompt: "   " });
    expect(() => getInputs()).toThrow(/cannot be empty/u);
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
