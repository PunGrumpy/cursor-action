---
"@pungrumpy/cursor-action": minor
---

The `model` input now takes the CLI's bracket form, such as `grok-4.7[reasoning_effort=medium]`, and sends the settings to Cursor. Grok 4.7 needs this on plans with fixed settings. A plain id like `composer-2.5` works as before, and a malformed value fails before the agent starts. When Cursor rejects the model, the job summary lists the models and settings the key can use.
