---
"@pungrumpy/cursor-action": patch
---

Publish the agent's answer verbatim in `summary`. An answer that happened to be a JSON object was previously reduced to its `response`, `summary`, `result`, `output`, or `text` field, a leftover from the CLI's `--output-format json` era; workflows that ask for structured output now receive the whole object.
