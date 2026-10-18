---
"@pungrumpy/cursor-action": major
---

Enforce the `permissions` input through the Cursor SDK's tool restrictions. `read-only` (the default) now offers the agent read, search, and web tools only; `read-write` removes `shell` and `task` from the default toolset; `full` leaves the SDK default. Workflows that relied on `read-only` not restricting anything must set `permissions: full`. Pin `uses: PunGrumpy/cursor-action@v2` to pick this up; `@v1` keeps the previous behaviour.
