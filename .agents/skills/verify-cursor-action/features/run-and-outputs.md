# Run and outputs

## Sub-features

- The `summary`, `exit-code`, `status`, and `duration-ms` step outputs.
- The job summary written to `GITHUB_STEP_SUMMARY`.
- Releasing the agent after the run.

## How to get to it (user POV)

A workflow step runs the action with a `prompt`. Later steps read `steps.<id>.outputs.*`.

## Driving it with drive.mjs

```sh
node .agents/skills/verify-cursor-action/scripts/drive.mjs --scenario finished
```

Proof: `exitCode` is `0`, `outputs.status` is `finished`, `outputs.summary` is `stub answer`, and `stub-events.jsonl` ends with `dispose`.

## Gotchas

- `total-tokens` and the other token outputs appear only when the run reports usage. The stub reports none.
