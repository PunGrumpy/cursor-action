import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import react from "ultracite/oxlint/react";

export default defineConfig({
  extends: [core, react],
  ignorePatterns: ["dist/**"],
  // A suppression that no longer suppresses anything reads as "this rule fires
  // here", which is the opposite of the truth. Make the linter say so.
  options: {
    reportUnusedDisableDirectives: "error",
  },
});
