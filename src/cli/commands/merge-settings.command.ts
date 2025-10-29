import { mergeSettings } from "@/core/merger.js";
import { logger } from "@/utils/logger.js";
import { Command } from "commander";

export function createMergeSettingsCommand(): Command {
  return new Command("merge-settings")
    .description("Merge provider settings (internal command)")
    .argument("<provider>", "Provider name")
    .action(async (provider: string) => {
      try {
        const tempPath = await mergeSettings(provider);
        // Output only the path to stdout for shell command substitution
        console.log(tempPath);
      } catch (error) {
        logger.error(
          `Failed to merge settings: ${error instanceof Error ? error.message : String(error)}`
        );
        process.exit(1);
      }
    });
}
