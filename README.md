# Cursor Action

Install the [Cursor](https://cursor.com) CLI in GitHub Actions and run `cursor-agent` in CI.

[![CI](https://github.com/PunGrumpy/cursor-action/actions/workflows/ci.yml/badge.svg)](https://github.com/PunGrumpy/cursor-action/actions/workflows/ci.yml)
[![Release](https://github.com/PunGrumpy/cursor-action/actions/workflows/release.yml/badge.svg)](https://github.com/PunGrumpy/cursor-action/actions/workflows/release.yml)

## Quickstart

1. Add a repository secret named `CURSOR_API_KEY`.
2. Use the action in a workflow job.
3. Read `steps.<id>.outputs.summary` for the model response.

```yaml
- name: Run Cursor Agent
  id: cursor
  uses: PunGrumpy/cursor-action@main
  with:
    api-key: ${{ secrets.CURSOR_API_KEY }}
    prompt: "Review this PR for security issues and summarize your findings."

- name: Print summary
  run: echo "${{ steps.cursor.outputs.summary }}"
```

## Inputs

> Pre-release note: this repository has not published a stable release tag yet.  
> Use `uses: PunGrumpy/cursor-action@main` (or a pinned commit SHA) until the first `v1` release is published.

| Input               | Required | Default     | Description                                                                         |
| ------------------- | -------- | ----------- | ----------------------------------------------------------------------------------- |
| `api-key`           | ✅       | —           | Cursor API key (store in GitHub Secrets).                                           |
| `prompt`            | ✅       | —           | Prompt passed to `cursor-agent`.                                                    |
| `cursor-version`    | ❌       | `latest`    | Cursor lab build to install (`latest` or exact build id like `2026.03.20-44cb435`). |
| `model`             | ❌       | `default`   | Model id for the Cursor SDK (e.g. `default`, `composer-2`). Not `auto`.             |
| `working-directory` | ❌       | `.`         | Working directory used when running the agent.                                      |
| `permissions`       | ❌       | `read-only` | Agent permissions: `read-only`, `read-write`, or `full`.                            |
| `timeout`           | ❌       | `300`       | Timeout in seconds for each agent invocation attempt.                               |

## Outputs

| Output      | Description                                        |
| ----------- | -------------------------------------------------- |
| `summary`   | Agent text output (used for step-to-step handoff). |
| `exit-code` | Exit code returned by `cursor-agent`.              |
| `cache-hit` | `"true"` when CLI install came from cache.         |

## Examples

### PR review comment

```yaml
name: Cursor Code Review

on:
  pull_request:

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6

      - name: Run Cursor Agent
        id: review
        uses: PunGrumpy/cursor-action@main
        with:
          api-key: ${{ secrets.CURSOR_API_KEY }}
          permissions: read-only
          prompt: |
            Review the staged changes in this repository.
            Focus on correctness, security, and performance.
            Be concise.

      - name: Comment on PR
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## 🤖 Cursor Review\n\n${{ steps.review.outputs.summary }}`
            })
```

### Pin a specific Cursor CLI build

```yaml
- uses: PunGrumpy/cursor-action@main
  with:
    api-key: ${{ secrets.CURSOR_API_KEY }}
    prompt: "Generate a changelog entry for the latest commit."
    cursor-version: "2026.03.20-44cb435"
```

### Allow file edits

```yaml
- uses: PunGrumpy/cursor-action@main
  with:
    api-key: ${{ secrets.CURSOR_API_KEY }}
    prompt: "Fix TypeScript type errors in src/."
    permissions: read-write
    working-directory: ./src
```

## How this action behaves

### Version resolution

- `cursor-version: latest` resolves to a concrete Cursor lab build before download.
- Resolution order:
  1. `https://downloads.cursor.com/lab/latest-version`
  2. Fallback to parsing `https://cursor.com/install`
- For reproducible installs, pin an exact lab build id.

### Invocation strategy

- Primary invocation: `cursor-agent chat ...`
- If chat fails with a likely CLI mismatch (for example `unknown command`) or empty output, the action retries with headless print mode (`-p --output-format text`).
- A preflight print probe is also run to improve auth/entitlement diagnostics in job summary output.

### Caching

- The extracted CLI package is cached by platform, architecture, and resolved version.
- Using `latest` still hits cache after it resolves to a concrete build.
- Pinning a build id gives stable cache keys across runs.

## Local development

### Prerequisites

- Node.js 24 (matches CI and release workflows)
- Bun

### Validate changes locally

```bash
bun install
bun run typecheck
bun run test
bun run build
```

If you changed source files, commit updated `dist/` as well (`CI` fails when `dist/` is out of date).

### Run action entrypoint locally

```bash
export CURSOR_API_KEY='your-key'
export GITHUB_STEP_SUMMARY="$(mktemp)"
export GITHUB_OUTPUT="$(mktemp)"
export RUNNER_TOOL_CACHE="$(mktemp -d)"
export RUNNER_TEMP="$(mktemp -d)"

env "INPUT_API-KEY=$CURSOR_API_KEY" \
    "INPUT_PROMPT=Say 'smoke test passed' and nothing else." \
    "INPUT_CURSOR-VERSION=latest" \
    "INPUT_MODEL=default" \
    "INPUT_PERMISSIONS=read-only" \
    "INPUT_TIMEOUT=60" \
    node dist/index.mjs
```

## CI and release notes

- `CI` workflow runs `typecheck`, `test`, and `build` on pushes and pull requests.
- On pushes to `main`, CI also runs a smoke test job using this action (`uses: ./`).
- `Release` workflow runs on pushes to `main`, executes tests/build, then uses Changesets to open/update a release PR or publish.
- After the first stable release, major tags (`v1`, `v2`, ...) are managed by the release flow so `@v1` tracks the latest `v1.x.x`.

## Troubleshooting

### `cursor-agent` exits non-zero

- Confirm `CURSOR_API_KEY` is present and valid.
- If you set `model`, verify your account can access it (start with `default` or another id from the SDK error list).
- Check the job summary for:
  - `cursor-agent --version`
  - invocation mode used (`chat` or fallback `print`)
  - preflight/auth diagnostics and merged stderr

### Smoke test model issues in this repo

This repository's smoke test uses `CURSOR_SMOKE_TEST_MODEL` (default: `default`) in `.github/workflows/ci.yml`. If smoke tests fail due to model access, set it to another id your key can use.

## Versioning

This project uses [Changesets](https://github.com/changesets/changesets). See [`.changeset/README.md`](.changeset/README.md) for contribution workflow details.

## License

[MIT](LICENSE) © [PunGrumpy](https://github.com/PunGrumpy)
