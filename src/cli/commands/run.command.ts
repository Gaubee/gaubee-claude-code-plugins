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
    .option("--prompt <content>", "Explicit prompt content (overrides inputPrompt)")
    .option("--prompt-file <path>", "Read prompt from file (overrides inputPrompt)")
    .option("--input <content>", "Explicit input content (overrides inputPrompt)")
    .option("--input-file <path>", "Read input from file (overrides inputPrompt)")
    .option(
      "--print-command [format]",
      "Print the final claude command without executing it (text|json|bash|ps)"
    )
    .argument(
      "[inputPrompt...]",
      "Input prompt (used as both prompt and input by default, or enter REPL mode if omitted)"
    )
    .action(async (inputPromptArgs: string[], options) => {
      try {
        // Validate provider
        if (!options.provider) {
          logger.error("Provider is required");
          logger.info("Usage:  --provider <provider> [inputPrompt]");
          logger.info("Examples:");
          logger.list([
            " --provider glm 'analyze this code'",
            " --provider glm --prompt='context' --input='data'",
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

        // Helper function to read from file
        const readFromFile = async (path: string, name: string): Promise<string> => {
          try {
            const { readFile } = await import("node:fs/promises");
            const content = await readFile(path, "utf-8");
            logger.info(`Loaded ${name} from: ${logger.path(path)}`);
            return content;
          } catch (error) {
            logger.error(
              `Failed to read ${name} file: ${error instanceof Error ? error.message : String(error)}`
            );
            process.exit(1);
          }
        };

        // Determine prompt and input
        let prompt = "";
        let input = "";
        const defaultInputPrompt = inputPromptArgs.join(" ").trim();

        // Get prompt: explicit option > file > inputPrompt default
        if (options.prompt) {
          prompt = options.prompt;
        } else if (options.promptFile) {
          prompt = await readFromFile(options.promptFile, "prompt");
        } else {
          prompt = defaultInputPrompt;
        }

        // Get input: explicit option > file > inputPrompt default > prompt value
        if (options.input) {
          input = options.input;
        } else if (options.inputFile) {
          input = await readFromFile(options.inputFile, "input");
        } else if (defaultInputPrompt) {
          input = defaultInputPrompt;
        } else {
          // If no explicit input and no inputPrompt, use prompt value
          input = prompt;
        }

        // If no prompt/input provided, enter REPL mode (unless in print-command mode)
        if (!prompt && !input && !options.printCommand) {
          const replInput = await startREPL();
          prompt = replInput;
          input = replInput;
        }

        // Execute task
        await executeAI(options.provider, prompt, {
          input,
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
          `Failed to execute task: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`
        );
        process.exit(1);
      }
    });
}
