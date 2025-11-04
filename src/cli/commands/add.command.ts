import templates from "@/generated/templates.js";
import type { ProviderSettings } from "@/types/index.js";
import type { OperationContext } from "@/types/operations.js";
import {
  type CommandTemplate,
  getCommandTemplate,
  getCommandTemplateDescription,
  getCommandTemplateSystemPrompt,
} from "@/templates/command-templates.js";
import { fileExists, getProviderSettingsPath, writeJsonFile } from "@/utils/fs.js";
import { logger } from "@/utils/logger.js";
import { Command } from "commander";

/**
 * Remove comment fields (fields starting with "//") from ccai config
 *
 * This allows users to use "//" prefix to mark optional fields in templates.
 * When actual values are provided, the comment fields should be removed.
 */
function removeCommentFields(
  ccaiConfig: Record<string, unknown>,
  fieldsToRemove: string[]
): Record<string, unknown> {
  const result = { ...ccaiConfig };

  for (const field of fieldsToRemove) {
    const commentField = `//${field}`;
    if (commentField in result) {
      delete result[commentField];
    }
  }

  return result;
}

/**
 * Add a new provider (exported for testing)
 */
export async function addProvider(
  provider: string,
  options: { force?: boolean; command?: CommandTemplate },
  context?: OperationContext
): Promise<void> {
  const settingsPath = getProviderSettingsPath(provider);

  // Check if provider already exists
  if (!options.force && (await fileExists(settingsPath))) {
    logger.error(`Provider ${logger.provider(provider)} already exists.`);
    logger.info('Use --force to overwrite, or use "npx ccai get" to view configuration.');
    throw new Error(`Provider ${provider} already exists`);
  }

  // Create provider settings from template
  const templateContent = templates["ccai/settings-provider.json.template"];
  let settingsTemplate: ProviderSettings = JSON.parse(
    templateContent
      .replace(/\{\{provider\}\}/g, provider)
      .replace(/\{\{PROVIDER\}\}/g, provider.toUpperCase())
  );

  // Apply command template if specified
  if (options.command) {
    const commandTemplate = getCommandTemplate(options.command);
    const description = getCommandTemplateDescription(options.command);
    const systemPrompt = getCommandTemplateSystemPrompt(options.command, provider);

    // Remove comment fields that are being replaced with actual values
    const cleanedCcaiConfig = removeCommentFields(settingsTemplate.ccai as Record<string, unknown>, [
      "description",
      "systemPrompt",
      "command",
      "command-notes", // Also remove command-notes since we're using a real command
    ]);

    settingsTemplate = {
      ...settingsTemplate,
      ccai: {
        ...(cleanedCcaiConfig as typeof settingsTemplate.ccai),
        description,
        systemPrompt,
        command: commandTemplate,
      },
    };

    if (!context?.isDryRun()) {
      logger.info(`Using ${logger.command(options.command)} command template`);
    }
  }

  await writeJsonFile(settingsPath, settingsTemplate, context);

  if (!context?.isDryRun()) {
    logger.success(`Provider ${logger.provider(provider)} added successfully!`);
    logger.section("Next Steps");
    logger.list([
      `Edit configuration: npx ccai get ${provider}`,
      `Or edit file directly: ${logger.path(settingsPath)}`,
      `Enable provider: npx ccai enable ${provider}`,
    ]);
  }
}

export function createAddCommand(): Command {
  return new Command("add")
    .description("Add a new provider")
    .argument("<provider>", "Provider name (e.g., glm, minimax)")
    .option("-f, --force", "Overwrite if provider already exists")
    .option(
      "-c, --command <template>",
      "Command template to use (claude, gemini, codex)",
      (value) => {
        if (!["claude", "gemini", "codex"].includes(value)) {
          throw new Error(`Invalid command template: ${value}. Must be one of: claude, gemini, codex`);
        }
        return value as CommandTemplate;
      }
    )
    .action(async (provider: string, options) => {
      try {
        await addProvider(provider, options);
      } catch (error) {
        logger.error(
          `Failed to add provider: ${error instanceof Error ? error.message : String(error)}`
        );
        process.exit(1);
      }
    });
}
