import { execSync } from "node:child_process";
import { watch } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "rolldown";

/**
 * Rolldown plugin to auto-generate templates
 * - Generates templates before build
 * - Watches templates directory in watch mode
 */
export function generateTemplatesPlugin(): Plugin {
  const templatesDir = join(process.cwd(), "templates");
  let isWatching = false;

  const generateTemplates = () => {
    console.log("🔄 Generating templates...");
    try {
      execSync("tsx scripts/generate-templates.ts", { stdio: "inherit" });
    } catch (error) {
      console.error("❌ Failed to generate templates:", error);
    }
  };

  return {
    name: "generate-templates",

    buildStart() {
      // Always generate templates at build start
      generateTemplates();

      // Set up watcher in watch mode (only once)
      if (this.meta.watchMode && !isWatching) {
        isWatching = true;
        console.log("👀 Watching templates directory for changes...");

        const watcher = watch(templatesDir, { recursive: true }, (eventType, filename) => {
          if (filename && filename.endsWith(".md")) {
            console.log(`📝 Template changed: ${filename}`);
            generateTemplates();
          }
        });

        // Clean up on process exit
        process.on("SIGINT", () => {
          watcher.close();
          process.exit(0);
        });
      }
    },
  };
}
