---
"cursor-action": patch
---

Retry `cursor-agent` with headless print mode (`-p`) when the primary `chat` invocation fails silently or looks like a CLI mismatch; collect `cursor-agent --version` and add job-summary diagnostics. Document CI troubleshooting in the README.
