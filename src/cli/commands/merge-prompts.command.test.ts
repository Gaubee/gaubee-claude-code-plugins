import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock modules
vi.mock("@/core/merger.js", () => ({
  mergeSystemPrompts: vi.fn().mockResolvedValue("merged prompt content"),
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

describe("merge-prompts.command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createMergePromptsCommand", () => {
    it("should merge prompts with provider only", async () => {
      const { createMergePromptsCommand } = await import("./merge-prompts.command.js");
      const { mergeSystemPrompts } = await import("@/core/merger.js");

      const command = createMergePromptsCommand();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await command.parseAsync(["--provider", "glm"], { from: "user" });

      expect(mergeSystemPrompts).toHaveBeenCalledWith({
        provider: "glm",
        taskType: undefined,
        planOnly: undefined,
      });
      expect(consoleSpy).toHaveBeenCalledWith("merged prompt content");

      consoleSpy.mockRestore();
    });

    it("should merge prompts with task type", async () => {
      const { createMergePromptsCommand } = await import("./merge-prompts.command.js");
      const { mergeSystemPrompts } = await import("@/core/merger.js");

      const command = createMergePromptsCommand();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await command.parseAsync(["--provider", "glm", "--example", "web-scraping"], {
        from: "user",
      });

      expect(mergeSystemPrompts).toHaveBeenCalledWith({
        provider: "glm",
        taskType: "web-scraping",
        planOnly: undefined,
      });

      consoleSpy.mockRestore();
    });

    it("should merge prompts with plan-only flag", async () => {
      const { createMergePromptsCommand } = await import("./merge-prompts.command.js");
      const { mergeSystemPrompts } = await import("@/core/merger.js");

      const command = createMergePromptsCommand();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await command.parseAsync(["--provider", "glm", "--plan-only"], { from: "user" });

      expect(mergeSystemPrompts).toHaveBeenCalledWith({
        provider: "glm",
        taskType: undefined,
        planOnly: true,
      });

      consoleSpy.mockRestore();
    });

    it("should fail with invalid task type", async () => {
      const { createMergePromptsCommand } = await import("./merge-prompts.command.js");
      const { logger } = await import("@/utils/logger.js");

      const command = createMergePromptsCommand();
      command.exitOverride();

      try {
        await command.parseAsync(["--provider", "glm", "--example", "invalid-type"], {
          from: "user",
        });
      } catch (error) {
        // Expected to throw
      }

      expect(logger.error).toHaveBeenCalledWith("Invalid task type: invalid-type");
    });
  });
});
