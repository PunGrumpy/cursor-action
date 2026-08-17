# Cursor Action

Run [Cursor](https://cursor.com) agents in GitHub Actions using the official [`@cursor/sdk`](https://www.npmjs.com/package/@cursor/sdk). An independent project, not affiliated with or endorsed by Cursor.

[![CI](https://github.com/PunGrumpy/cursor-action/actions/workflows/ci.yml/badge.svg)](https://github.com/PunGrumpy/cursor-action/actions/workflows/ci.yml) [![Release](https://github.com/PunGrumpy/cursor-action/actions/workflows/release.yml/badge.svg)](https://github.com/PunGrumpy/cursor-action/actions/workflows/release.yml)

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

## Reference

<!-- reference:start -->

### Inputs

| Input | Required | Default | Description |
| --- | --- | --- | --- |
| `cursor-version` | ❌ | `latest` | (Deprecated) The SDK automatically manages the agent version. |
| `api-key` | ✅ | — | Cursor API key for authentication |
| `prompt` | ✅ | — | Prompt to pass to cursor-agent |
| `model` | ❌ | `default` | Model id for the agent (e.g. default, composer-2). The Cursor SDK does not accept auto. |
| `working-directory` | ❌ | `.` | Working directory for the agent to operate in |
| `permissions` | ❌ | `read-only` | Validated but NOT enforced: 'read-only' does not stop the agent from editing files or running shell commands. Wired to the SDK in v2. |
| `timeout` | ❌ | `300` | Timeout in seconds for the agent run |

### Outputs

| Output      | Description                               |
| ----------- | ----------------------------------------- |
| `summary`   | Text summary returned by the cursor-agent |
| `exit-code` | Exit code from the cursor-agent process   |

<!-- reference:end -->

> [!WARNING]
>
> `permissions` does not restrict the agent today. The value is validated and then discarded — tool access follows whatever your API key and account allow, so `read-only` does **not** stop the agent from editing files or running shell commands. It is wired to the SDK's tool restrictions in v2.

> [!IMPORTANT]
>
> Treat `summary` as untrusted model output. Pass it through `env:` rather than interpolating `${{ steps.<id>.outputs.summary }}` directly into a `run:` script or a `github-script` body — interpolation splices the text into the script before it executes.

## Documentation

Worked examples, what the action does at runtime, and troubleshooting live in [`docs/`](docs), which is published as the documentation site. The tables above are generated from `action.yml` by the same script that generates the site's reference page, so neither can drift from the manifest.

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

`dist/` is committed on purpose — GitHub Actions executes it straight from the tag. If you changed anything under `src/`, run `bun run build` and commit the result; CI fails when `dist/` is out of date. The bundle only contains this repository's own code (a few KB); `@actions/core` and `@cursor/sdk` stay external and are installed by the action at runtime, so `package-lock.json` must stay in sync with `package.json`.

### Work on the documentation site

```bash
bun run docs:reference   # regenerate the reference tables from action.yml
bun run docs:dev         # http://localhost:3000
```

`docs/` is a separate Fumapress project with its own lockfile, so `bun install` at the repository root does not pull in its dependencies.

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

- `CI` runs `typecheck`, `lint`, `test`, `build`, and a `dist/` freshness check on every push and pull request. The `Docs` job regenerates the reference from `action.yml`, typechecks the site, and builds it.
- The `Integration` jobs install the action's runtime dependencies and run it with an invalid key on Ubuntu, Windows, and macOS. Being rejected at authentication is the pass condition: it proves the dependency tree resolves and the SDK reaches Cursor, without spending an agent run.
- `Smoke Test` runs the action for real and needs a `CURSOR_API_KEY` on a paid plan, so it only runs from the Actions tab (`workflow_dispatch`).
- `Release` runs Changesets on pushes to `main` to open a release PR or publish, then moves the `v1` tag to the published version.
- `uses: PunGrumpy/cursor-action@v1` tracks the latest `v1.x.x`. Pin a full tag or a commit SHA if you want a frozen version.

## Versioning

This project uses [Changesets](https://github.com/changesets/changesets). See [`.changeset/README.md`](.changeset/README.md) for the contribution workflow.

## License

[MIT](LICENSE) © [PunGrumpy](https://github.com/PunGrumpy)
