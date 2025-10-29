import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "rolldown";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  input: "src/index.ts",
  output: {
    dir: "dist",
    cleanDir: true,
    format: "esm",
    entryFileNames: "[name].js",
    banner: "#!/usr/bin/env node",
  },
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      "@": join(__dirname, "src"),
    },
  },
  external: [
    "node:fs",
    "node:fs/promises",
    "node:path",
    "node:os",
    "node:child_process",
    "node:url",
    "commander",
    "picocolors",
    "zod",
  ],
});
