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
    .option(
      "--log",
      "Enable detailed logging with stream-json output format (auto-enables verbose)"
    )
    .option("--pretty-json", "Format JSON output in a human-readable way")
    .option("--format [template]", "Format output using template (default shows key info)")
    .option("--prompt-file <path>", "Read prompt from file instead of arguments")
    .option("--print-command [format]", "Print the final claude command without executing it (text|json|bash|ps)")
    .argument(
      "[prompt...]",
      "Task prompt (can be multiple arguments, or enter REPL mode if omitted)"
    )
    .action(async (promptArgs: string[], options) => {
      try {
        // Validate provider
        if (!options.provider) {
          logger.error("Provider is required");
          logger.info("Usage:  --provider <provider> [prompt]");
          logger.info("Examples:");
          logger.list([
            " --provider glm 'analyze this code'",
            " --provider glm  # Enter REPL mode",
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

        // Get prompt from file, arguments, or REPL
        let prompt = "";

        if (options.promptFile) {
          // Read from file
          try {
            const { readFile } = await import("node:fs/promises");
            prompt = await readFile(options.promptFile, "utf-8");
            logger.info(`Loaded prompt from: ${logger.path(options.promptFile)}`);
          } catch (error) {
            logger.error(
              `Failed to read prompt file: ${error instanceof Error ? error.message : String(error)}`
            );
            process.exit(1);
          }
        } else {
          // Combine prompt arguments
          prompt = promptArgs.join(" ").trim();

          // If no prompt provided, enter REPL mode (unless in print-command mode)
          if (!prompt && !options.printCommand) {
            prompt = await startREPL();
          }
        }

        // Execute task
        await executeAI(options.provider, prompt, {
          taskType: options.example,
          sessionId: options.sessionId,
          planOnly: options.planOnly,
          log: options.log,
          prettyJson: options.prettyJson,
          format: options.format,
          printCommand: options.printCommand,
        });
      } catch (error) {
        logger.error(
          `Failed to execute task: ${error instanceof Error ? error.message : String(error)}`
        );
        process.exit(1);
      }
    });
}
