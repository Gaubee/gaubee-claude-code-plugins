import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock modules
vi.mock("@/utils/fs.js", () => ({
  listProviders: vi.fn(),
  getProviderSettingsPath: vi.fn((provider: string) => `~/.claude/ccai/settings-${provider}.json`),
  readJsonFile: vi.fn(),
}));

vi.mock("@/utils/logger.js", () => ({
  logger: {
    warning: vi.fn(),
    info: vi.fn(),
    section: vi.fn(),
    provider: (name: string) => name,
    path: (path: string) => path,
  },
}));

describe("list.command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.log to avoid test output pollution
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  describe("listProviders", () => {
    it("should show warning when no providers are configured", async () => {
      const { listProviders } = await import("@/utils/fs.js");
      const { logger } = await import("@/utils/logger.js");

      vi.mocked(listProviders).mockResolvedValue([]);

      const command = await import("./list.command.js");
      await command.createListCommand().parseAsync(["node", "test", "list"]);

      expect(logger.warning).toHaveBeenCalledWith("No providers configured yet.");
      expect(logger.info).toHaveBeenCalledWith("Add a provider with: npx ccai add <provider-name>");
    });

    it("should list all providers with their status", async () => {
      const { listProviders, readJsonFile } = await import("@/utils/fs.js");

      vi.mocked(listProviders).mockResolvedValue(["glm", "minimax"]);
      vi.mocked(readJsonFile)
        .mockResolvedValueOnce({
          ccai: {
            name: "GLM",
            description: "GLM provider description",
            disabled: false,
          },
          env: {},
        })
        .mockResolvedValueOnce({
          ccai: {
            name: "MiniMax",
            description: "MiniMax provider description",
            disabled: true,
          },
          env: {},
        });

      const command = await import("./list.command.js");
      await command.createListCommand().parseAsync(["node", "test", "list"]);

      expect(console.log).toHaveBeenCalled();
      expect(readJsonFile).toHaveBeenCalledTimes(2);
    });

    it("should show detailed information with --verbose flag", async () => {
      const { listProviders, readJsonFile } = await import("@/utils/fs.js");

      vi.mocked(listProviders).mockResolvedValue(["glm"]);
      vi.mocked(readJsonFile).mockResolvedValue({
        ccai: {
          name: "GLM",
          description: "GLM provider description\nDetailed info here",
          disabled: false,
        },
        env: {},
      });

      const command = await import("./list.command.js");
      await command.createListCommand().parseAsync(["node", "test", "list", "--verbose"]);

      expect(console.log).toHaveBeenCalled();
      expect(readJsonFile).toHaveBeenCalled();
    });

    it("should handle providers with missing ccai config", async () => {
      const { listProviders, readJsonFile } = await import("@/utils/fs.js");

      vi.mocked(listProviders).mockResolvedValue(["test"]);
      vi.mocked(readJsonFile).mockResolvedValue({
        ccai: {},
        env: {},
      } as any);

      const command = await import("./list.command.js");
      await command.createListCommand().parseAsync(["node", "test", "list"]);

      // Should use provider name as fallback
      expect(console.log).toHaveBeenCalled();
    });
  });
});
