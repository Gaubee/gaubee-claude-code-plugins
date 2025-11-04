import type { ProviderSettings } from "@/types/index.js";
import { getProviderSettingsPath, readJsonFile } from "@/utils/fs.js";
import { logger } from "@/utils/logger.js";
import { normalizeStringOrArray } from "@/utils/string-array.js";
import { Command } from "commander";

export function createGetCommand(): Command {
  return new Command("get")
    .description("View provider configuration")
    .argument("<provider>", "Provider name")
    .action(async (provider: string) => {
      try {
        const settingsPath = getProviderSettingsPath(provider);
        const settings = await readJsonFile<ProviderSettings>(settingsPath);

        logger.section(`Provider: ${logger.provider(settings.ccai?.name || provider)}`);

        console.log(`\n📍 Configuration File:`);
        console.log(`   ${logger.path(settingsPath)}`);

        console.log(`\n📊 Status:`);
        console.log(`   ${settings.ccai?.disabled ? "❌ Disabled" : "✅ Enabled"}`);

        if (settings.ccai?.description) {
          console.log(`\n📝 Description:`);
          console.log(`   ${normalizeStringOrArray(settings.ccai.description).split("\n").join("\n   ")}`);
        }

        console.log(`\n🔧 Configuration:`);
        console.log(JSON.stringify(settings, null, 2));

        console.log(`\n💡 Edit configuration:`);
        logger.command(`open ${settingsPath}`);
        console.log();
      } catch (error) {
        logger.error(
          `Failed to get provider configuration: ${error instanceof Error ? error.message : String(error)}`
        );
        logger.info('Make sure the provider exists. Use "npx ccai list" to see all providers.');
        process.exit(1);
      }
    });
}
