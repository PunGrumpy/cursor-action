---
"@pungrumpy/cursor-action": patch
---

Update `@cursor/sdk` to 1.0.38 and refresh the transitive `undici` pin. The SDK release drops `@connectrpc/connect-node`, and the newer `undici` clears the remaining advisory `npm audit` reported for the action's runtime dependency tree.
