import * as readline from "node:readline";
import { logger } from "./logger.js";

/**
 * Start REPL mode for interactive prompt input
 * Returns the collected prompt text
 */
export async function startREPL(): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    const lines: string[] = [];
    let isFirstLine = true;

    logger.section("Interactive Mode");
    logger.info("Enter your prompt below.");
    logger.info("Tips:");
    logger.list([
      "Press Enter to add a new line",
      "Press Ctrl+D (or type '/submit' on a new line) to submit",
      "Press Ctrl+C to cancel",
    ]);
    console.log(); // Empty line for spacing

    rl.setPrompt("> ");
    rl.prompt();

    rl.on("line", (line: string) => {
      // Check for submit command
      if (line.trim() === "/submit") {
        rl.close();
        return;
      }

      // Add line to buffer
      lines.push(line);

      // Show continuation prompt
      if (isFirstLine) {
        isFirstLine = false;
      }
      rl.setPrompt("  ");
      rl.prompt();
    });

    rl.on("close", () => {
      const prompt = lines.join("\n").trim();

      if (!prompt) {
        logger.error("No prompt provided");
        process.exit(1);
      }

      console.log(); // Empty line for spacing
      logger.success("Prompt received");
      console.log(); // Empty line for spacing

      resolve(prompt);
    });

    // Handle Ctrl+C
    rl.on("SIGINT", () => {
      console.log(); // Empty line
      logger.warning("Cancelled by user");
      process.exit(0);
    });
  });
}
