#!/usr/bin/env node
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";

const OUTPUT_ENTRY =
  /^(?<name>[\w-]+)<<(?<delimiter>\S+)\n(?<value>[\s\S]*?)\n\k<delimiter>$/gmu;

const { values } = parseArgs({
  options: {
    model: { default: "stub-model", type: "string" },
    scenario: { default: "finished", type: "string" },
    timeout: { default: "1", type: "string" },
  },
});

const repoRoot = path.resolve(import.meta.dirname, "../../../..");
const evidenceDir = path.resolve(
  process.env.VERIFY_EVIDENCE_DIR ??
    path.join(
      tmpdir(),
      "cursor-action-verify",
      `${new Date().toISOString().replaceAll(":", "-")}-${values.scenario}`
    )
);
mkdirSync(evidenceDir, { recursive: true });

const files = {
  log: path.join(evidenceDir, "action.log"),
  output: path.join(evidenceDir, "github-output.txt"),
  result: path.join(evidenceDir, "result.json"),
  stub: path.join(evidenceDir, "stub-events.jsonl"),
  summary: path.join(evidenceDir, "step-summary.md"),
};
for (const file of [files.output, files.summary, files.stub]) {
  writeFileSync(file, "");
}

const inheritedEnv = Object.fromEntries(
  Object.entries(process.env).filter(
    ([key]) => !(key.startsWith("INPUT_") || key.startsWith("GITHUB_"))
  )
);

const startedAt = Date.now();
const child = spawn(
  process.execPath,
  [
    "--import",
    path.join(import.meta.dirname, "stub-sdk-hook.mjs"),
    path.join(repoRoot, "dist/index.mjs"),
  ],
  {
    cwd: repoRoot,
    env: {
      ...inheritedEnv,
      GITHUB_OUTPUT: files.output,
      GITHUB_STEP_SUMMARY: files.summary,
      "INPUT_API-KEY": "verify-stub-key",
      INPUT_MODEL: values.model,
      INPUT_PERMISSIONS: "read-only",
      INPUT_PROMPT: "verify-cursor-action drive",
      INPUT_TIMEOUT: values.timeout,
      VERIFY_SCENARIO: values.scenario,
      VERIFY_STUB_LOG: files.stub,
    },
    stdio: ["ignore", "pipe", "pipe"],
  }
);

let log = "";
child.stdout.on("data", (chunk) => {
  log += chunk;
});
child.stderr.on("data", (chunk) => {
  log += chunk;
});

const [exitCode] = await once(child, "close");
const elapsedMs = Date.now() - startedAt;
writeFileSync(files.log, log);

const outputs = Object.fromEntries(
  [...readFileSync(files.output, "utf-8").matchAll(OUTPUT_ENTRY)].map(
    ({ groups }) => [groups.name, groups.value]
  )
);
const stubEvents = readFileSync(files.stub, "utf-8")
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line));

const result = {
  elapsedMs,
  evidenceDir,
  exitCode,
  outputs,
  scenario: values.scenario,
  stubEvents,
  timeoutSeconds: Number(values.timeout),
};
writeFileSync(files.result, `${JSON.stringify(result, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
