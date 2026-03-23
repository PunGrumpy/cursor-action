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

| Input               | Required | Default             | Description                                                           |
| ------------------- | -------- | ------------------- | --------------------------------------------------------------------- |
| `api-key`           | ✅       | —                   | Your Cursor API key. Store as a secret.                               |
| `prompt`            | ✅       | —                   | The prompt to pass to `cursor-agent`.                                 |
| `cursor-version`    | ❌       | `latest`            | Cursor CLI version to install. Use `latest` or a semver like `1.2.3`. |
| `model`             | ❌       | `claude-sonnet-4-5` | Model for the agent to use.                                           |
| `working-directory` | ❌       | `.`                 | Directory the agent operates in.                                      |
| `permissions`       | ❌       | `read-only`         | Agent permissions: `read-only`, `read-write`, or `full`.              |
| `timeout`           | ❌       | `300`               | Timeout in seconds before the agent is killed.                        |

## Outputs

| Output      | Description                                         |
| ----------- | --------------------------------------------------- |
| `summary`   | Text response from the agent.                       |
| `exit-code` | Raw exit code from the `cursor-agent` process.      |
| `cache-hit` | `"true"` if the CLI binary was restored from cache. |

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
    cursor-version: "1.2.3"
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

## Caching

The action caches the Cursor CLI binary across jobs using `@actions/cache`. The cache key includes the platform, architecture, and resolved version, so:

- `latest` resolves to a concrete version before caching — it won't re-download on every run once cached.
- Pinning a version (e.g. `1.2.3`) gives you a stable, reproducible cache hit every time.

---

## Versioning

This project uses [changesets](https://github.com/changesets/changesets) for versioning. See [`.changeset/README.md`](.changeset/README.md) for how to add a changeset when contributing.

Major version tags (`v1`, `v2`, …) are kept up-to-date automatically by the release workflow, so `uses: PunGrumpy/cursor-action@v1` always resolves to the latest `v1.x.x` release.

---

## License

[MIT](LICENSE) © [PunGrumpy](https://github.com/PunGrumpy)
