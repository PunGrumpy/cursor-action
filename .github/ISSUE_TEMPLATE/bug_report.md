---
name: Bug report
about: Create a report to help us improve
title: ""
labels: bug
assignees: ""
---

**Describe the bug** A clear and concise description of what the bug is.

**Action version** The tag or commit SHA you reference in `uses:`, e.g. `PunGrumpy/cursor-action@v1`.

**Workflow snippet** The step that fails, with secrets redacted:

```yaml
- uses: PunGrumpy/cursor-action@v1
  with:
    api-key: ${{ secrets.CURSOR_API_KEY }}
    prompt: "..."
    model: default
```

**To Reproduce** Steps to reproduce the behavior:

1. Run the workflow above on '...'
2. The step reaches '...'
3. See error

**Expected behavior** A clear and concise description of what you expected to happen.

**Logs** The relevant part of the failing job log, with secrets and tokens redacted. Enable [debug logging](https://docs.github.com/actions/monitoring-and-troubleshooting-workflows/enabling-debug-logging) when the failure is not obvious from the default output.

**Environment (please complete the following information):**

- Runner: [e.g. `ubuntu-latest`, self-hosted Linux, `macos-15`]
- Model input: [e.g. `default`, `composer-2`]
- Other inputs that differ from the defaults: [e.g. `working-directory`, `timeout`]

**Additional context** Anything else that helps explain the problem, such as whether it worked on an earlier version.
