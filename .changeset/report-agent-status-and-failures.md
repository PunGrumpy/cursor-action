---
"@pungrumpy/cursor-action": patch
---

Handle agent run statuses and report failures accurately:

- Map cancelled and errored agent runs from `run.wait()` to exit code `1` instead of reporting success.
- Surface error messages from `runResult.error` in stderr and the step summary when a run fails.
- Expose the new `status` output (`finished`, `error`, or `cancelled`).
- Display run duration and total token usage in the job summary table when available from the SDK.
