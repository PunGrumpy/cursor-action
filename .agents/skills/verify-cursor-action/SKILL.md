---
name: verify-cursor-action
description: Drive the built cursor-action entry point (dist/index.mjs) the way a GitHub Actions runner does, with a scripted stand-in for @cursor/sdk, and capture outputs, logs, and timing. Use to prove a change to the runner, inputs, outputs, or timeout and cancel handling on the shipped bundle rather than through unit tests.
---

# Verify cursor-action

The action's user is a workflow step. The runner sets `INPUT_*` variables, runs `node dist/index.mjs`, and reads `GITHUB_OUTPUT`, `GITHUB_STEP_SUMMARY`, the log, and the exit code. `scripts/drive.mjs` does the same against the committed bundle. A resolve hook swaps `@cursor/sdk` for `scripts/sdk-stub.mjs`, so no API key or network is needed. Every other module, `@actions/core` included, is the real one from `node_modules`.

The stub is the only mock. It sits where the production boundary already is, since `@cursor/sdk` is external to the bundle. A real-model run needs `CURSOR_API_KEY` and belongs to the `Integration` CI job, not this skill.

## Launch

There is no server. Each drive is one short-lived process.

```sh
bun install --frozen-lockfile
bun run build
```

Rebuild after every change under `src/`. The drive runs `dist/index.mjs`, not `src/`.

## Doctor

Run these when a drive looks wrong.

```sh
node --version               # needs 22.15 or newer for module.registerHooks
git diff --exit-code dist    # after `bun run build`, a diff means dist is stale
test -d node_modules/@actions/core && echo deps-ok
```

## Drive

```sh
node .agents/skills/verify-cursor-action/scripts/drive.mjs --scenario <name> [--timeout <seconds>] [--model <id>]
```

`--timeout` defaults to `1` and `--model` to `stub-model`. The script prints `result.json` to stdout. `scenario` picks how the stubbed run behaves.

| Scenario | Stubbed run |
| --- | --- |
| `finished` | Streams `stub answer` and finishes. |
| `cancels` | Never finishes on its own and stops as soon as `cancel()` is called. |
| `ignores-cancel` | `cancel()` resolves, but the stream and `wait()` never end. |
| `hung-cancel` | `cancel()`, the stream, and `wait()` all never settle. |
| `model-error` | `Agent.create` rejects with a model error. The catalog lists `stub-model`. |

The action's real defaults apply: a 10 s cancel grace period and a 15 s dispose limit. A timeout scenario therefore takes about `timeout + 10` seconds.

## Evidence

Each drive writes to `$VERIFY_EVIDENCE_DIR`, or to `$TMPDIR/cursor-action-verify/<timestamp>-<scenario>/` when it is unset.

- `result.json` holds the exit code, wall time, parsed step outputs, and stub events.
- `action.log` is the action's stdout and stderr, with `::warning::` and `::error::` commands.
- `github-output.txt` and `step-summary.md` are the raw files the runner would read.
- `stub-events.jsonl` lists each SDK call (`create`, `send`, `cancel`, `dispose`) with milliseconds since the stub loaded.

A proof cites `result.json` fields and the matching `action.log` lines. For a timing claim, read `cancel` and `dispose` from `stub-events.jsonl`. Their gap is the wait after the deadline. For a before and after, write the old bundle with `git show <ref>:dist/index.mjs > dist/index.mjs`, drive it, then restore it with `git checkout dist/index.mjs`.

## Cleanup

A drive leaves no process behind. The child exits before the script returns. Evidence stays in the evidence directory, and removing it is the reader's call. If you swapped in an old bundle, run `git checkout dist/index.mjs`.

## Features

`features/README.md` maps the user-facing behaviors this skill can drive.
