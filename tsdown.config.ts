import { defineConfig } from "tsdown";

export default defineConfig({
  banner: {
    js: `import { fileURLToPath as __cursorActionFileUrlToPath } from "node:url";
import { dirname as __cursorActionDirname } from "node:path";
const __filename = __cursorActionFileUrlToPath(import.meta.url);
const __dirname = __cursorActionDirname(__filename);\n`,
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
