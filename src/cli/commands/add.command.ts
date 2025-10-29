import templates from "@/generated/templates.js";
import type { ProviderSettings } from "@/types/index.js";
import type { OperationContext } from "@/types/operations.js";
import { fileExists, getProviderSettingsPath, writeJsonFile } from "@/utils/fs.js";
import { logger } from "@/utils/logger.js";
import { Command } from "commander";

/**
 * Add a new provider (exported for testing)
 */
export async function addProvider(
  provider: string,
  options: { force?: boolean },
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
  const settingsTemplate: ProviderSettings = JSON.parse(
    templateContent
      .replace(/\{\{provider\}\}/g, provider)
      .replace(/\{\{PROVIDER\}\}/g, provider.toUpperCase())
  );

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
