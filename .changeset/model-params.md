---
"@pungrumpy/cursor-action": minor
---

A bare `model` id now runs with the catalog's default settings, so `grok-4.7` and `composer-2.5` work on plans with fixed settings. The CLI's bracket form, such as `grok-4.7[fast=true]`, overrides individual settings. A malformed value fails before the agent starts. When Cursor rejects the model, the job summary and log list the models and settings the key can use.
