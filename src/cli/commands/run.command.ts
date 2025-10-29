import { executeAI } from "@/core/executor.js";
import { TaskTypeSchema } from "@/types/index.js";
import { logger } from "@/utils/logger.js";
import { startREPL } from "@/utils/repl.js";
import { Command } from "commander";

export function createRunCommand(): Command {
  return new Command("run")
    .description("Execute a task with an AI provider")
    .option("--provider <provider>", "Provider name (e.g., glm, minimax)")
    .option("--example <type>", "Task type example to enhance prompt")
    .option("--session-id <uuid>", "Continue from a previous session")
    .option("--plan-only", "Generate execution plan only (for intelligent routing)")
    .option("--log", "Enable detailed logging with stream-json output format (auto-enables verbose)")
    .option("--pretty-json", "Format JSON output in a human-readable way")
    .argument("[prompt...]", "Task prompt (can be multiple arguments, or enter REPL mode if omitted)")
    .action(async (promptArgs: string[], options) => {
      try {
        // Validate provider
        if (!options.provider) {
          logger.error("Provider is required");
          logger.info("Usage: npx ccai run --provider <provider> [prompt]");
          logger.info("Examples:");
          logger.list([
            "npx ccai run --provider glm 'analyze this code'",
            "npx ccai run --provider glm  # Enter REPL mode",
          ]);
          process.exit(1);
        }

        // Validate task type if provided
        if (options.example) {
          const result = TaskTypeSchema.safeParse(options.example);
          if (!result.success) {
            logger.error(`Invalid task type: ${options.example}`);
            logger.info(`Valid types: ${TaskTypeSchema.options.join(", ")}`);
            process.exit(1);
          }
        }

        // Combine prompt arguments
        let prompt = promptArgs.join(" ").trim();

        // If no prompt provided, enter REPL mode
        if (!prompt) {
          prompt = await startREPL();
        }

        // Execute task
        await executeAI(options.provider, prompt, {
          taskType: options.example,
          sessionId: options.sessionId,
          planOnly: options.planOnly,
          log: options.log,
          prettyJson: options.prettyJson,
        });
      } catch (error) {
        logger.error(
          `Failed to execute task: ${error instanceof Error ? error.message : String(error)}`
        );
        process.exit(1);
      }
    });
}
