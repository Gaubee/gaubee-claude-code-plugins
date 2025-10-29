import templates from "@/generated/templates.js";
import {
  ProviderSettings,
  ProviderSettingsSchema,
  type PromptMergeOptions,
} from "@/types/index.js";
import {
  fileExists,
  getClaudeDir,
  getProviderSettingsPath,
  readJsonFile,
  writeJsonFile,
} from "@/utils/fs.js";
import { logger } from "@/utils/logger";
import { isArray, mergeWith } from "lodash";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Merge settings for a provider using lodash mergeWith
 * Returns the path to the merged temporary settings file
 */
export async function mergeSettings(provider: string): Promise<string> {
  // Read default settings (if exists)
  let defaultSettings: Record<string, unknown> = {};
  const defaultSettingsPath = join(getClaudeDir(), "settings.json");

  if (await fileExists(defaultSettingsPath)) {
    defaultSettings = await readJsonFile(defaultSettingsPath);
  }

  // Read provider settings
  const providerSettingsPath = getProviderSettingsPath(provider);
  const providerSettings = await readJsonFile<ProviderSettings>(providerSettingsPath);

  // Validate provider settings
  ProviderSettingsSchema.parse(providerSettings);

  // Deep merge settings using lodash.mergeWith
  // Provider settings take precedence
  // Arrays are replaced (not concatenated)
  const merged = mergeWith({}, defaultSettings, providerSettings, (objValue, srcValue) => {
    // Replace arrays instead of merging them
    if (isArray(srcValue)) {
      return srcValue;
    }
    // Let lodash handle other cases
    return undefined;
  });

  // Write to temporary file
  const tempPath = join(tmpdir(), `ccai-settings-${provider}.json`);
  await writeJsonFile(tempPath, merged);

  return tempPath;
}

/**
 * Merge system prompts for a provider
 */
export async function mergeSystemPrompts(options: PromptMergeOptions): Promise<string> {
  const prompts: string[] = [];
  const claudeDir = getClaudeDir();

  // 1. Base system prompt (system-prompt.md)
  const basePromptPath = join(claudeDir, "skills", "ccai", "system-prompt.md");
  if (await fileExists(basePromptPath)) {
    const content = await readFile(basePromptPath, "utf-8");
    prompts.push(content);
  }

  // 2. Plan-only mode enhancement
  if (options.planOnly) {
    prompts.push(`## Plan-Only Mode

You are in plan-only mode. Do NOT execute the task.

Instead, provide a detailed execution plan including:
1. Step-by-step approach
2. Tool calls needed
3. Estimated complexity
4. Estimated token consumption and cost
5. Potential risks
6. Expected output format

This plan will be used to evaluate which provider is best suited for the task.`);
  }

  // 3. Task-specific enhancement
  if (options.taskType) {
    const examplePath = join(claudeDir, "skills", "ccai", "examples", `${options.taskType}.md`);
    if (await fileExists(examplePath)) {
      const content = await readFile(examplePath, "utf-8");
      prompts.push(content);
    } else {
      logger.warning(`No found taskType: ${options.taskType}`);
    }
  }

  // 4. Provider-specific prompt from settings
  const settingsPath = getProviderSettingsPath(options.provider);
  if (await fileExists(settingsPath)) {
    const settings = await readJsonFile<ProviderSettings>(settingsPath);
    if (settings.ccai?.systemPrompt) {
      // Replace provider placeholder
      const providerPrompt = settings.ccai.systemPrompt.replace(
        /\{\{PROVIDER\}\}/g,
        options.provider
      );
      prompts.push(providerPrompt);
    }
  }

  // 4. Custom prompts
  if (options.customPrompts && options.customPrompts.length > 0) {
    prompts.push(...options.customPrompts);
  }

  // 5. Log requirement prompt
  prompts.push(getLogRequirementPrompt(options.provider));

  // Join with separator
  return prompts.join("\n\n---\n\n");
}

/**
 * Get log requirement prompt with pre-calculated paths
 */
function getLogRequirementPrompt(provider: string): string {
  // Pre-calculate timestamp and full path
  const now = new Date();
  const timestamp =
    now.toISOString().replace(/T/, "_").replace(/\..+/, "").replace(/:/g, "-").split("_")[0] +
    "_" +
    now.toTimeString().split(" ")[0].replace(/:/g, "-");

  const logPath = `~/.claude/ccai/log/${provider}-${timestamp}.md`;

  // Load template and replace placeholders
  const template = templates["prompts/log-requirement.md"];
  return template
    .replace(/\{\{LOG_PATH\}\}/g, logPath)
    .replace(/\{\{PROVIDER\}\}/g, provider.toUpperCase())
    .replace(/\{\{TIMESTAMP\}\}/g, timestamp);
}

/**
 * Format provider info for command template
 */
export function formatProviderInfo(settings: ProviderSettings): string {
  const parts: string[] = [];

  if (settings.ccai?.name) {
    parts.push(`## Provider: ${settings.ccai.name}`);
  }

  if (settings.ccai?.description) {
    parts.push(`\n${settings.ccai.description}`);
  }

  if (settings.ccai?.disabled) {
    parts.push(`\n⚠️ **This provider is currently disabled.**`);
  }

  return parts.join("\n");
}

/**
 * Get all providers info for routing command
 */
export async function getAllProvidersInfo(): Promise<string> {
  const { listProviders } = await import("@/utils/fs.js");
  const providers = await listProviders();
  const infos: string[] = [];

  for (const provider of providers) {
    const settingsPath = getProviderSettingsPath(provider);
    if (await fileExists(settingsPath)) {
      const settings = await readJsonFile<ProviderSettings>(settingsPath);

      if (settings.ccai) {
        const name = settings.ccai.name || provider;
        const status = settings.ccai.disabled ? "❌ Disabled" : "✅ Enabled";

        infos.push(`### ${name}`);
        infos.push(`- **Status**: ${status}`);

        if (settings.ccai.description) {
          infos.push(`- **Description**: ${settings.ccai.description}`);
        }

        infos.push(""); // Empty line
      }
    }
  }

  return infos.join("\n");
}
