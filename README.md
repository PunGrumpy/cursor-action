# Cursor Action

Run [Cursor](https://cursor.com) agents in GitHub Actions using the official [`@cursor/sdk`](https://www.npmjs.com/package/@cursor/sdk).

[![CI](https://github.com/PunGrumpy/cursor-action/actions/workflows/ci.yml/badge.svg)](https://github.com/PunGrumpy/cursor-action/actions/workflows/ci.yml)
[![Release](https://github.com/PunGrumpy/cursor-action/actions/workflows/release.yml/badge.svg)](https://github.com/PunGrumpy/cursor-action/actions/workflows/release.yml)

## Quickstart

1. Add a repository secret named `CURSOR_API_KEY`.
2. Use the action in a workflow job.
3. Read `steps.<id>.outputs.summary` for the model response.

```yaml
- name: Run Cursor Agent
  id: cursor
  uses: PunGrumpy/cursor-action@v1
  with:
    api-key: ${{ secrets.CURSOR_API_KEY }}
    prompt: "Review this PR for security issues and summarize your findings."

- name: Print summary
  env:
    SUMMARY: ${{ steps.cursor.outputs.summary }}
  run: echo "$SUMMARY"
```

The action runs on `ubuntu-latest`, `windows-latest`, and `macos-latest`.

## Inputs

| Input               | Required | Default     | Description                                                                        |
| ------------------- | -------- | ----------- | ---------------------------------------------------------------------------------- |
| `api-key`           | ✅       | —           | Cursor API key (store in GitHub Secrets).                                          |
| `prompt`            | ✅       | —           | Prompt passed to the agent.                                                        |
| `model`             | ❌       | `default`   | Model id for the Cursor SDK (e.g. `default`, `composer-2`). Not `auto`.            |
| `working-directory` | ❌       | `.`         | Directory the agent operates in.                                                   |
| `timeout`           | ❌       | `300`       | Timeout in seconds. On timeout the action asks the SDK to cancel the run.          |
| `permissions`       | ❌       | `read-only` | **Not wired to the SDK.** Accepted for compatibility only — see the warning below. |
| `cursor-version`    | ❌       | `latest`    | **Deprecated, ignored.** The SDK manages the agent version.                        |

> [!WARNING]
> `permissions` does not restrict the agent today. The value is validated and
> then discarded — tool access follows whatever your API key and account allow,
> so `read-only` does **not** stop the agent from editing files or running
> shell commands. It is wired to the SDK's tool restrictions in v2.

> [!NOTE]
> `cursor-version` is a no-op since v1.0.0. Pinning a Cursor build is no longer
> possible from this action; the SDK resolves the agent version itself.

## Outputs

| Output      | Description                                         |
| ----------- | --------------------------------------------------- |
| `summary`   | Agent text response.                                |
| `exit-code` | `0` when the SDK call succeeded, `1` when it threw. |

> [!IMPORTANT]
> Treat `summary` as untrusted model output. Pass it through `env:` rather than
> interpolating `${{ steps.<id>.outputs.summary }}` directly into a `run:`
> script or a `github-script` body — interpolation splices the text into the
> script before it executes.

## Examples

### Comment the result on a pull request

```yaml
name: Cursor Code Review

on:
  pull_request:

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v6

      - name: Run Cursor Agent
        id: review
        uses: PunGrumpy/cursor-action@v1
        with:
          api-key: ${{ secrets.CURSOR_API_KEY }}
          prompt: |
            Review the changes in this repository.
            Focus on correctness, security, and performance.
            Be concise.

      - name: Comment on PR
        uses: actions/github-script@v7
        env:
          SUMMARY: ${{ steps.review.outputs.summary }}
        with:
          script: |
            await github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## 🤖 Cursor Review\n\n${process.env.SUMMARY}`
            })
```

Pull requests from forks get a read-only `GITHUB_TOKEN`, so the comment step
fails there. Do not reach for `pull_request_target` to work around it — that
runs with a writable token in the context of the fork's code.

### Pick a model and a working directory

```yaml
- uses: PunGrumpy/cursor-action@v1
  with:
    api-key: ${{ secrets.CURSOR_API_KEY }}
    prompt: "Summarize the TypeScript errors you can find."
    model: composer-2
    working-directory: ./src
    timeout: "600"
```

## How this action behaves

- Creates a local SDK agent (`Agent.create({ local: { cwd } })`) against the
  resolved `working-directory`, sends the prompt, and streams the response.
- Streamed text is collected, then replaced by the final run result when the SDK
  provides one.
- On timeout, the run is cancelled if the SDK reports `cancel` support. A
  cancelled run currently still reports success — fixed in v2.
- Writes a job summary with the status, exit code, agent response, and any
  stderr or diagnostics.
- The API key is registered with `::add-mask::` before the agent starts.

The action ships as a bundled `dist/index.mjs` and runs on the `node24` runner,
so there is no install step and no network fetch beyond the SDK's own calls.

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

`dist/` is committed on purpose — GitHub Actions executes it straight from the
tag. If you changed anything under `src/`, run `bun run build` and commit the
result; CI fails when `dist/` is out of date.

### Run the action entrypoint locally

```bash
export GITHUB_STEP_SUMMARY="$(mktemp)"
export GITHUB_OUTPUT="$(mktemp)"

env "INPUT_API-KEY=$CURSOR_API_KEY" \
    "INPUT_PROMPT=Say 'smoke test passed' and nothing else." \
    "INPUT_MODEL=default" \
    "INPUT_PERMISSIONS=read-only" \
    "INPUT_TIMEOUT=60" \
    node dist/index.mjs
```

## CI and release notes

- `CI` runs `typecheck`, `test`, `build`, and a `dist/` freshness check on every
  push and pull request.
- On pushes to `main`, CI also runs a smoke test of this action (`uses: ./`)
  across Ubuntu, Windows, and macOS.
- `Release` runs Changesets on pushes to `main` to open a release PR or publish,
  then moves the `v1` tag to the published version.
- `uses: PunGrumpy/cursor-action@v1` tracks the latest `v1.x.x`. Pin a full tag
  or a commit SHA if you want a frozen version.

## Troubleshooting

### The agent exits non-zero

- Confirm `CURSOR_API_KEY` is set and valid — an invalid key surfaces as
  `Invalid User API Key` in the job summary.
- If you set `model`, confirm your account can use it. Start with `default`.
- The job summary carries the agent response, stderr, and diagnostics for the
  failed run.

### The smoke test in this repository

`.github/workflows/ci.yml` reads `CURSOR_SMOKE_TEST_MODEL` (default: `default`).
Change it if your key cannot access that model.

## Versioning

This project uses [Changesets](https://github.com/changesets/changesets). See
[`.changeset/README.md`](.changeset/README.md) for the contribution workflow.

## License

[MIT](LICENSE) © [PunGrumpy](https://github.com/PunGrumpy)
