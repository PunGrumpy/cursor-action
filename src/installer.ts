import { homedir } from "node:os";
import path from "node:path";

import { restoreCache, saveCache } from "@actions/cache";
import { addPath, debug, info, warning } from "@actions/core";
import { HttpClient } from "@actions/http-client";
import { mkdirP, mv } from "@actions/io";
import {
  cacheDir,
  downloadTool,
  extractTar,
  extractZip,
  find,
} from "@actions/tool-cache";

import type { Arch, Platform } from "./types";

const CURSOR_DOWNLOAD_BASE = "https://downloads.cursor.com/lab";
const CURSOR_VERSION_URL = "https://downloads.cursor.com/lab/latest-version";

const getPlatform = (): Platform => {
  const p = process.platform;
  if (p === "linux") {
    return "linux";
  }
  if (p === "darwin") {
    return "darwin";
  }
  if (p === "win32") {
    return "win32";
  }

  throw new Error(`Unsupported platform: ${p}`);
};

const getArch = (): Arch => {
  const a = process.arch;
  if (a === "x64") {
    return "x64";
  }
  if (a === "arm64") {
    return "arm64";
  }
  throw new Error(`Unsupported architecture: ${a}`);
};

/**
 * Resolves "latest" to a concrete semver version string by querying
 * Cursor's version endpoint.
 */
export const resolveVersion = async (version: string): Promise<string> => {
  if (version !== "latest") {
    // Keep pinned versions local; no network call needed.
    return version.replace(/^v/, "");
  }

  debug("Resolving latest Cursor CLI version...");
  const client = new HttpClient("cursor-action");

  try {
    const response = await client.get(CURSOR_VERSION_URL);
    const body = await response.readBody();
    const resolved = body.trim().replace(/^v/, "");
    debug(`Resolved latest version: ${resolved}`);
    return resolved;
  } catch (error) {
    throw new Error(`Failed to resolve latest Cursor CLI version: ${error}`, {
      cause: error,
    });
  }
};

/**
 * Builds the download URL for the Cursor CLI tarball.
 * Pattern: https://downloads.cursor.com/lab/{version}/{platform}/{arch}/agent-cli-package.tar.gz
 */
export const buildDownloadUrl = (
  version: string,
  platform: Platform,
  arch: Arch
): string => {
  const ext = platform === "win32" ? "zip" : "tar.gz";
  const platformSegment = platform === "win32" ? "windows" : platform;
  return `${CURSOR_DOWNLOAD_BASE}/${version}/${platformSegment}/${arch}/agent-cli-package.${ext}`;
};

const buildCacheKey = (
  version: string,
  platform: Platform,
  arch: Arch
): string => `cursor-cli-${platform}-${arch}-${version}`;

const getBinaryName = (): string =>
  process.platform === "win32" ? "cursor-agent.exe" : "cursor-agent";

const findBinary = async (dir: string, binaryName: string): Promise<string> => {
  const { promises: fs } = await import("node:fs");

  const search = async (currentDir: string): Promise<string | null> => {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isFile() && entry.name === binaryName) {
        return fullPath;
      }
      if (entry.isDirectory()) {
        const found = await search(fullPath);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };

  const result = await search(dir);
  if (!result) {
    throw new Error(
      `Could not find '${binaryName}' binary in extracted archive at ${dir}`
    );
  }
  return result;
};

/**
 * Installer entry point
 * @returns Returns { binPath, cacheHit } where binPath is the directory added to PATH
 */
export const installCursorCLI = async (
  requestedVersion: string
): Promise<{
  binPath: string;
  cacheHit: boolean;
  resolvedVersion: string;
}> => {
  const platform = getPlatform();
  const arch = getArch();
  const resolvedVersion = await resolveVersion(requestedVersion);

  info(`Installing Cursor CLI v${resolvedVersion} (${platform}/${arch})`);

  // Check @actions/tool-cache first (within-job cache)
  const cachedPath = find("cursor-agent", resolvedVersion, arch);
  if (cachedPath) {
    info(`Found Cursor CLI in tool cache: ${cachedPath}`);
    addPath(cachedPath);
    return { binPath: cachedPath, cacheHit: true, resolvedVersion };
  }

  // Check @actions/cache (cross-job cache)
  const installDir = path.join(homedir(), ".cursor-cli", resolvedVersion);
  const cacheKey = buildCacheKey(resolvedVersion, platform, arch);
  const cachePaths = [installDir];

  const restoredKey = await restoreCache(cachePaths, cacheKey);
  if (restoredKey) {
    info(`Restored Cursor CLI from cache (key: ${restoredKey})`);
    addPath(installDir);
    return { binPath: installDir, cacheHit: true, resolvedVersion };
  }

  // Download & Extract
  const downloadUrl = buildDownloadUrl(resolvedVersion, platform, arch);
  info(`Downloading Cursor CLI from: ${downloadUrl}`);

  let extractedPath: string;
  try {
    const archivePath = await downloadTool(downloadUrl);
    extractedPath = await (platform === "win32"
      ? extractZip(archivePath)
      : extractTar(archivePath));
  } catch (error) {
    throw new Error(
      `Failed to download Cursor CLI v${resolvedVersion}. ` +
        `Check that the version exists and the platform is supported. Error: ${error}`,
      { cause: error }
    );
  }

  // Move binary to install dir
  await mkdirP(installDir);
  const binaryName = getBinaryName();

  const binarySource = await findBinary(extractedPath, binaryName);
  await mv(binarySource, path.join(installDir, binaryName));

  if (platform !== "win32") {
    const { execSync } = await import("node:child_process");
    execSync(`chmod +x "${path.join(installDir, binaryName)}"`);
  }

  // Cache the install dir for future jobs
  try {
    await saveCache(cachePaths, cacheKey);
    info(`Cached Cursor CLI with key: ${cacheKey}`);
  } catch (error) {
    // Non-fatal: caching failure should not break the workflow
    warning(`Failed to save Cursor CLI to cache: ${error}`);
  }

  // Also register in tool-cache for within-job reuse
  await cacheDir(installDir, "cursor-agent", resolvedVersion, arch);

  addPath(installDir);
  info(`Cursor CLI v${resolvedVersion} installed to ${installDir}`);

  return { binPath: installDir, cacheHit: false, resolvedVersion };
};
