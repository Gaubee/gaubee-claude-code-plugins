import { mergeSystemPrompts } from "@/core/merger.js";
import { TaskTypeSchema } from "@/types/index.js";
import { logger } from "@/utils/logger.js";
import { Command } from "commander";

export function createMergePromptsCommand(): Command {
  return new Command("merge-prompts")
    .description("Merge system prompts (internal command)")
    .requiredOption("--provider <provider>", "Provider name")
    .option("--example <type>", "Task type example to include")
    .option("--plan-only", "Generate plan-only prompt")
    .action(async (options) => {
      try {
        // Validate task type if provided
        if (options.example) {
          const result = TaskTypeSchema.safeParse(options.example);
          if (!result.success) {
            logger.error(`Invalid task type: ${options.example}`);
            logger.info(`Valid types: ${TaskTypeSchema.options.join(", ")}`);
            process.exit(1);
          }
        }

        const customPrompts: string[] = [];

        if (options.planOnly) {
          customPrompts.push(`## Plan-Only Mode

You are in plan-only mode. Do NOT execute the task.

Instead, provide a detailed execution plan including:
1. Step-by-step approach
2. Tool calls needed
3. Estimated complexity
4. Estimated token consumption and cost
5. Potential risks
6. Expected output format`);
        }

        const prompt = await mergeSystemPrompts({
          provider: options.provider,
          taskType: options.example,
          customPrompts,
        });

        // Output prompt to stdout for shell command substitution
        console.log(prompt);
      } catch (error) {
        logger.error(
          `Failed to merge prompts: ${error instanceof Error ? error.message : String(error)}`
        );
        process.exit(1);
      }
    });
}
