import { OperationContext } from "@/types/operations.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock modules
vi.mock("@/utils/fs.js", () => ({
  fileExists: vi.fn(),
  getProviderSettingsPath: vi.fn((provider: string) => `~/.claude/ccai/settings-${provider}.json`),
  readJsonFile: vi.fn(),
}));

vi.mock("@/utils/logger.js", () => ({
  logger: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    section: vi.fn(),
    list: vi.fn(),
    provider: (name: string) => name,
    path: (path: string) => path,
  },
}));

describe("get.command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createGetCommand", () => {
    it("should display provider configuration", async () => {
      const { createGetCommand } = await import("./get.command.js");
      const { readJsonFile } = await import("@/utils/fs.js");
      const { logger } = await import("@/utils/logger.js");

      const mockSettings = {
        ccai: {
          name: "GLM",
          description: "GLM provider",
          disabled: false,
        },
        env: {
          ANTHROPIC_AUTH_TOKEN: "test-key",
          ANTHROPIC_BASE_URL: "https://api.test.com",
        },
      };

      vi.mocked(readJsonFile).mockResolvedValue(mockSettings);
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const command = createGetCommand();
      command.exitOverride(); // Prevent process.exit

      try {
        await command.parseAsync(["glm"], { from: "user" });
      } catch (error) {
        // May throw due to exitOverride, but that's ok
      }

      expect(readJsonFile).toHaveBeenCalled();
      expect(logger.section).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should fail if provider does not exist", async () => {
      const { createGetCommand } = await import("./get.command.js");
      const { readJsonFile } = await import("@/utils/fs.js");
      const { logger } = await import("@/utils/logger.js");

      vi.mocked(readJsonFile).mockRejectedValue(new Error("File not found"));

      const command = createGetCommand();
      command.exitOverride();

      try {
        await command.parseAsync(["nonexistent"], { from: "user" });
      } catch (error) {
        // Expected to throw
      }

      expect(logger.error).toHaveBeenCalled();
    });
  });
});
