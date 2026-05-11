import { beforeEach, describe, expect, it, mock } from "bun:test";

import * as actionsCore from "@actions/core";

const mockSetOutput = mock<typeof actionsCore.setOutput>();
const mockSetSecret = mock<typeof actionsCore.setSecret>();

const mockSummaryChain = {
  addHeading: mock(() => mockSummaryChain),
  addRaw: mock(() => mockSummaryChain),
  addTable: mock(() => mockSummaryChain),
  write: mock(() => Promise.resolve()),
};

mock.module("@actions/core", () => ({
  ...actionsCore,
  setOutput: mockSetOutput,
  setSecret: mockSetSecret,
  summary: mockSummaryChain,
}));

const { setOutputs, maskSecret } = await import("../src/output");

describe("setOutputs", () => {
  beforeEach(() => {
    mock.clearAllMocks();
    mockSummaryChain.addHeading.mockReturnValue(mockSummaryChain);
    mockSummaryChain.addTable.mockReturnValue(mockSummaryChain);
    mockSummaryChain.addRaw.mockReturnValue(mockSummaryChain);
    mockSummaryChain.write.mockResolvedValue();
  });

  it("sets outputs for plain text response", async () => {
    const result = {
      exitCode: 0,
      stderr: "",
      stdout: "Here is my analysis.",
    };
    const outputs = await setOutputs(result);

    expect(mockSetOutput).toHaveBeenCalledWith(
      "summary",
      "Here is my analysis."
    );
    expect(mockSetOutput).toHaveBeenCalledWith("exit-code", "0");
    expect(outputs.summary).toBe("Here is my analysis.");
    expect(outputs.exitCode).toBe(0);
    expect(mockSummaryChain.write).toHaveBeenCalled();
  });

  it("extracts summary from JSON response field", async () => {
    const result = {
      exitCode: 0,
      stderr: "",
      stdout: JSON.stringify({ response: "JSON response text" }),
    };
    const outputs = await setOutputs(result);
    expect(outputs.summary).toBe("JSON response text");
  });

  it("extracts summary from JSON summary field", async () => {
    const result = {
      exitCode: 0,
      stderr: "",
      stdout: JSON.stringify({ summary: "Summary field text" }),
    };
    const outputs = await setOutputs(result);
    expect(outputs.summary).toBe("Summary field text");
  });

  it("extracts summary from JSON result field", async () => {
    const result = {
      exitCode: 0,
      stderr: "",
      stdout: JSON.stringify({ result: "Result field text" }),
    };
    const outputs = await setOutputs(result);
    expect(outputs.summary).toBe("Result field text");
  });

  it("extracts summary from JSON output field", async () => {
    const result = {
      exitCode: 0,
      stderr: "",
      stdout: JSON.stringify({ output: "Output field text" }),
    };
    const outputs = await setOutputs(result);
    expect(outputs.summary).toBe("Output field text");
  });

  it("extracts summary from JSON text field", async () => {
    const result = {
      exitCode: 0,
      stderr: "",
      stdout: JSON.stringify({ text: "Text field value" }),
    };
    const outputs = await setOutputs(result);
    expect(outputs.summary).toBe("Text field value");
  });

  it("handles empty stdout gracefully", async () => {
    const result = { exitCode: 0, stderr: "", stdout: "" };
    const outputs = await setOutputs(result);
    expect(outputs.summary).toBe("");
  });

  it("strips ANSI escape codes from stdout", async () => {
    const result = {
      exitCode: 0,
      stderr: "",
      stdout: "\u001B[32mGreen text\u001B[0m",
    };
    const outputs = await setOutputs(result);
    expect(outputs.summary).toBe("Green text");
  });

  it("passes through non-zero exit codes", async () => {
    const result = {
      exitCode: 1,
      stderr: "something failed",
      stdout: "error output",
    };
    const outputs = await setOutputs(result);
    expect(outputs.exitCode).toBe(1);
    expect(mockSetOutput).toHaveBeenCalledWith("exit-code", "1");
  });
});

describe("maskSecret", () => {
  it("calls setSecret with the api key", () => {
    maskSecret("my-secret-key");
    expect(mockSetSecret).toHaveBeenCalledWith("my-secret-key");
  });
});
