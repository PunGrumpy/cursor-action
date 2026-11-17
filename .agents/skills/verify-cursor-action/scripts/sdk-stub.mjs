import { appendFileSync } from "node:fs";

const scenario = process.env.VERIFY_SCENARIO ?? "finished";
const logPath = process.env.VERIFY_STUB_LOG;
const startedAt = Date.now();

const record = (event) => {
  if (logPath) {
    appendFileSync(
      logPath,
      `${JSON.stringify({ atMs: Date.now() - startedAt, event })}\n`
    );
  }
};

const pending = () => Promise.withResolvers().promise;

const iterate = (next) => ({ [Symbol.asyncIterator]: () => ({ next }) });

const supportsCancel = (op) => op === "cancel";

const stubCatalog = [
  {
    displayName: "Stub Model",
    id: "stub-model",
    variants: [{ displayName: "Default", isDefault: true, params: [] }],
  },
];

const answerEvent = {
  message: { content: [{ text: "stub answer", type: "text" }] },
  type: "assistant",
};

const finishedRun = () => {
  const events = [answerEvent];
  return {
    cancel: () => Promise.resolve(record("cancel")),
    stream: () =>
      iterate(() =>
        Promise.resolve(
          events.length > 0
            ? { done: false, value: events.shift() }
            : { done: true, value: undefined }
        )
      ),
    supports: supportsCancel,
    wait: () =>
      Promise.resolve({
        durationMs: 5,
        id: "run-stub",
        result: "stub answer",
        status: "finished",
      }),
  };
};

const cancellableRun = () => {
  const stopped = Promise.withResolvers();
  return {
    cancel: () => {
      record("cancel");
      stopped.resolve();
      return Promise.resolve();
    },
    stream: () =>
      iterate(async () => {
        await stopped.promise;
        return { done: true, value: null };
      }),
    supports: supportsCancel,
    wait: async () => {
      await stopped.promise;
      return { id: "run-stub", status: "cancelled" };
    },
  };
};

const unresponsiveRun = (cancelOutcome) => ({
  cancel: () => {
    record("cancel");
    return cancelOutcome();
  },
  stream: () => iterate(pending),
  supports: supportsCancel,
  wait: pending,
});

const runs = {
  cancels: cancellableRun,
  finished: finishedRun,
  "hung-cancel": () => unresponsiveRun(pending),
  "ignores-cancel": () => unresponsiveRun(() => Promise.resolve()),
};

const createAgent = () => {
  record("create");
  if (scenario === "model-error") {
    throw new Error(
      "Cannot use this model: missing-model. Available models: stub-model"
    );
  }
  const makeRun = runs[scenario];
  if (!makeRun) {
    throw new Error(`Unknown VERIFY_SCENARIO: ${scenario}`);
  }
  return {
    [Symbol.asyncDispose]: () => Promise.resolve(record("dispose")),
    send: () => {
      record("send");
      return Promise.resolve(makeRun());
    },
  };
};

export const Agent = {
  create: () => {
    try {
      return Promise.resolve(createAgent());
    } catch (error) {
      return Promise.reject(error);
    }
  },
};

export const Cursor = {
  models: { list: () => Promise.resolve(stubCatalog) },
};
