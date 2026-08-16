---
"@pungrumpy/cursor-action": patch
---

Document that `permissions` is validated but never enforced: the value is not
passed to the SDK, so `read-only` does **not** stop the agent from editing files
or running shell commands. Tool access follows your API key and account. It is
wired to the SDK's tool restrictions in v2.

`cursor-version` is likewise ignored — the SDK manages the agent version.
