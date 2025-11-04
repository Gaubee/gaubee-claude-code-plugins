import type { CustomCommand } from "@/types/index.js";
import { logger } from "@/utils/logger.js";
import { resolveVariantArgs } from "./variant-matcher.js";
import { spawn } from "node:child_process";

/**
 * Placeholder values for command argument replacement
 */
export interface CommandPlaceholders {
  SETTINGS_PATH: string;
  SYSTEM_PROMPT: string;
  PROMPT: string;
  INPUT: string;
  TASK: string; // Deprecated: use PROMPT instead
  [key: string]: string;
}

/**
 * Replace placeholders in command arguments
 *
 * Supported placeholders:
 * - {{SETTINGS_PATH}}: Path to merged settings file
 * - {{SYSTEM_PROMPT}}: Merged system prompt content
 * - {{PROMPT}}: Full prompt with context
 * - {{INPUT}}: Input data that conforms to inputSchema
 * - {{TASK}}: (Deprecated) Alias for PROMPT, kept for backward compatibility
 * - {{ENV.*}}: Environment variables (e.g., {{ENV.API_KEY}})
 *
 * Note: This function expects args to already be resolved from variant matches
 */
export function replaceCommandPlaceholders(
  args: string[],
  placeholders: CommandPlaceholders
): string[] {
  return args.map((arg) => {
    let replaced = arg;

    // Replace standard placeholders
    for (const [key, value] of Object.entries(placeholders)) {
      replaced = replaced.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    }

    // Replace environment variable placeholders
    replaced = replaced.replace(/\{\{ENV\.([A-Z_]+)\}\}/g, (_, envVar) => {
      return process.env[envVar] || "";
    });

    return replaced;
  });
}

/**
 * Prepare command arguments by resolving variants and replacing placeholders
 *
 * Two-step process:
 * 1. Resolve variant matches: Array<string | VariantMatch> -> Array<string>
 * 2. Replace placeholders in strings
 */
export function prepareCommandArgs(
  command: CustomCommand,
  placeholders: CommandPlaceholders,
  variantPlaceholders: Record<string, string>
): string[] {
  const args = command.args || [];

  // Step 1: Resolve variant matches
  const resolvedArgs = resolveVariantArgs(args, variantPlaceholders);

  // Step 2: Replace placeholders
  return replaceCommandPlaceholders(resolvedArgs, placeholders);
}

/**
 * Execute custom command with arguments
 */
export async function executeCustomCommand(
  command: CustomCommand,
  placeholders: CommandPlaceholders,
  options: {
    captureOutput?: boolean;
    stdio?: "inherit" | "pipe";
    variantPlaceholders?: Record<string, string>;
  } = {}
): Promise<string> {
  const { executable, args = [] } = command;
  const { captureOutput = false, stdio = "inherit", variantPlaceholders = {} } = options;

  // Prepare arguments: resolve variants and replace placeholders
  const finalArgs = variantPlaceholders && Object.keys(variantPlaceholders).length > 0
    ? prepareCommandArgs(command, placeholders, variantPlaceholders)
    : replaceCommandPlaceholders(resolveVariantArgs(args, {}), placeholders);

  logger.info(`Executing custom command: ${logger.command(executable)}`);

  return new Promise((resolve, reject) => {
    const child = spawn(executable, finalArgs, {
      stdio: captureOutput ? ["ignore", "pipe", "pipe"] : stdio,
      shell: false,
      env: {
        ...process.env,
      },
    });

    let stdout = "";
    let stderr = "";

    if (captureOutput) {
      child.stdout?.on("data", (data) => {
        stdout += data.toString();
        if (!options.stdio || options.stdio === "inherit") {
          process.stdout.write(data);
        }
      });

      child.stderr?.on("data", (data) => {
        stderr += data.toString();
        if (!options.stdio || options.stdio === "inherit") {
          process.stderr.write(data);
        }
      });
    }

    child.on("exit", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(
          new Error(
            `Command '${executable}' exited with code ${code}${stderr ? `\nStderr: ${stderr}` : ""}`
          )
        );
      }
    });

    child.on("error", (err) => {
      reject(new Error(`Failed to execute command '${executable}': ${err.message}`));
    });
  });
}

/**
 * Validate command configuration
 */
export function validateCommand(command: CustomCommand): void {
  if (!command.executable) {
    throw new Error("Command executable is required");
  }

  if (command.args && !Array.isArray(command.args)) {
    throw new Error("Command args must be an array");
  }

  // Check for required placeholders
  const allArgs = [command.executable, ...(command.args || [])].join(" ");
  const hasTaskPlaceholder = allArgs.includes("{{TASK}}");

  if (!hasTaskPlaceholder) {
    logger.warning(
      "Command does not include {{TASK}} placeholder. The user's task will not be passed to the command."
    );
  }
}
