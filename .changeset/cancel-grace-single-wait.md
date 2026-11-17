---
"@pungrumpy/cursor-action": patch
---

When a run times out and the cancel request hangs, the action now stops waiting after one cancel grace period instead of two.
