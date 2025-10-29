import { generateEvalCommand, installAllTemplates } from "@/core/installer.js";
import { OperationContext } from "@/types/operations.js";
import { logger } from "@/utils/logger.js";
import { Command } from "commander";

export function createInitCommand(): Command {
  return new Command("init")
    .description("Initialize CCAI templates in ~/.claude")
    .option("-f, --force", "Overwrite existing files")
    .option("--dry-run", "Preview changes without writing files")
    .action(async (options) => {
      try {
        const context = new OperationContext(options.dryRun);

        await installAllTemplates(options.force, context);
        await generateEvalCommand(context);

        if (options.dryRun) {
          logger.section("Dry Run - Preview of Changes");
          const summary = context.getSummary();
          logger.info(`Total operations: ${summary.total}`);
          logger.info(`- Directories to create: ${summary.byType.mkdir}`);
          logger.info(`- Files to write: ${summary.byType.write}`);
          logger.info(`- Files to delete: ${summary.byType.delete}`);

          console.log("\nDetailed operations:");
          for (const op of context.getOperations()) {
            console.log(`  ${op.type.toUpperCase()}: ${logger.path(op.path)}`);
          }

          logger.warning("\nNo files were modified (dry-run mode)");
        } else {
          logger.section("Initialization Complete");
          logger.success("CCAI templates installed successfully!");
        }
      } catch (error) {
        logger.error(
          `Initialization failed: ${error instanceof Error ? error.message : String(error)}`
        );
        process.exit(1);
      }
    });
}
