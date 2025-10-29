import { OperationContext } from "@/types/operations.js";
import { access, mkdir, readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

/**
 * Get Claude directory path
 */
export function getClaudeDir(): string {
  return join(homedir(), ".claude");
}

/**
 * Get CCAI directory path
 */
export function getCcaiDir(): string {
  return join(getClaudeDir(), "ccai");
}

/**
 * Get provider settings path
 */
export function getProviderSettingsPath(provider: string): string {
  return join(getCcaiDir(), `settings-${provider}.json`);
}

/**
 * Get provider command path
 */
export function getProviderCommandPath(provider: string): string {
  return join(getClaudeDir(), "commands", `ccai-${provider}.md`);
}

/**
 * Ensure directory exists
 */
export async function ensureDir(dirPath: string, context?: OperationContext): Promise<void> {
  if (context?.isDryRun()) {
    context.record({
      type: "mkdir",
      path: dirPath,
      description: `Create directory: ${dirPath}`,
    });
    return;
  }

  try {
    await mkdir(dirPath, { recursive: true });
  } catch {
    // Ignore if directory already exists
  }
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read JSON file with type validation
 */
export async function readJsonFile<T>(filePath: string): Promise<T> {
  const content = await readFile(filePath, "utf-8");
  return JSON.parse(content) as T;
}

/**
 * Write JSON file
 */
export async function writeJsonFile<T>(
  filePath: string,
  data: T,
  context?: OperationContext
): Promise<void> {
  if (context?.isDryRun()) {
    context.record({
      type: "write",
      path: filePath,
      content: JSON.stringify(data, null, 2),
      description: `Write JSON file: ${filePath}`,
    });
    return;
  }

  await ensureDir(dirname(filePath), context);
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Write text file
 */
export async function writeTextFile(
  filePath: string,
  content: string,
  context?: OperationContext
): Promise<void> {
  if (context?.isDryRun()) {
    context.record({
      type: "write",
      path: filePath,
      content,
      description: `Write text file: ${filePath}`,
    });
    return;
  }

  await ensureDir(dirname(filePath), context);
  await writeFile(filePath, content, "utf-8");
}

/**
 * Delete file
 */
export async function deleteFile(filePath: string, context?: OperationContext): Promise<void> {
  if (context?.isDryRun()) {
    context.record({
      type: "delete",
      path: filePath,
      description: `Delete file: ${filePath}`,
    });
    return;
  }

  try {
    await unlink(filePath);
  } catch {
    // Ignore if file doesn't exist
  }
}

/**
 * List providers from settings files
 */
export async function listProviders(): Promise<string[]> {
  const ccaiDir = getCcaiDir();

  try {
    const files = await readdir(ccaiDir);
    const providers: string[] = [];

    for (const file of files) {
      if (file.startsWith("settings-") && file.endsWith(".json")) {
        const provider = file.slice("settings-".length, -".json".length);
        providers.push(provider);
      }
    }

    return providers;
  } catch {
    return [];
  }
}

/**
 * Check if directory exists
 */
export async function dirExists(dirPath: string): Promise<boolean> {
  try {
    const stats = await stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}
