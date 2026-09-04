---
"@pungrumpy/cursor-action": patch
---

Expose execution duration and granular token usage outputs:

- Add `duration-ms` output reporting run duration in milliseconds.
- Add `total-tokens`, `input-tokens`, and `output-tokens` outputs for agent usage tracking.
- Display input, output, cached, and total tokens in the GitHub Actions job summary table.
- Remove em dash in timeout warning message.
- Synchronize package description and reference documentation.
