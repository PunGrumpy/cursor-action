---
"@pungrumpy/cursor-action": patch
---

Collect the agent's answer from `assistant` stream events instead of `thinking` events. A cancelled or errored run's `summary` now holds the model's partial answer rather than its reasoning.
