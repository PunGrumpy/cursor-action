import { registerHooks } from "node:module";

const stubUrl = new URL("sdk-stub.mjs", import.meta.url).href;

registerHooks({
  resolve: (specifier, context, nextResolve) =>
    specifier === "@cursor/sdk"
      ? { shortCircuit: true, url: stubUrl }
      : nextResolve(specifier, context),
});
