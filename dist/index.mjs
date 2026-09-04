import { endGroup, getInput, info, setFailed, setOutput, setSecret, startGroup, summary, warning } from "@actions/core";
import path from "node:path";
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
	if (timeout > 3600) warning(`Timeout is set to ${timeout}s (${Math.round(timeout / 60)}min). This is unusually long — consider if your prompt can be shortened.`);
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
const parseSummary = (stdout) => {
	const trimmed = stdout.trim();
	if (!trimmed) return "";
	try {
		const parsed = JSON.parse(trimmed);
		if (typeof parsed === "object" && parsed !== null) {
			if (typeof parsed.response === "string") return parsed.response.trim();
			if (typeof parsed.summary === "string") return parsed.summary.trim();
			if (typeof parsed.result === "string") return parsed.result.trim();
			if (typeof parsed.output === "string") return parsed.output.trim();
			if (typeof parsed.text === "string") return parsed.text.trim();
		}
	} catch {}
	return trimmed.replaceAll(/\u001B\[[0-9;]*[mGKHF]/gu, "");
};
const writeJobSummary = async (text, result) => {
	const tableRows = [["Status", result.exitCode === 0 ? "✅ Success" : `❌ Failed (exit ${result.exitCode})`], ["Exit Code", String(result.exitCode)]];
	if (result.status) tableRows.push(["Agent Status", result.status]);
	if (result.durationMs !== void 0) tableRows.push(["Duration", `${(result.durationMs / 1e3).toFixed(1)}s`]);
	if (result.usage?.totalTokens !== void 0) tableRows.push(["Total Tokens", String(result.usage.totalTokens)]);
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
const setOutputs = async (result) => {
	const text = parseSummary(result.stdout);
	const status = result.status ?? (result.exitCode === 0 ? "finished" : "error");
	setOutput("summary", text);
	setOutput("exit-code", String(result.exitCode));
	setOutput("status", status);
	await writeJobSummary(text, result);
	return {
		exitCode: result.exitCode,
		status,
		summary: text
	};
};
const maskSecret = (apiKey) => setSecret(apiKey);
//#endregion
//#region src/runner.ts
const extractErrorMessage = (error) => {
	if (error instanceof Error) return error.cause ? `${error.message}\nCause: ${error.cause}` : error.message;
	return String(error);
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
const runAgent = async (inputs) => {
	const cwd = path.resolve(inputs.workingDirectory);
	info(`Running Cursor Agent in: ${cwd}`);
	info(`Model: ${inputs.model}`);
	if (inputs.permissions !== "read-only") warning("The `permissions` input is not passed to Cursor SDK Agent.create; tool access follows your API key / account, not this field.");
	let stdout = "";
	let stderr = "";
	let exitCode = 0;
	let status = "finished";
	let durationMs;
	let usage;
	try {
		const run = await (await Agent.create({
			apiKey: inputs.apiKey,
			local: { cwd },
			model: { id: inputs.model }
		})).send(inputs.prompt);
		const timeoutMs = inputs.timeout * 1e3;
		let cancelTimer;
		let timedOut = false;
		if (timeoutMs > 0 && Number.isFinite(timeoutMs)) cancelTimer = setTimeout(() => {
			timedOut = true;
			(async () => {
				if (run.supports("cancel")) try {
					await run.cancel();
				} catch {}
			})();
		}, timeoutMs);
		try {
			for await (const event of run.stream()) if ("text" in event && typeof event.text === "string") stdout += event.text;
			const runResult = await run.wait();
			({durationMs} = runResult);
			usage = mapUsage(runResult.usage);
			if (runResult.result && typeof runResult.result === "string") stdout = runResult.result;
			({status} = runResult);
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
			}
		} finally {
			if (cancelTimer !== void 0) clearTimeout(cancelTimer);
		}
	} catch (error) {
		exitCode = 1;
		status = "error";
		stderr += extractErrorMessage(error);
		warning(`Agent execution failed: ${stderr}`);
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
