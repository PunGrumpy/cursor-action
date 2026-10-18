import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import { info, warning } from "@actions/core";
import { Agent } from "@cursor/sdk";
import type { Run, RunResult, SDKAgent, SDKMessage } from "@cursor/sdk";

import type { ActionInputs, AgentResult, TokenUsageStats } from "./types";

/** Longest delay Node's timers accept; larger values would fire immediately. */
const MAX_TIMER_MS = 2_147_483_647;
/** How long to wait for the SDK to settle after a cancel request. */
const DEFAULT_CANCEL_GRACE_MS = 10_000;
/** How long to wait for the agent to release its local executor. */
const DEFAULT_DISPOSE_TIMEOUT_MS = 15_000;

export interface RunAgentOptions {
  cancelGraceMs?: number;
  disposeTimeoutMs?: number;
}

const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.cause
      ? `${error.message}\nCause: ${error.cause}`
      : error.message;
  }
  return String(error);
};

/** Resolves to `undefined` when `promise` has not settled within `ms`. */
const withTimeout = async <T>(
  promise: Promise<T>,
  ms: number
): Promise<T | undefined> => {
  const controller = new AbortController();
  try {
    return await Promise.race([
      promise,
      delay(ms, undefined, { signal: controller.signal }),
    ]);
  } finally {
    // Cancels the pending timer; the aborted delay is already handled by the race.
    controller.abort();
  }
};

/** Resolves to `undefined` instead of rejecting. */
const quietly = async <T>(promise: Promise<T>): Promise<T | undefined> => {
  try {
    return await promise;
  } catch {
    return undefined;
  }
};

const disposeAgent = async (
  agent: SDKAgent,
  timeoutMs: number
): Promise<void> => {
  try {
    const disposed = await withTimeout(
      agent[Symbol.asyncDispose]().then(() => true),
      timeoutMs
    );
    if (disposed === undefined) {
      warning(`The agent did not release its resources within ${timeoutMs}ms.`);
    }
  } catch (error) {
    warning(`Failed to release the agent: ${extractErrorMessage(error)}`);
  }
};

/**
 * The SDK streams the answer as `assistant` events, one text delta per event.
 * `thinking` and `task` events also carry a `text` field, but that is the
 * model's reasoning and subagent chatter, not the answer.
 */
const assistantText = (event: SDKMessage): string => {
  if (event.type !== "assistant") {
    return "";
  }
  let text = "";
  for (const block of event.message.content) {
    if (block.type === "text") {
      text += block.text;
    }
  }
  return text;
};

const mapUsage = (usage: RunResult["usage"]): TokenUsageStats | undefined => {
  if (!usage) {
    return undefined;
  }
  const {
    cacheReadTokens,
    cacheWriteTokens,
    inputTokens,
    outputTokens,
    totalTokens,
  } = usage;
  return {
    cacheReadTokens,
    cacheWriteTokens,
    inputTokens,
    outputTokens,
    totalTokens,
  };
};

interface SettledRun {
  /** `undefined` when the run did not settle, or failed after the deadline. */
  result: RunResult | undefined;
  timedOut: boolean;
}

/**
 * Waits for `consume` until the `timeoutSeconds` deadline, then asks the SDK to
 * cancel and waits at most `cancelGraceMs` for the run to stop.
 */
const settleRun = async (
  run: Run,
  consume: Promise<RunResult>,
  timeoutSeconds: number,
  cancelGraceMs: number
): Promise<SettledRun> => {
  // Once the deadline passes nobody awaits `consume` directly; this keeps a
  // late rejection from surfacing as an unhandled rejection.
  const settled = quietly(consume);

  const timeoutMs = timeoutSeconds * 1000;
  const hasDeadline = timeoutMs > 0 && timeoutMs <= MAX_TIMER_MS;
  const result = hasDeadline
    ? await withTimeout(consume, timeoutMs)
    : await consume;
  if (result !== undefined) {
    return { result, timedOut: false };
  }

  if (run.supports("cancel")) {
    try {
      await withTimeout(run.cancel(), cancelGraceMs);
    } catch {
      // Best-effort cancel on timeout; the grace period below bounds the wait.
    }
  }
  return { result: await withTimeout(settled, cancelGraceMs), timedOut: true };
};

export const runAgent = async (
  inputs: ActionInputs,
  options: RunAgentOptions = {}
): Promise<AgentResult> => {
  const cwd = path.resolve(inputs.workingDirectory);
  const cancelGraceMs = options.cancelGraceMs ?? DEFAULT_CANCEL_GRACE_MS;
  const disposeTimeoutMs =
    options.disposeTimeoutMs ?? DEFAULT_DISPOSE_TIMEOUT_MS;

  info(`Running Cursor Agent in: ${cwd}`);
  info(`Model: ${inputs.model}`);
  if (inputs.permissions !== "read-only") {
    warning(
      "The `permissions` input is not passed to Cursor SDK Agent.create; " +
        "tool access follows your API key / account, not this field."
    );
  }

  let stdout = "";
  let stderr = "";
  let exitCode = 0;
  let status = "finished";
  let durationMs: number | undefined;
  let usage: TokenUsageStats | undefined;
  let agent: SDKAgent | undefined;

  try {
    agent = await Agent.create({
      apiKey: inputs.apiKey,
      local: { cwd },
      model: { id: inputs.model },
    });

    const run = await agent.send(inputs.prompt);

    const consume = (async (): Promise<RunResult> => {
      for await (const event of run.stream()) {
        stdout += assistantText(event);
      }
      return await run.wait();
    })();

    const { result: runResult, timedOut } = await settleRun(
      run,
      consume,
      inputs.timeout,
      cancelGraceMs
    );

    if (runResult === undefined) {
      exitCode = 1;
      status = "cancelled";
      const msg = `Agent run timed out after ${inputs.timeout}s and did not stop within ${cancelGraceMs}ms of the cancel request.`;
      stderr += stderr ? `\n${msg}` : msg;
      warning(msg);
    } else {
      ({ durationMs, status } = runResult);
      usage = mapUsage(runResult.usage);

      if (runResult.result && typeof runResult.result === "string") {
        stdout = runResult.result;
      }

      if (status === "error") {
        exitCode = 1;
        const msg = runResult.error?.message ?? "Agent run failed with error.";
        stderr += stderr ? `\n${msg}` : msg;
        warning(`Agent execution failed: ${msg}`);
      } else if (status === "cancelled") {
        exitCode = 1;
        const msg = timedOut
          ? `Agent run timed out after ${inputs.timeout}s and was cancelled.`
          : "Agent run was cancelled.";
        stderr += stderr ? `\n${msg}` : msg;
        warning(msg);
      } else if (timedOut) {
        warning(
          `Agent run exceeded the ${inputs.timeout}s timeout but finished while the cancel request was pending.`
        );
      }
    }
  } catch (error) {
    exitCode = 1;
    status = "error";
    stderr += extractErrorMessage(error);
    warning(`Agent execution failed: ${stderr}`);
  } finally {
    if (agent !== undefined) {
      await disposeAgent(agent, disposeTimeoutMs);
    }
  }

  return {
    diagnostics: exitCode === 0 ? undefined : stderr,
    durationMs,
    exitCode,
    status,
    stderr,
    stdout,
    usage,
  };
};
