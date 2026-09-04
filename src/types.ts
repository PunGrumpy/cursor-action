export type Permission = "read-only" | "read-write" | "full";

export interface ActionInputs {
  apiKey: string;
  prompt: string;
  model: string;
  workingDirectory: string;
  permissions: Permission;
  timeout: number;
  cursorVersion?: string;
}

export interface ActionOutputs {
  summary: string;
  exitCode: number;
  status: string;
}

export interface TokenUsageStats {
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  totalTokens?: number;
}

export interface AgentResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  status?: string;
  durationMs?: number;
  usage?: TokenUsageStats;
  diagnostics?: string;
}
