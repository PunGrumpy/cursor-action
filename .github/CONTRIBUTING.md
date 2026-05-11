# Contributing to Cursor Action

Thanks for helping improve this GitHub Action. Clear, small changes are easier to review and ship than large refactors mixed with unrelated edits.

## Code of conduct

Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before participating.

## Reporting issues

- Use [bug reports](ISSUE_TEMPLATE/bug_report.md) for regressions or incorrect behavior.
- Use [feature requests](ISSUE_TEMPLATE/feature_request.md) for new inputs, outputs, or behavior.
- Include a minimal workflow snippet or reproduction when it helps explain the problem.

## Development setup

Prerequisites match CI:

- **Node.js 24**
- **Bun**

Install dependencies:

```bash
bun install
```

## Before you open a pull request

Run the same checks CI runs:

```bash
bun run typecheck
bun run test
bun run lint
bun run build
```

If you changed anything under `src/`, regenerate and commit `dist/` as well. CI fails when `dist/` is out of date compared to a fresh `bun run build`.

## Style and quality

- Follow existing patterns in `src/` and tests under `__tests__/`.
- Prefer `bun run format` (Ultracite) over manual formatting drift when applicable.

## User-visible changes and versioning

This repo uses [Changesets](https://github.com/changesets/changesets). If your change should appear in the changelog or trigger a release (new behavior, fixes consumers care about, breaking changes), add a changeset:

```bash
bun run changeset
```

See [`.changeset/README.md`](../.changeset/README.md) for the local workflow.

## Pull requests

The [pull request template](pull_request_template.md) lists the maintainer checklist: tests, changesets when needed, and doc updates when behavior or inputs change. Link related issues with `Closes #123` when applicable.

## Local smoke of the action entrypoint

For a quick manual run of the compiled action (requires a real API key), see the “Run action entrypoint locally” section in the repository [README.md](../README.md).
