import type { ExecuteOptions } from "@/types/index.js";
import { logger } from "@/utils/logger.js";
import { spawn } from "node:child_process";
import { unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mergeSettings, mergeSystemPrompts } from "./merger.js";

/**
 * Get default print command format based on OS
 */
function getDefaultPrintFormat(): "bash" | "ps" {
  return process.platform === "win32" ? "ps" : "bash";
}

/**
 * Print the claude command that would be executed
 */
async function printClaudeCommand(
  args: string[],
  format: "text" | "json" | "bash" | "ps" | boolean = true,
  systemPrompt?: string
): Promise<void> {
  // Normalize format parameter - use OS-based default for boolean
  const outputFormat = typeof format === "boolean" ? getDefaultPrintFormat() : format;

  // Replace placeholder with appropriate content based on format
  const newArgs = await Promise.all(
    args.map(async (arg) => {
      if (arg === "{{CCAI_SYSTEM_PROMPT}}") {
        if (outputFormat === "json") {
          return systemPrompt || "";
        } else if (outputFormat === "bash" || outputFormat === "ps") {
          // For bash/ps, write system prompt to a temp file and use substitution
          const { writeFile } = await import("node:fs/promises");
          const { tmpdir } = await import("node:os");
          const { join } = await import("node:path");

          const tempFile = join(tmpdir(), `ccai-prompt-${Date.now()}.md`);
          await writeFile(tempFile, systemPrompt || "", "utf-8");

          if (outputFormat === "bash") {
            return `$(< "${tempFile}")`;
          } else if (outputFormat === "ps") {
            return `$(Get-Content "${tempFile}" -Raw)`;
          }
        } else {
          // Text format - properly escaped for shell scripts
          if (!systemPrompt) return "''";
          return `'${systemPrompt.replace(/'/g, "'\\''")}'`;
        }
      }
      return arg;
    })
  );

  if (outputFormat === "json") {
    // Output as JSON array for easier testing and parsing
    console.log(JSON.stringify(["claude", ...newArgs]));
  } else {
    // For bash/ps/text, escape arguments properly
    const escapeForShell = (arg: string): string => {
      // If it's the system prompt substitution, don't escape it
      if (arg.startsWith("$(")) return arg;

      // Handle normal arguments
      if (arg.includes(" ") || arg.includes("\n") || arg.includes('"') || arg.includes("'")) {
        return `'${arg.replace(/'/g, "'\\''")}'`;
      }
      return arg;
    };

    const commandParts = ["claude", ...newArgs.map(escapeForShell)];
    console.log(commandParts.join(" "));
  }
}

/**
 * Execute AI provider with a task
 */
export async function executeAI(
  provider: string,
  task: string,
  options: ExecuteOptions = {}
): Promise<void> {
  // Disable logger output in print-command mode
  const isPrintMode = !!options.printCommand;

  if (!isPrintMode) {
    logger.info(`Executing task with provider: ${logger.provider(provider)}`);
  }

  // 1. Merge settings
  const settingsPath = await mergeSettings(provider);
  if (!isPrintMode) {
    logger.info(`Settings merged: ${logger.path(settingsPath)}`);
  }

  // 2. Merge system prompts
  const systemPrompt = await mergeSystemPrompts({
    provider,
    taskType: options.taskType,
  });

  // 3. Handle large prompts by writing to file
  const useFile = systemPrompt.length > 32 * 1024;
  let promptPath: string | undefined;

  if (useFile) {
    promptPath = join(tmpdir(), `ccai-prompt-${provider}-${Date.now()}.md`);
    await writeFile(promptPath, systemPrompt, "utf-8");
    if (!isPrintMode) {
      logger.info(`System prompt saved to temp file (${systemPrompt.length} bytes)`);
    }
  }

  // 4. Prepare execution arguments
  const args = ["--dangerously-skip-permissions", "--settings", settingsPath];

  // Add output format based on log option
  // Note: stream-json requires --verbose when using --print
  if (options.log) {
    args.push("--output-format", "stream-json");
    args.push("--verbose"); // Required for stream-json with --print
    if (!isPrintMode) {
      logger.info("Using stream-json output format with verbose mode");
    }
  } else {
    args.push("--output-format", "json");
  }

  // Add session ID if provided (for continuing context)
  if (options.sessionId) {
    args.push("--resume", options.sessionId);
    if (!isPrintMode) {
      logger.info(`Continuing session: ${options.sessionId}`);
    }
  }

  // Add system prompt - use placeholder for late injection
  if (useFile && promptPath) {
    // Note: Assuming claude CLI supports --system-prompt-file
    // If not available, we'll use --system-prompt with the content
    args.push("--system-prompt", "{{CCAI_SYSTEM_PROMPT}}");
  } else {
    args.push("--system-prompt", "{{CCAI_SYSTEM_PROMPT}}");
  }

  // Add task (only if task is not empty)
  if (task) {
    args.push("-p", task);
  }

  // 5. If print-command mode, print and return
  if (options.printCommand) {
    await printClaudeCommand(args, options.printCommand, systemPrompt);
    return;
  }

  // 6. Replace placeholder with actual system prompt for execution
  const finalArgs = args.map(arg =>
    arg === "{{CCAI_SYSTEM_PROMPT}}" ? systemPrompt : arg
  );

  // 7. Execute Claude
  logger.info("Starting Claude execution...");
  try {
    // Determine output handling mode
    if (options.format !== undefined) {
      // Mode 1: Template formatting - format each JSON object with template
      const { formatMessageWithTemplate } = await import("@/utils/template-formatter.js");

      await new Promise<void>((resolve, reject) => {
        const child = spawn("claude", finalArgs, {
          stdio: ["ignore", "pipe", "pipe"],
          shell: false,
        });

        let buffer = "";
        let stderr = "";

        child.stdout.on("data", (data) => {
          buffer += data.toString();
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const json = JSON.parse(line);
              const template = typeof options.format === "string" ? options.format : undefined;
              formatMessageWithTemplate(json, template);
            } catch {
              // If not valid JSON, output as-is
              console.log(line);
            }
          }
        });

        child.stderr.on("data", (data) => {
          stderr += data.toString();
          process.stderr.write(data);
        });

        child.on("exit", (code) => {
          if (buffer.trim()) {
            try {
              const json = JSON.parse(buffer);
              const template = typeof options.format === "string" ? options.format : undefined;
              formatMessageWithTemplate(json, template);
            } catch {
              console.log(buffer);
            }
          }

          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Claude exited with code ${code}`));
          }
        });

        child.on("error", (err) => {
          reject(new Error(`Failed to execute claude: ${err.message}`));
        });
      });
    } else if (options.prettyJson) {
      // Mode 2: Pretty JSON - beautify JSON output but keep JSON structure
      const { prettyPrintJson } = await import("@/utils/json-formatter.js");

      await new Promise<void>((resolve, reject) => {
        const child = spawn("claude", finalArgs, {
          stdio: ["ignore", "pipe", "pipe"],
          shell: false,
        });

        let buffer = "";
        let stderr = "";

        child.stdout.on("data", (data) => {
          buffer += data.toString();
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const json = JSON.parse(line);
              prettyPrintJson(json);
            } catch {
              // If not valid JSON, output as-is
              console.log(line);
            }
          }
        });

        child.stderr.on("data", (data) => {
          stderr += data.toString();
          process.stderr.write(data);
        });

        child.on("exit", (code) => {
          if (buffer.trim()) {
            try {
              const json = JSON.parse(buffer);
              prettyPrintJson(json);
            } catch {
              console.log(buffer);
            }
          }

          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Claude exited with code ${code}`));
          }
        });

        child.on("error", (err) => {
          reject(new Error(`Failed to execute claude: ${err.message}`));
        });
      });
    } else {
      // Standard execution with inherited stdio
      await new Promise<void>((resolve, reject) => {
        const child = spawn("claude", finalArgs, {
          stdio: "inherit",
          shell: false,
        });

        child.on("exit", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Claude exited with code ${code}`));
          }
        });

        child.on("error", (err) => {
          reject(new Error(`Failed to execute claude: ${err.message}`));
        });
      });

      logger.success("Task completed successfully");
    }
  } catch (error) {
    logger.error(`Execution failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  } finally {
    // Clean up temporary files
    if (promptPath) {
      try {
        await unlink(promptPath);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

/**
 * Execute multiple providers in parallel for plan comparison
 */
export async function executeProvidersForPlans(
  providers: string[],
  task: string
): Promise<Map<string, string>> {
  logger.info(`Getting execution plans from ${providers.length} providers...`);

  const results = new Map<string, string>();

  // Execute all providers in parallel
  const promises = providers.map(async (provider) => {
    try {
      // Create a modified task asking for plan only
      const planTask = `Analyze this task and provide a detailed execution plan with cost estimation. Do NOT execute the task yet.

Task: ${task}

Please provide:
1. Step-by-step execution plan
2. Estimated tool calls and complexity
3. Estimated token consumption
4. Estimated cost
5. Potential risks or challenges
6. Expected output format`;

      // Capture output instead of inherit
      const settingsPath = await mergeSettings(provider);
      const systemPrompt = await mergeSystemPrompts({ provider });

      const args = [
        "--dangerously-skip-permissions",
        "--settings",
        settingsPath,
        "--output-format",
        "json",
        "--system-prompt",
        systemPrompt,
        "-p",
        planTask,
      ];

      const child = spawn("claude", args, {
        stdio: ["ignore", "pipe", "pipe"],
        shell: false,
      });

      let output = "";
      let errorOutput = "";

      child.stdout.on("data", (data) => {
        output += data.toString();
      });

      child.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      await new Promise<void>((resolve, reject) => {
        child.on("exit", (code) => {
          if (code === 0) {
            results.set(provider, output);
            resolve();
          } else {
            reject(new Error(`Provider ${provider} failed: ${errorOutput}`));
          }
        });

        child.on("error", reject);
      });

      logger.success(`Got plan from ${logger.provider(provider)}`);
    } catch (error) {
      logger.error(
        `Failed to get plan from ${provider}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });

  await Promise.allSettled(promises);

  return results;
}
