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
  // @cursor/sdk ships prebuilt code that uses direct `eval`; we bundle it for the
  // action runtime. Suppress Rolldown's EVAL warnings for that dependency only.
  inputOptions: {
    onLog(level, log, defaultHandler) {
      if (
        level === "warn" &&
        typeof log === "object" &&
        log.code === "EVAL" &&
        (log.id?.includes("@cursor/sdk") ||
          log.loc?.file?.includes("@cursor/sdk"))
      ) {
        return;
      }
      defaultHandler(level, log);
    },
  },
  outExtensions: () => ({ js: ".mjs" }),
  target: "node20",
});
