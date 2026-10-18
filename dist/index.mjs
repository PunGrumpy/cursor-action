import { endGroup, getInput, info, setFailed, setOutput, setSecret, startGroup, summary, warning } from "@actions/core";
import path from "node:path";
import { setTimeout } from "node:timers/promises";
import { Agent } from "@cursor/sdk";
//#region src/input.ts
const VALID_PERMISSIONS = [
	"read-only",
	"read-write",
	"full"
];
const getInputs = () => {
	const cursorVersionRaw = getInput("cursor-version", { required: false });
	const cursorVersion = cursorVersionRaw.trim().length > 0 ? cursorVersionRaw.trim() : void 0;
	const apiKey = getInput("api-key", { required: true });
	const prompt = getInput("prompt", { required: true });
	const model = getInput("model", { required: false }) || "default";
	const workingDirectory = getInput("working-directory", { required: false }) || ".";
	const permissionsRaw = getInput("permissions", { required: false }) || "read-only";
	const timeoutRaw = getInput("timeout", { required: false }) || "300";
	if (cursorVersion && cursorVersion !== "latest") warning("The 'cursor-version' input is deprecated. The Action now uses the official @cursor/sdk which automatically manages the agent version.");
	if (!VALID_PERMISSIONS.includes(permissionsRaw)) throw new Error(`Invalid 'permissions' value: '${permissionsRaw}'. Must be one of: ${VALID_PERMISSIONS.join(", ")}`);
	const timeout = Math.trunc(Number(timeoutRaw));
	if (Number.isNaN(timeout) || timeout <= 0) throw new Error(`Invalid 'timeout' value: '${timeoutRaw}'. Must be a positive integer (seconds).`);
	if (timeout > 3600) warning(`Timeout is set to ${timeout}s (${Math.round(timeout / 60)}min). This is unusually long. Consider if your prompt can be shortened.`);
	if (!prompt.trim()) throw new Error("The 'prompt' input cannot be empty.");
	return {
		apiKey,
		...cursorVersion === void 0 ? {} : { cursorVersion },
		model,
		permissions: permissionsRaw,
		prompt,
		timeout,
		workingDirectory
	};
};
//#endregion
//#region src/output.ts
/**
* The SDK returns the final assistant message as plain text. Only whitespace
* and stray terminal colour codes are removed; a JSON-shaped answer is
* published as-is so callers can parse the whole object.
*/
const parseSummary = (stdout) => stdout.trim().replaceAll(/\u001B\[[0-9;]*[mGKHF]/gu, "");
const buildSummaryTableRows = (result) => {
	const rows = [["Status", result.exitCode === 0 ? "✅ Success" : `❌ Failed (exit ${result.exitCode})`], ["Exit Code", String(result.exitCode)]];
	if (result.status) rows.push(["Agent Status", result.status]);
	if (result.durationMs !== void 0) rows.push(["Duration", `${(result.durationMs / 1e3).toFixed(1)}s`]);
	const { usage } = result;
	if (usage?.inputTokens !== void 0) rows.push(["Input Tokens", String(usage.inputTokens)]);
	if (usage?.outputTokens !== void 0) rows.push(["Output Tokens", String(usage.outputTokens)]);
	if (usage?.cacheReadTokens !== void 0 && usage.cacheReadTokens > 0) rows.push(["Cache Read Tokens", String(usage.cacheReadTokens)]);
	if (usage?.totalTokens !== void 0) rows.push(["Total Tokens", String(usage.totalTokens)]);
	return rows;
};
const writeJobSummary = async (text, result) => {
	const tableRows = buildSummaryTableRows(result);
	await summary.addHeading("Cursor Agent Run", 2).addTable([[{
		data: "Field",
		header: true
	}, {
		data: "Value",
		header: true
	}], ...tableRows]).addHeading("Agent Response", 3).addRaw(text ? `\n\`\`\`\n${text}\n\`\`\`\n` : "_No output was produced._");
	const errText = result.stderr.trim();
	if (errText) await summary.addHeading("Agent Error (stderr)", 3).addRaw(`\n\`\`\`\n${errText.slice(0, 2e4)}${errText.length > 2e4 ? "\n… (truncated)" : ""}\n\`\`\`\n`);
	const diag = result.diagnostics?.trim();
	if (diag && diag !== errText) await summary.addHeading("Diagnostics", 3).addRaw(`\n\`\`\`\n${diag.slice(0, 2e4)}${diag.length > 2e4 ? "\n… (truncated)" : ""}\n\`\`\`\n`);
	await summary.write();
};
const setMetricOutputs = (result) => {
	if (result.durationMs !== void 0) setOutput("duration-ms", String(result.durationMs));
	const { usage } = result;
	if (usage?.totalTokens !== void 0) setOutput("total-tokens", String(usage.totalTokens));
	if (usage?.inputTokens !== void 0) setOutput("input-tokens", String(usage.inputTokens));
	if (usage?.outputTokens !== void 0) setOutput("output-tokens", String(usage.outputTokens));
};
const setOutputs = async (result) => {
	const text = parseSummary(result.stdout);
	const status = result.status ?? (result.exitCode === 0 ? "finished" : "error");
	setOutput("summary", text);
	setOutput("exit-code", String(result.exitCode));
	setOutput("status", status);
	setMetricOutputs(result);
	await writeJobSummary(text, result);
	const { usage } = result;
	return {
		durationMs: result.durationMs,
		exitCode: result.exitCode,
		inputTokens: usage?.inputTokens,
		outputTokens: usage?.outputTokens,
		status,
		summary: text,
		totalTokens: usage?.totalTokens
	};
};
const maskSecret = (apiKey) => setSecret(apiKey);
//#endregion
//#region src/permissions.ts
/**
* Tool names come from the SDK's `ToolName` vocabulary
* (node_modules/@cursor/sdk/dist/esm/options.d.ts). `Agent.create` throws a
* ConfigurationError for a name it does not know, so only use names from that
* literal list.
*/
const READ_ONLY_TOOLS = [
	"read",
	"grep",
	"glob",
	"ls",
	"semSearch",
	"readLints",
	"webSearch",
	"webFetch",
	"readTodos",
	"updateTodos"
];
/** File edits stay available; commands and subagents (which carry their own shell) do not. */
const READ_WRITE_DISALLOWED_TOOLS = ["shell", "task"];
const toolRestrictionsFor = (permission) => {
	switch (permission) {
		case "read-only": return { tools: [...READ_ONLY_TOOLS] };
		case "read-write": return { disallowedTools: [...READ_WRITE_DISALLOWED_TOOLS] };
		case "full": return {};
		default: throw new Error(`Unhandled permissions value: ${String(permission)}`);
	}
};
//#endregion
//#region src/runner.ts
/** Longest delay Node's timers accept; larger values would fire immediately. */
const MAX_TIMER_MS = 2147483647;
/** How long to wait for the SDK to settle after a cancel request. */
const DEFAULT_CANCEL_GRACE_MS = 1e4;
/** How long to wait for the agent to release its local executor. */
const DEFAULT_DISPOSE_TIMEOUT_MS = 15e3;
const extractErrorMessage = (error) => {
	if (error instanceof Error) return error.cause ? `${error.message}\nCause: ${error.cause}` : error.message;
	return String(error);
};
/** Resolves to `undefined` when `promise` has not settled within `ms`. */
const withTimeout = async (promise, ms) => {
	const controller = new AbortController();
	try {
		return await Promise.race([promise, setTimeout(ms, void 0, { signal: controller.signal })]);
	} finally {
		controller.abort();
	}
};
/** Resolves to `undefined` instead of rejecting. */
const quietly = async (promise) => {
	try {
		return await promise;
	} catch {
		return;
	}
};
const disposeAgent = async (agent, timeoutMs) => {
	try {
		if (await withTimeout(agent[Symbol.asyncDispose]().then(() => true), timeoutMs) === void 0) warning(`The agent did not release its resources within ${timeoutMs}ms.`);
	} catch (error) {
		warning(`Failed to release the agent: ${extractErrorMessage(error)}`);
	}
};
/**
* The SDK streams the answer as `assistant` events, one text delta per event.
* `thinking` and `task` events also carry a `text` field, but that is the
* model's reasoning and subagent chatter, not the answer.
*/
const assistantText = (event) => {
	if (event.type !== "assistant") return "";
	let text = "";
	for (const block of event.message.content) if (block.type === "text") text += block.text;
	return text;
};
const mapUsage = (usage) => {
	if (!usage) return;
	const { cacheReadTokens, cacheWriteTokens, inputTokens, outputTokens, totalTokens } = usage;
	return {
		cacheReadTokens,
		cacheWriteTokens,
		inputTokens,
		outputTokens,
		totalTokens
	};
};
/**
* Waits for `consume` until the `timeoutSeconds` deadline, then asks the SDK to
* cancel and waits at most `cancelGraceMs` for the run to stop.
*/
const settleRun = async (run, consume, timeoutSeconds, cancelGraceMs) => {
	const settled = quietly(consume);
	const timeoutMs = timeoutSeconds * 1e3;
	const result = timeoutMs > 0 && timeoutMs <= MAX_TIMER_MS ? await withTimeout(consume, timeoutMs) : await consume;
	if (result !== void 0) return {
		result,
		timedOut: false
	};
	if (run.supports("cancel")) try {
		await withTimeout(run.cancel(), cancelGraceMs);
	} catch {}
	return {
		result: await withTimeout(settled, cancelGraceMs),
		timedOut: true
	};
};
const runAgent = async (inputs, options = {}) => {
	const cwd = path.resolve(inputs.workingDirectory);
	const cancelGraceMs = options.cancelGraceMs ?? DEFAULT_CANCEL_GRACE_MS;
	const disposeTimeoutMs = options.disposeTimeoutMs ?? DEFAULT_DISPOSE_TIMEOUT_MS;
	info(`Running Cursor Agent in: ${cwd}`);
	info(`Model: ${inputs.model}`);
	info(`Permissions: ${inputs.permissions}`);
	let stdout = "";
	let stderr = "";
	let exitCode = 0;
	let status = "finished";
	let durationMs;
	let usage;
	let agent;
	try {
		agent = await Agent.create({
			apiKey: inputs.apiKey,
			local: { cwd },
			model: { id: inputs.model },
			...toolRestrictionsFor(inputs.permissions)
		});
		const run = await agent.send(inputs.prompt);
		const { result: runResult, timedOut } = await settleRun(run, (async () => {
			for await (const event of run.stream()) stdout += assistantText(event);
			return await run.wait();
		})(), inputs.timeout, cancelGraceMs);
		if (runResult === void 0) {
			exitCode = 1;
			status = "cancelled";
			const msg = `Agent run timed out after ${inputs.timeout}s and did not stop within ${cancelGraceMs}ms of the cancel request.`;
			stderr += stderr ? `\n${msg}` : msg;
			warning(msg);
		} else {
			({durationMs, status} = runResult);
			usage = mapUsage(runResult.usage);
			if (runResult.result && typeof runResult.result === "string") stdout = runResult.result;
			if (status === "error") {
				exitCode = 1;
				const msg = runResult.error?.message ?? "Agent run failed with error.";
				stderr += stderr ? `\n${msg}` : msg;
				warning(`Agent execution failed: ${msg}`);
			} else if (status === "cancelled") {
				exitCode = 1;
				const msg = timedOut ? `Agent run timed out after ${inputs.timeout}s and was cancelled.` : "Agent run was cancelled.";
				stderr += stderr ? `\n${msg}` : msg;
				warning(msg);
			} else if (timedOut) warning(`Agent run exceeded the ${inputs.timeout}s timeout but finished while the cancel request was pending.`);
		}
	} catch (error) {
		exitCode = 1;
		status = "error";
		stderr += extractErrorMessage(error);
		warning(`Agent execution failed: ${stderr}`);
	} finally {
		if (agent !== void 0) await disposeAgent(agent, disposeTimeoutMs);
	}
	return {
		diagnostics: exitCode === 0 ? void 0 : stderr,
		durationMs,
		exitCode,
		status,
		stderr,
		stdout,
		usage
	};
};
//#endregion
//#region src/index.ts
const run = async () => {
	try {
		const inputs = getInputs();
		maskSecret(inputs.apiKey);
		startGroup("🤖 Running cursor-agent");
		const result = await runAgent(inputs);
		endGroup();
		const outputs = await setOutputs(result);
		if (outputs.exitCode !== 0) setFailed(`cursor-agent exited with code ${outputs.exitCode}. See the job summary for details.`);
	} catch (error) {
		if (error instanceof Error) setFailed(error.message);
		else setFailed(String(error));
	}
};
run();
//#endregion
export { run };
