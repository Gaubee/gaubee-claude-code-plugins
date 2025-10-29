import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "src/generated/",
        "**/*.test.ts",
        "**/*.config.ts",
        "scripts/",
      ],
    },
    include: ["src/**/*.test.ts"],
    exclude: ["node_modules/", "dist/"],
  },
  resolve: {
    alias: {
      "@": join(__dirname, "src"),
    },
  },
});
