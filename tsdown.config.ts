import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  deps: {
    alwaysBundle: ["@actions/core", "@cursor/sdk"],
    onlyBundle: false,
  },
  entry: ["src/index.ts"],
  format: ["esm"],
  outExtensions: () => ({ js: ".mjs" }),
  target: "node20",
});
