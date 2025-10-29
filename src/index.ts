import { runCLI } from "./cli/index.js";

runCLI().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
