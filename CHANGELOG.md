# @pungrumpy/cursor-action

## 1.0.1

### Patch Changes

- cf2ab49: Publish a moving `v1` tag on every release, so `uses: PunGrumpy/cursor-action@v1` resolves to the latest `v1.x.x`. Previously only exact `vX.Y.Z` tags existed and `@v1` did not resolve at all.
- 2c2f2ba: Update `@cursor/sdk` to 1.0.28. It drops `sqlite3` from its dependencies in favour of an optional `@cursor/sdk/sqlite` entry point, so the action no longer pulls a native module that has to be prebuilt or compiled during install.
- cf2ab49: Document that `permissions` is validated but never enforced: the value is not passed to the SDK, so `read-only` does **not** stop the agent from editing files or running shell commands. Tool access follows your API key and account. It is wired to the SDK's tool restrictions in v2.

  `cursor-version` is likewise ignored — the SDK manages the agent version.

- cf2ab49: Fix the action failing with a module resolution error at every published tag. `dist/` was gitignored while `action.yml` executed `dist/index.mjs`, so the file never existed for consumers — only this repository's own smoke test worked, because it downloaded `dist/` as a build artifact first.

  `dist/` is now committed. It holds only this repository's own code (5.8 kB): `@cursor/sdk` cannot be bundled, because it dynamically imports its own webpack chunks at runtime and resolves a native `@cursor/sdk-<platform>` package, so it stays external and the action installs it.

## 1.0.0

### Major Changes

- e1d3c03: Migrate to the official `@cursor/sdk` and update action execution type to composite.

## 0.1.0

### Minor Changes

- [`b4f9f43`](https://github.com/PunGrumpy/cursor-action/commit/b4f9f43d1eea68d4f72b2b33096b0e6e52bb9afb) Thanks [@PunGrumpy](https://github.com/PunGrumpy)! - Implement the GitHub Action: validate inputs, install Cursor CLI with caching, run `cursor-agent`, and expose outputs plus a job summary for CI.

- [`80378b3`](https://github.com/PunGrumpy/cursor-action/commit/80378b35f172398774ae06167094ef3a40a8739f) Thanks [@PunGrumpy](https://github.com/PunGrumpy)! - Add build script with `@vercel/ncc`

- [`bdd71a9`](https://github.com/PunGrumpy/cursor-action/commit/bdd71a91db6a60650ebfbb277665d09ff4b44506) Thanks [@PunGrumpy](https://github.com/PunGrumpy)! - Add `action.yml` with documented inputs/outputs, Node 24 runtime, and `dist/index.js` entry.

### Patch Changes

- [`58d5bec`](https://github.com/PunGrumpy/cursor-action/commit/58d5becedd49a997bc18bd1c6f6e6f6c62a4872f) Thanks [@PunGrumpy](https://github.com/PunGrumpy)! - Update default model to "auto"

- [`4088bd3`](https://github.com/PunGrumpy/cursor-action/commit/4088bd321e96b85504aff05178838ac5209e786a) Thanks [@PunGrumpy](https://github.com/PunGrumpy)! - Ensure `runAgent` returns `cliVersion` when the primary `cursor-agent chat` invocation succeeds, keeping successful result shape consistent with fallback paths.

- [`532d8fd`](https://github.com/PunGrumpy/cursor-action/commit/532d8fd393da7a3b9c24da5128d76d668b159bc7) Thanks [@PunGrumpy](https://github.com/PunGrumpy)! - Fix Cursor CLI download URLs: resolve `latest` via the lab endpoint (validate HTTP 200 and lab id shape), fall back to parsing `https://cursor.com/install` when the lab `latest-version` URL returns 403, use `windows` in artifact paths on Win32, and allow pinning lab build ids in `cursor-version` input validation. Install the full extracted agent package (launcher + bundled `node`, etc.) instead of only the `cursor-agent` file, and bump cache keys so old incomplete installs are not reused. Use `fs.cp` with `force` when writing install directory entries. When `cursor-agent` exits non-zero, surface stderr in Actions warnings and in the job summary.

- [`1f1ce6c`](https://github.com/PunGrumpy/cursor-action/commit/1f1ce6c9240c061622e1c7fa3419a986bcb3822c) Thanks [@PunGrumpy](https://github.com/PunGrumpy)! - Run CI smoke tests in an isolated temporary workspace to avoid repository-local Cursor hooks/config affecting headless runs. Also expose a workflow-level smoke test model override and improve runner diagnostics with an auth/entitlement preflight check.

- [`ee1d476`](https://github.com/PunGrumpy/cursor-action/commit/ee1d4766dd74aec5da1ff9275a5480d731edb17e) Thanks [@PunGrumpy](https://github.com/PunGrumpy)! - Retry `cursor-agent` with headless print mode (`-p`) when the primary `chat` invocation fails silently or looks like a CLI mismatch; collect `cursor-agent --version` and add job-summary diagnostics. Document CI troubleshooting in the README.
