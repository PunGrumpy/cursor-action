---
"@pungrumpy/cursor-action": patch
---

Update `@cursor/sdk` to 1.0.28. It drops `sqlite3` from its dependencies in
favour of an optional `@cursor/sdk/sqlite` entry point, so the action no longer
pulls a native module that has to be prebuilt or compiled during install.
