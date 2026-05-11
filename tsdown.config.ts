import { defineConfig } from "tsdown";

export default defineConfig({
  banner: {
    js: `import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);\n`,
  },
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
