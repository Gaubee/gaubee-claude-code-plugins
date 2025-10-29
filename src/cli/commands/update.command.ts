import {
  generateEvalCommand,
  generateProviderCommand,
  generateRoutingCommand,
  getExamplesList,
} from "@/core/installer.js";
import { formatProviderInfo, getAllProvidersInfo } from "@/core/merger.js";
import type { ProviderSettings } from "@/types/index.js";
import {
  fileExists,
  getProviderCommandPath,
  getProviderSettingsPath,
  listProviders,
  readJsonFile,
} from "@/utils/fs.js";
import { logger } from "@/utils/logger.js";
import { Command } from "commander";
import { unlink } from "node:fs/promises";

/**
 * Update command logic (exported for use by enable/disable)
 */
export async function updateCommand(): Promise<void> {
  const providers = await listProviders();

  if (providers.length === 0) {
    logger.warning("No providers configured yet.");
    return;
  }

  const examplesList = getExamplesList();
  let enabledCount = 0;
  let disabledCount = 0;

  // Process each provider
  for (const provider of providers) {
    const settingsPath = getProviderSettingsPath(provider);
    const commandPath = getProviderCommandPath(provider);

    const settings = await readJsonFile<ProviderSettings>(settingsPath);
    const isDisabled = settings.ccai?.disabled === true;

    if (isDisabled) {
      // Remove command file if exists
      if (await fileExists(commandPath)) {
        await unlink(commandPath);
        logger.info(`Removed command for disabled provider: ${logger.provider(provider)}`);
      }
      disabledCount++;
    } else {
      // Generate command file
      const providerInfo = formatProviderInfo(settings);
      await generateProviderCommand(provider, providerInfo, examplesList);
      logger.info(`Generated command: ${logger.code(`/ccai-${provider}`)}`);
      enabledCount++;
    }
  }

  // Generate routing command
  if (enabledCount > 0) {
    const providersInfo = await getAllProvidersInfo();
    await generateRoutingCommand(providersInfo, examplesList);
    logger.info(`Generated routing command: ${logger.code("/ccai")}`);
  }

  // Generate evaluation command
  await generateEvalCommand();
  logger.info(`Generated evaluation command: ${logger.code("/ccaieval")}`);

  logger.section("Update Summary");
  logger.success(`Enabled providers: ${enabledCount}`);
  if (disabledCount > 0) {
    logger.info(`Disabled providers: ${disabledCount}`);
  }
}

export function createUpdateCommand(): Command {
  return new Command("update")
    .description("Update command files based on provider configuration")
    .action(async () => {
      try {
        await updateCommand();

        logger.section("Update Complete");
        logger.warning("⚠️  Restart Claude Code to load the updated commands");
        logger.info("Use Cmd+Q (macOS) or Ctrl+Q (Linux/Windows) to exit and restart");
      } catch (error) {
        logger.error(`Update failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });
}
