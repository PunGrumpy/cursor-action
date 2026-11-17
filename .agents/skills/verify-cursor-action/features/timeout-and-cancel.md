# Timeout and cancel

## Sub-features

- The `timeout` input sets the deadline.
- At the deadline the action calls `run.cancel()` once.
- After the deadline the action waits at most one cancel grace period (10 s) for the run to stop.
- A run that stops in time reports `status: cancelled` with "was cancelled". One that does not reports "did not stop within 10000ms".

## How to get to it (user POV)

A workflow sets `timeout` lower than the agent needs. The step fails with `exit-code` `1` and `status` `cancelled`.

## Driving it with drive.mjs

```sh
node .agents/skills/verify-cursor-action/scripts/drive.mjs --scenario cancels
node .agents/skills/verify-cursor-action/scripts/drive.mjs --scenario ignores-cancel
node .agents/skills/verify-cursor-action/scripts/drive.mjs --scenario hung-cancel
```

Proof for each:

- `cancels` shows `cancel` at about 1000 ms and `dispose` right after it. `action.log` says "was cancelled".
- `ignores-cancel` and `hung-cancel` show `dispose` about 10 000 ms after `cancel`, and `elapsedMs` near 11 000. `action.log` says "did not stop within 10000ms".

## Gotchas

- `hung-cancel` is the case that once took two grace periods, about 21 s in all. A gap between `cancel` and `dispose` near 20 000 ms is that regression.
