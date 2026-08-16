---
"@pungrumpy/cursor-action": patch
---

Fix the action crashing inside `Agent.create` with `Cannot find module
'986.js'`. The bundler inlined `@cursor/sdk`, but the SDK dynamically imports
its own webpack chunks at runtime relative to its package directory and
resolves a native `@cursor/sdk-<platform>` package for `rg` and
`cursorsandbox` — neither survives being bundled into a single file.

`@cursor/sdk` and `@actions/core` are now external and installed by the action
itself, which also shrinks the committed bundle from 9.7 MB to 5.8 kB.
