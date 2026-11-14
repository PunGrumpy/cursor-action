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
    model: "composer-2.5",
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
    expect(inputs.model).toEqual({ id: "composer-2.5" });
    expect(inputs.permissions).toBe("read-only");
    expect(inputs.timeout).toBe(300);
  });

  it("falls back to composer-2.5 when model is empty", () => {
    setupInputs({ model: "" });
    expect(getInputs().model).toEqual({ id: "composer-2.5" });
  });

  it("parses a bracketed model value into a selection with params", () => {
    setupInputs({ model: "grok-4.7[reasoning_effort=medium]" });
    expect(getInputs().model).toEqual({
      id: "grok-4.7",
      params: [{ id: "reasoning_effort", value: "medium" }],
    });
  });

  it("throws on a malformed model value", () => {
    setupInputs({ model: "grok-4.7[fast" });
    expect(() => getInputs()).toThrow(/Invalid 'model'/u);
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

  it("removes the API key from the environment once read", () => {
    process.env["INPUT_API-KEY"] = "test-api-key";
    try {
      setupInputs();
      const inputs = getInputs();
      expect(process.env["INPUT_API-KEY"]).toBeUndefined();
      expect(inputs.apiKey).toBe("test-api-key");
    } finally {
      Reflect.deleteProperty(process.env, "INPUT_API-KEY");
    }
  });

  it("removes the API key even when another input is invalid", () => {
    process.env["INPUT_API-KEY"] = "test-api-key";
    try {
      setupInputs({ permissions: "bogus" });
      expect(() => getInputs()).toThrow(/Invalid 'permissions'/u);
      expect(process.env["INPUT_API-KEY"]).toBeUndefined();
    } finally {
      Reflect.deleteProperty(process.env, "INPUT_API-KEY");
    }
  });
});
