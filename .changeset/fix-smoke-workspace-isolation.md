---
"cursor-action": patch
---

Run CI smoke tests in an isolated temporary workspace to avoid repository-local Cursor hooks/config affecting headless runs. Also expose a workflow-level smoke test model override and improve runner diagnostics with an auth/entitlement preflight check.
