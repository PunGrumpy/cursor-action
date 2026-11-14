---
"@pungrumpy/cursor-action": patch
---

The API key is removed from the process environment as soon as it is read, so shell commands and Cursor hooks the agent runs no longer inherit it.
