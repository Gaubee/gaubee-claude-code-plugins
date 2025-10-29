import type { ProviderSettings } from "@/types/index.js";
import type { OperationContext } from "@/types/operations.js";
import { getProviderSettingsPath, readJsonFile, writeJsonFile } from "@/utils/fs.js";
import { logger } from "@/utils/logger.js";
import { Command } from "commander";

/**
 * Disable a provider (exported for testing)
 */
export async function disableProvider(
  provider: string,
  options: { skipUpdate?: boolean },
  context?: OperationContext
): Promise<void> {
  const settingsPath = getProviderSettingsPath(provider);
  const settings = await readJsonFile<ProviderSettings>(settingsPath);

  // Update disabled flag
  settings.ccai.disabled = true;
  await writeJsonFile(settingsPath, settings, context);

  if (!context?.isDryRun()) {
    logger.success(`Provider ${logger.provider(provider)} disabled`);

    // Trigger update unless skipped
    if (!options.skipUpdate) {
      logger.info("Updating command files...");
      const { updateCommand } = await import("./update.command.js");
      await updateCommand();
    }

    logger.section("Provider Disabled");
    logger.info(`Command removed: ${logger.code(`/ccai-${provider}`)}`);
    logger.info("Restart Claude Code to load the updated commands");
  }
}

export function createDisableCommand(): Command {
  return new Command("disable")
    .description("Disable a provider")
    .argument("<provider>", "Provider name")
    .action(async (provider: string) => {
      try {
        await disableProvider(provider, { skipUpdate: false });
      } catch (error) {
        logger.error(
          `Failed to disable provider: ${error instanceof Error ? error.message : String(error)}`
        );
        process.exit(1);
      }
    });
}
