import { setOutput, setSecret, summary } from "@actions/core";

import type { ActionOutputs, AgentResult } from "./types";

const parseSummary = (stdout: string): string => {
  const trimmed = stdout.trim();
  if (!trimmed) {
    return "";
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === "object" && parsed !== null) {
      if (typeof parsed.response === "string") {
        return parsed.response.trim();
      }
      if (typeof parsed.summary === "string") {
        return parsed.summary.trim();
      }
      if (typeof parsed.result === "string") {
        return parsed.result.trim();
      }
      if (typeof parsed.output === "string") {
        return parsed.output.trim();
      }
      if (typeof parsed.text === "string") {
        return parsed.text.trim();
      }
    }
  } catch {
    // Not JSON
  }

  const clean = trimmed.replaceAll(
    // eslint-disable-next-line no-control-regex
    /\u001B\[[0-9;]*[mGKHF]/gu,
    ""
  );

  return clean;
};

const writeJobSummary = async (
  text: string,
  result: AgentResult
): Promise<void> => {
  const status =
    result.exitCode === 0
      ? "✅ Success"
      : `❌ Failed (exit ${result.exitCode})`;

  await summary
    .addHeading("Cursor Agent Run", 2)
    .addTable([
      [
        { data: "Field", header: true },
        { data: "Value", header: true },
      ],
      ["Status", status],
      ["Exit Code", String(result.exitCode)],
    ])
    .addHeading("Agent Response", 3)
    .addRaw(text ? `\n\`\`\`\n${text}\n\`\`\`\n` : "_No output was produced._");

  const errText = result.stderr.trim();
  if (errText) {
    await summary
      .addHeading("Agent Error (stderr)", 3)
      .addRaw(
        `\n\`\`\`\n${errText.slice(0, 20_000)}${errText.length > 20_000 ? "\n… (truncated)" : ""}\n\`\`\`\n`
      );
  }

  const diag = result.diagnostics?.trim();
  if (diag && diag !== errText) {
    await summary
      .addHeading("Diagnostics", 3)
      .addRaw(
        `\n\`\`\`\n${diag.slice(0, 20_000)}${diag.length > 20_000 ? "\n… (truncated)" : ""}\n\`\`\`\n`
      );
  }

  await summary.write();
};

export const setOutputs = async (
  result: AgentResult
): Promise<ActionOutputs> => {
  const text = parseSummary(result.stdout);

  setOutput("summary", text);
  setOutput("exit-code", String(result.exitCode));

  await writeJobSummary(text, result);

  return {
    exitCode: result.exitCode,
    summary: text,
  };
};

export const maskSecret = (apiKey: string): void => setSecret(apiKey);
