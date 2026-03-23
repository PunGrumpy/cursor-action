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

export interface AgentResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export type Platform = "linux" | "darwin" | "win32";
export type Arch = "x64" | "arm64";
