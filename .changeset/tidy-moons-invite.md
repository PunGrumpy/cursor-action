---
"@pungrumpy/cursor-action": patch
---

Fix the action failing with a module resolution error at every published tag.
`dist/` was gitignored while `action.yml` executed `dist/index.mjs`, so the
bundle never existed for consumers — only this repository's own smoke test
worked, because it downloaded `dist/` as a build artifact first.

The bundle is now committed and the action runs on the `node24` runner, which
also drops the `actions/setup-node` and `npm ci` steps that ran on every
invocation.
