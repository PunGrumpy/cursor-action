# @pungrumpy/cursor-action

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
