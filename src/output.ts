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

const buildSummaryTableRows = (result: AgentResult): string[][] => {
  const status =
    result.exitCode === 0
      ? "✅ Success"
      : `❌ Failed (exit ${result.exitCode})`;

  const rows: string[][] = [
    ["Status", status],
    ["Exit Code", String(result.exitCode)],
  ];

  if (result.status) {
    rows.push(["Agent Status", result.status]);
  }

  if (result.durationMs !== undefined) {
    rows.push(["Duration", `${(result.durationMs / 1000).toFixed(1)}s`]);
  }

  const { usage } = result;
  if (usage?.inputTokens !== undefined) {
    rows.push(["Input Tokens", String(usage.inputTokens)]);
  }

  if (usage?.outputTokens !== undefined) {
    rows.push(["Output Tokens", String(usage.outputTokens)]);
  }

  if (usage?.cacheReadTokens !== undefined && usage.cacheReadTokens > 0) {
    rows.push(["Cache Read Tokens", String(usage.cacheReadTokens)]);
  }

  if (usage?.totalTokens !== undefined) {
    rows.push(["Total Tokens", String(usage.totalTokens)]);
  }

  return rows;
};

const writeJobSummary = async (
  text: string,
  result: AgentResult
): Promise<void> => {
  const tableRows = buildSummaryTableRows(result);

  await summary
    .addHeading("Cursor Agent Run", 2)
    .addTable([
      [
        { data: "Field", header: true },
        { data: "Value", header: true },
      ],
      ...tableRows,
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

const setMetricOutputs = (result: AgentResult): void => {
  if (result.durationMs !== undefined) {
    setOutput("duration-ms", String(result.durationMs));
  }
  const { usage } = result;
  if (usage?.totalTokens !== undefined) {
    setOutput("total-tokens", String(usage.totalTokens));
  }
  if (usage?.inputTokens !== undefined) {
    setOutput("input-tokens", String(usage.inputTokens));
  }
  if (usage?.outputTokens !== undefined) {
    setOutput("output-tokens", String(usage.outputTokens));
  }
};

export const setOutputs = async (
  result: AgentResult
): Promise<ActionOutputs> => {
  const text = parseSummary(result.stdout);
  const status =
    result.status ?? (result.exitCode === 0 ? "finished" : "error");

  setOutput("summary", text);
  setOutput("exit-code", String(result.exitCode));
  setOutput("status", status);
  setMetricOutputs(result);

  await writeJobSummary(text, result);

  const { usage } = result;
  return {
    durationMs: result.durationMs,
    exitCode: result.exitCode,
    inputTokens: usage?.inputTokens,
    outputTokens: usage?.outputTokens,
    status,
    summary: text,
    totalTokens: usage?.totalTokens,
  };
};

export const maskSecret = (apiKey: string): void => setSecret(apiKey);
