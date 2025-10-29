import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock modules
vi.mock("@/core/merger.js", () => ({
  mergeSettings: vi.fn().mockResolvedValue("/tmp/ccai-settings-glm.json"),
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

describe("merge-settings.command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createMergeSettingsCommand", () => {
    it("should merge settings and output path", async () => {
      const { createMergeSettingsCommand } = await import("./merge-settings.command.js");
      const { mergeSettings } = await import("@/core/merger.js");

      const command = createMergeSettingsCommand();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await command.parseAsync(["glm"], { from: "user" });

      expect(mergeSettings).toHaveBeenCalledWith("glm");
      expect(consoleSpy).toHaveBeenCalledWith("/tmp/ccai-settings-glm.json");

      consoleSpy.mockRestore();
    });

    it("should handle merge errors", async () => {
      const { createMergeSettingsCommand } = await import("./merge-settings.command.js");
      const { mergeSettings } = await import("@/core/merger.js");
      const { logger } = await import("@/utils/logger.js");

      vi.mocked(mergeSettings).mockRejectedValueOnce(new Error("Merge failed"));

      const command = createMergeSettingsCommand();
      command.exitOverride();

      try {
        await command.parseAsync(["glm"], { from: "user" });
      } catch (error) {
        // Expected to throw
      }

      expect(logger.error).toHaveBeenCalled();
    });
  });
});
