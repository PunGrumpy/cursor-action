---
"@pungrumpy/cursor-action": patch
---

The action now uses the runner's Node.js when it is 22.13 or newer instead of always setting up Node.js 24, so later steps in the job keep the Node.js version the workflow chose. It also saves up to about two seconds per run.
