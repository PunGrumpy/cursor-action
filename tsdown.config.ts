import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  deps: {
    alwaysBundle: ["@actions/core", "@cursor/sdk"],
    neverBundle: ["sqlite3"],
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
