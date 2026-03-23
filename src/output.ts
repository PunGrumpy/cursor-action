import { setOutput, setSecret, summary } from "@actions/core";

import type { ActionOutputs, AgentResult } from "./types";

const parseSummary = (stdout: string): string => {
  const trimmed = stdout.trim();
  if (!trimmed) {
    return "";
  }

  // Try JSON parse
  try {
    const parsed = JSON.parse(trimmed);

    // Handle common response shapes
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
    // Not JSON — fall through to raw text handling
  }

  // Strip common ANSI escape codes that might leak through despite NO_COLOR=1
  const clean = trimmed.replaceAll(
    // eslint-disable-next-line no-control-regex
    /\u001B\[[0-9;]*[mGKHF]/g,
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

  const tableRows: [string, string][] = [
    ["Status", status],
    ["Exit Code", String(result.exitCode)],
  ];
  if (result.invocationMode) {
    tableRows.push(["Invocation mode", result.invocationMode]);
  }
  if (result.cliVersion) {
    tableRows.push(["cursor-agent --version", result.cliVersion]);
  }

  await summary
    .addHeading("Cursor Agent Run", 2)
    .addTable([
      [
        { data: "Field", header: true },
        { data: "Value", header: true },
      ],
      ...tableRows.map(([field, value]) => [field, value]),
    ])
    .addHeading("Agent Response", 3)
    .addRaw(text ? `\n\`\`\`\n${text}\n\`\`\`\n` : "_No output was produced._");

  const errText = result.stderr.trim();
  if (errText) {
    await summary
      .addHeading("cursor-agent stderr", 3)
      .addRaw(
        `\n\`\`\`\n${errText.slice(0, 20_000)}${errText.length > 20_000 ? "\n… (truncated)" : ""}\n\`\`\`\n`
      );
  }

  const diag = result.diagnostics?.trim();
  if (diag) {
    await summary
      .addHeading("Diagnostics", 3)
      .addRaw(
        `\n\`\`\`\n${diag.slice(0, 20_000)}${diag.length > 20_000 ? "\n… (truncated)" : ""}\n\`\`\`\n`
      );
  }

  await summary.write();
};

/**
 * Sets all GitHub Actions outputs and writes a job summary.
 */
export const setOutputs = async (
  result: AgentResult,
  cacheHit: boolean
): Promise<ActionOutputs> => {
  const text = parseSummary(result.stdout);

  // Set outputs
  setOutput("summary", text);
  setOutput("exit-code", String(result.exitCode));
  setOutput("cache-hit", String(cacheHit));

  // Write to the GitHub Actions job summary (visible in the Actions UI)
  await writeJobSummary(text, result);

  return {
    cacheHit,
    exitCode: result.exitCode,
    summary: text,
  };
};

/**
 * Masks the API key in any log output (belt-and-suspenders on top of
 * the secret masking that @actions/core already applies).
 */
export const maskSecret = (apiKey: string): void => setSecret(apiKey);
