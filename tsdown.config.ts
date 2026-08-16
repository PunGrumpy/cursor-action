import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  deps: {
    alwaysBundle: ["@actions/core", "@cursor/sdk"],
    neverBundle: ["sqlite3"],
    onlyBundle: false,
  },
  // `dist/` is committed, so every rebuild rewrites the whole blob in git
  // history. Emit the single file the runner needs and nothing else.
  dts: false,
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
  sourcemap: false,
  target: "node20",
});
