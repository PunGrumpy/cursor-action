import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  // `dist/` is committed, so emit only what the action loads.
  dts: false,
  entry: ["src/index.ts"],
  // @cursor/sdk dynamically imports its own webpack chunks (162.js, 986.js, ...)
  // at runtime, relative to its package directory, and resolves a native
  // @cursor/sdk-<platform> package for `rg` / `cursorsandbox`. Bundling it
  // produces a file that imports fine and then dies inside Agent.create, so
  // both runtime dependencies stay external and the action installs them.
  external: ["@actions/core", "@cursor/sdk"],
  format: ["esm"],
  outExtensions: () => ({ js: ".mjs" }),
  sourcemap: false,
  target: "node20",
});
