---
"@pungrumpy/cursor-action": patch
---

Treat `timeout` as a hard deadline: after requesting cancellation the action waits at most ten seconds for the run to stop, then fails the step as `cancelled` instead of waiting indefinitely. The agent is now released (`Symbol.asyncDispose`) when the run ends on every path, bounded by its own fifteen-second limit.
