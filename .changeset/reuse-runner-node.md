---
"@pungrumpy/cursor-action": patch
---

The action now uses the runner's Node.js when it is 22.13 or newer instead of always installing Node.js 24. That saves several seconds per run on Windows and no longer switches later steps in the job to Node.js 24.
