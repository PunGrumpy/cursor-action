import { beforeEach, describe, expect, it, mock } from "bun:test";

import * as actionsCore from "@actions/core";

const mockGetInput = mock<typeof actionsCore.getInput>();

mock.module("@actions/core", () => ({
  ...actionsCore,
  getInput: mockGetInput,
  warning: mock<typeof actionsCore.warning>(),
}));

const { getInputs } = await import("../src/input");

const setupTimeout = (timeout: string): void => {
  const inputs: Record<string, string> = {
    "api-key": "test-api-key",
    prompt: "Review this code",
    timeout,
  };
  mockGetInput.mockImplementation((name) => inputs[name] ?? "");
};

describe("getInputs timeout limits", () => {
  beforeEach(() => {
    mockGetInput.mockReset();
  });

  it.each(["Infinity", "-Infinity", "10000000", "2147484"])(
    "rejects timeout %s, which would leave the run without a deadline",
    (value) => {
      setupTimeout(value);
      expect(() => getInputs()).toThrow(/Invalid 'timeout'/u);
    }
  );

  it("accepts the largest timeout a timer can honour", () => {
    setupTimeout("2147483");
    expect(getInputs().timeout).toBe(2_147_483);
  });
});
