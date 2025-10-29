import { OperationContext } from "@/types/operations.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock modules
vi.mock("@/core/installer.js", () => ({
  generateProviderCommand: vi.fn(),
  generateRoutingCommand: vi.fn(),
  generateEvalCommand: vi.fn(),
  getExamplesList: vi.fn().mockReturnValue("- web-scraping\n- code-generation"),
}));

vi.mock("@/core/merger.js", () => ({
  formatProviderInfo: vi.fn().mockReturnValue("Provider info"),
  getAllProvidersInfo: vi.fn().mockResolvedValue("All providers info"),
}));

vi.mock("@/utils/fs.js", () => ({
  fileExists: vi.fn(),
  listProviders: vi.fn().mockResolvedValue(["glm", "minimax"]),
  getProviderSettingsPath: vi.fn((provider: string) => `~/.claude/ccai/settings-${provider}.json`),
  getProviderCommandPath: vi.fn((provider: string) => `~/.claude/commands/ccai-${provider}.md`),
  readJsonFile: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({
  unlink: vi.fn(),
}));

vi.mock("@/utils/logger.js", () => ({
  logger: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    section: vi.fn(),
    list: vi.fn(),
    warning: vi.fn(),
    code: (text: string) => text,
    provider: (name: string) => name,
    path: (path: string) => path,
  },
}));

describe("update.command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateCommand", () => {
    it("should update all enabled providers and regenerate commands", async () => {
      const { updateCommand } = await import("./update.command.js");
      const {
        generateProviderCommand,
        generateRoutingCommand,
        generateEvalCommand,
      } = await import("@/core/installer.js");
      const { fileExists, readJsonFile } = await import("@/utils/fs.js");

      vi.mocked(fileExists).mockResolvedValue(false);
      vi.mocked(readJsonFile).mockResolvedValue({
        ccai: { disabled: false },
        env: {},
      });

      await updateCommand();

      expect(generateProviderCommand).toHaveBeenCalledTimes(2); // glm and minimax
      expect(generateRoutingCommand).toHaveBeenCalled();
      expect(generateEvalCommand).toHaveBeenCalled();
    });

    it("should skip disabled providers", async () => {
      const { updateCommand } = await import("./update.command.js");
      const { generateProviderCommand } = await import("@/core/installer.js");
      const { fileExists, readJsonFile } = await import("@/utils/fs.js");

      vi.mocked(fileExists).mockResolvedValue(false);
      vi.mocked(readJsonFile).mockImplementation(async (path: string) => {
        if (path.includes("glm")) {
          return { ccai: { disabled: true }, env: {} };
        }
        return { ccai: { disabled: false }, env: {} };
      });

      await updateCommand();

      // Should only generate command for minimax (not disabled)
      expect(generateProviderCommand).toHaveBeenCalledWith(
        "minimax",
        "Provider info",
        "- web-scraping\n- code-generation"
      );
    });

    it("should remove command files for disabled providers", async () => {
      const { updateCommand } = await import("./update.command.js");
      const { fileExists, readJsonFile } = await import("@/utils/fs.js");
      const { unlink } = await import("node:fs/promises");

      vi.mocked(fileExists).mockResolvedValue(true);
      vi.mocked(readJsonFile).mockResolvedValue({
        ccai: { disabled: true },
        env: {},
      });

      await updateCommand();

      expect(unlink).toHaveBeenCalledTimes(2); // Both providers disabled
    });
  });
});
