import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  clean: true,
  outExtensions: () => ({ js: ".js" }),
  deps: {
    neverBundle: ['@cursor/sdk', '@actions/core']
  }
});
