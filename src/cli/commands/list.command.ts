import type { ProviderSettings } from "@/types/index.js";
import { getProviderSettingsPath, listProviders, readJsonFile } from "@/utils/fs.js";
import { logger } from "@/utils/logger.js";
import { normalizeStringOrArray } from "@/utils/string-array.js";
import { Command } from "commander";

export function createListCommand(): Command {
  return new Command("list")
    .description("List all configured providers")
    .option("-v, --verbose", "Show detailed information")
    .action(async (options) => {
      try {
        const providers = await listProviders();

        if (providers.length === 0) {
          logger.warning("No providers configured yet.");
          logger.info("Add a provider with: npx ccai add <provider-name>");
          return;
        }

        logger.section("Configured Providers");

        for (const provider of providers) {
          const settingsPath = getProviderSettingsPath(provider);
          const settings = await readJsonFile<ProviderSettings>(settingsPath);

          const name = settings.ccai?.name || provider;
          const status = settings.ccai?.disabled ? "❌ Disabled" : "✅ Enabled";

          console.log(`\n${logger.provider(name)} ${status}`);

          if (options.verbose && settings.ccai?.description) {
            console.log(`  ${normalizeStringOrArray(settings.ccai.description).split("\n")[0]}`);
          }

          if (options.verbose) {
            console.log(`  ${logger.path(settingsPath)}`);
          }
        }

        console.log();
      } catch (error) {
        logger.error(
          `Failed to list providers: ${error instanceof Error ? error.message : String(error)}`
        );
        process.exit(1);
      }
    });
}
