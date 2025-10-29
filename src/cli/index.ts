import { Command } from "commander";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createAddCommand } from "./commands/add.command.js";
import { createDisableCommand } from "./commands/disable.command.js";
import { createEnableCommand } from "./commands/enable.command.js";
import { createGetCommand } from "./commands/get.command.js";
import { createInitCommand } from "./commands/init.command.js";
import { createListCommand } from "./commands/list.command.js";
import { createMergePromptsCommand } from "./commands/merge-prompts.command.js";
import { createMergeSettingsCommand } from "./commands/merge-settings.command.js";
import { createRunCommand } from "./commands/run.command.js";
import { createUpdateCommand } from "./commands/update.command.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function getVersion(): Promise<string> {
  try {
    const packagePath = join(__dirname, "../../package.json");
    const packageJson = JSON.parse(await readFile(packagePath, "utf-8"));
    return packageJson.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export async function createCLI(): Promise<Command> {
  const version = await getVersion();

  const program = new Command();

  program
    .name("ccai")
    .description("Claude Code AI Assistant - Intelligent AI provider management and routing")
    .version(version);

  // User commands
  program.addCommand(createInitCommand());
  program.addCommand(createAddCommand());
  program.addCommand(createListCommand());
  program.addCommand(createGetCommand());
  program.addCommand(createEnableCommand());
  program.addCommand(createDisableCommand());
  program.addCommand(createUpdateCommand());
  program.addCommand(createRunCommand());

  // Internal commands (used by command files)
  program.addCommand(createMergeSettingsCommand());
  program.addCommand(createMergePromptsCommand());

  return program;
}

export async function runCLI(): Promise<void> {
  const program = await createCLI();
  await program.parseAsync(process.argv);
}
