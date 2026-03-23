---
"cursor-action": patch
---

Fix Cursor CLI download URLs: resolve `latest` via the lab endpoint (validate HTTP 200 and lab id shape), fall back to parsing `https://cursor.com/install` when the lab `latest-version` URL returns 403, use `windows` in artifact paths on Win32, and allow pinning lab build ids in `cursor-version` input validation. Install the full extracted agent package (launcher + bundled `node`, etc.) instead of only the `cursor-agent` file, and bump cache keys so old incomplete installs are not reused.
