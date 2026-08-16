---
"@pungrumpy/cursor-action": patch
---

Fix the action failing with a module resolution error at every published tag.
`dist/` was gitignored while `action.yml` executed `dist/index.mjs`, so the file
never existed for consumers — only this repository's own smoke test worked,
because it downloaded `dist/` as a build artifact first.

`dist/` is now committed. It holds only this repository's own code (5.8 kB):
`@cursor/sdk` cannot be bundled, because it dynamically imports its own webpack
chunks at runtime and resolves a native `@cursor/sdk-<platform>` package, so it
stays external and the action installs it.
