# Security model

This file describes who and what cursor-action trusts, so security reviews and scans judge findings against it. To report a vulnerability, use GitHub's private advisory flow: https://github.com/PunGrumpy/cursor-action/security/advisories/new

## System overview

cursor-action is a GitHub Action that runs a Cursor agent in a workflow through `@cursor/sdk`. `action.yml` passes inputs through the environment to the committed bundle `dist/index.mjs`.

## Components

| Component | Code | Distribution surface |
| --- | --- | --- |
| cursor-action | `action.yml`, `src/`, `dist/index.mjs` | GitHub Action |
| CI/release | `.github/workflows/*` | GitHub Action |

## Assets

- Secrets in the CI of Action users: the Cursor API key (`api-key`) and `GITHUB_TOKEN` or other job credentials.
- Integrity of the committed `dist/` and release tags.

Critical assets across the maintainer's projects, in the maintainer's words: secrets in CI of action users (Cursor API key, `GITHUB_TOKEN`); root privileges and network config on Macs running Peony; integrity of published npm packages and releases; pigo API availability; and the data of downstream apps that use the libraries (logs, vectors, LINE messages).

## Trust boundaries and entry points

- **Workflow author → Action**: `inputs.*` reach `dist/index.mjs` through env vars, not inlined into shell.
- **Pull request content → agent**: the working tree (including `.cursor/` hooks and settings) and prompt text can come from an untrusted PR. The `permissions` input (`read-only` by default, `full` enables shell) is meant to bound what the agent can do.
- **Agent → network**: tools such as `webFetch` can send data out.

## Attackers that matter

- A contributor opening a malicious pull request, including prompt injection.
- A supply-chain attacker targeting release tags or the committed bundle.

## Existing controls

- Inputs via env, read-only default, the API key is scrubbed from the environment after it is read.

## Out of scope

- `docs/` (docs site).
- Across the maintainer's projects: docs and marketing sites, and bench and video packages.
