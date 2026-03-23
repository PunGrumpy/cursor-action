# Cursor Action

> **GitHub Action** — Install the [Cursor](https://cursor.com) CLI and run `cursor-agent` in your CI pipelines.

[![CI](https://github.com/PunGrumpy/cursor-action/actions/workflows/ci.yml/badge.svg)](https://github.com/PunGrumpy/cursor-action/actions/workflows/ci.yml)
[![Release](https://github.com/PunGrumpy/cursor-action/actions/workflows/release.yml/badge.svg)](https://github.com/PunGrumpy/cursor-action/actions/workflows/release.yml)

---

## Usage

```yaml
- name: Run Cursor Agent
  uses: PunGrumpy/cursor-action@v1
  id: cursor
  with:
    api-key: ${{ secrets.CURSOR_API_KEY }}
    prompt: "Review this PR for security issues and summarize your findings."

- name: Print summary
  run: echo "${{ steps.cursor.outputs.summary }}"
```

---

## Inputs

| Input               | Required | Default     | Description                                                                                          |
| ------------------- | -------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| `api-key`           | ✅       | —           | Your Cursor API key. Store as a secret.                                                              |
| `prompt`            | ✅       | —           | The prompt to pass to `cursor-agent`.                                                                |
| `cursor-version`    | ❌       | `latest`    | Cursor CLI build to install. Use `latest` or an exact Cursor lab build id like `2026.03.20-44cb435`. |
| `model`             | ❌       | `auto`      | Model for the agent to use.                                                                          |
| `working-directory` | ❌       | `.`         | Directory the agent operates in.                                                                     |
| `permissions`       | ❌       | `read-only` | Agent permissions: `read-only`, `read-write`, or `full`.                                             |
| `timeout`           | ❌       | `300`       | Timeout in seconds before the agent is killed.                                                       |

## Outputs

| Output      | Description                                                 |
| ----------- | ----------------------------------------------------------- |
| `summary`   | Text response from the agent.                               |
| `exit-code` | Raw exit code from the `cursor-agent` process.              |
| `cache-hit` | `"true"` if the Cursor CLI install was restored from cache. |

---

## Examples

### PR code review

```yaml
name: Cursor Code Review

on:
  pull_request:

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Cursor Agent
        uses: PunGrumpy/cursor-action@v1
        id: review
        with:
          api-key: ${{ secrets.CURSOR_API_KEY }}
          prompt: |
            Review the staged changes in this repository.
            Focus on: correctness, security, and performance.
            Be concise.
          permissions: read-only

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

### Pin a specific CLI version

```yaml
- uses: PunGrumpy/cursor-action@v1
  with:
    api-key: ${{ secrets.CURSOR_API_KEY }}
    prompt: "Generate a changelog entry for the latest commit."
    cursor-version: "2026.03.20-44cb435"
```

### Read-write permissions (agent can modify files)

```yaml
- uses: PunGrumpy/cursor-action@v1
  with:
    api-key: ${{ secrets.CURSOR_API_KEY }}
    prompt: "Fix any TypeScript type errors in src/"
    permissions: read-write
    working-directory: ./src
```

---

## Version Resolution

`cursor-version: latest` resolves to the current published Cursor lab build before download. The action first checks Cursor's lab `latest-version` endpoint and, if that endpoint is unavailable or returns an access error, falls back to parsing the official [`https://cursor.com/install`](https://cursor.com/install) installer script.

If you want reproducible installs, pin `cursor-version` to an exact lab build id such as `2026.03.20-44cb435`. Values like `1.2.3` are not published Cursor lab artifact versions and will fail to download.

---

## Caching

The action caches the extracted Cursor CLI package across jobs using `@actions/cache`. The cache key includes the platform, architecture, and resolved version, so:

- `latest` resolves to a concrete version before caching — it won't re-download on every run once cached.
- Pinning a version (e.g. `2026.03.20-44cb435`) gives you a stable, reproducible cache hit every time.
- The full installed package is cached, not just the `cursor-agent` launcher.

---

## Troubleshooting (CI / smoke tests)

### `cursor-agent` exits with code 1 and little or no output

- **API key & billing**: Ensure `CURSOR_API_KEY` is set and valid. Agent / headless features may require an eligible Cursor plan; some errors only show up once the CLI talks to Cursor’s API.
- **Model**: The default `model: auto` should work for most accounts. If you pin `model`, confirm that model is available for your subscription.
- **CI model override**: In this repo's CI workflow, `smoke-test.env.CURSOR_SMOKE_TEST_MODEL` controls the model used by the smoke test. Set it to a known-good model for your account if `auto` fails.
- **CLI contract changes**: This action first runs `cursor-agent chat …` (with `--allow-*` flags from `permissions`). If that fails with no output or an “unknown command”-style error, it automatically retries using headless **print mode** (`-p`, `--output-format text`) as documented in the [Cursor headless CLI](https://cursor.com/docs/cli/headless) docs.
- **Debugging**: On failure, check the **job summary** — it includes `cursor-agent --version`, which invocation mode was used (`chat` vs `print`), an auth/entitlement preflight result, merged stderr, and a **Diagnostics** section when both attempts fail.

### Reproduce locally

```bash
export CURSOR_API_KEY='your-key'
cursor-agent --version
cursor-agent -p --no-interactive --output-format text --model auto "Say 'smoke test passed' and nothing else."
```

To run the action entrypoint locally from this repo:

```bash
export GITHUB_STEP_SUMMARY="$(mktemp)"
export GITHUB_OUTPUT="$(mktemp)"
export RUNNER_TOOL_CACHE="$(mktemp -d)"
export RUNNER_TEMP="$(mktemp -d)"

env "INPUT_API-KEY=$CURSOR_API_KEY" \
    "INPUT_PROMPT=Say 'smoke test passed' and nothing else." \
    "INPUT_CURSOR-VERSION=latest" \
    "INPUT_MODEL=auto" \
    "INPUT_PERMISSIONS=read-only" \
    "INPUT_TIMEOUT=60" \
    node dist/index.js
```

---

## Versioning

This project uses [changesets](https://github.com/changesets/changesets) for versioning. See [`.changeset/README.md`](.changeset/README.md) for how to add a changeset when contributing.

Major version tags (`v1`, `v2`, …) are kept up-to-date automatically by the release workflow, so `uses: PunGrumpy/cursor-action@v1` always resolves to the latest `v1.x.x` release.

---

## License

[MIT](LICENSE) © [PunGrumpy](https://github.com/PunGrumpy)
