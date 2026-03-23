export type Permission = "read-only" | "read-write" | "full";

export interface ActionInputs {
  cursorVersion: string;
  apiKey: string;
  prompt: string;
  model: string;
  workingDirectory: string;
  permissions: Permission;
  timeout: number;
}

export interface ActionOutputs {
  summary: string;
  exitCode: number;
  cacheHit: boolean;
}

export interface CursorRelease {
  version: string;
  downloadUrl: string;
  checksum?: string;
}

export type AgentInvocationMode = "chat" | "print";

export interface AgentResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  /** Which argv shape produced this result (print is headless `-p` fallback). */
  invocationMode?: AgentInvocationMode;
  /** Output of `cursor-agent --version` when collected for diagnostics. */
  cliVersion?: string;
  /** Extra context for job summary / debugging when runs fail. */
  diagnostics?: string;
}

export type Platform = "linux" | "darwin" | "win32";
export type Arch = "x64" | "arm64";
