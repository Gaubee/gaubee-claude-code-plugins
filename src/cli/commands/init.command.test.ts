import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock modules
vi.mock("@/core/installer.js", () => ({
  installAllTemplates: vi.fn(),
  generateEvalCommand: vi.fn(),
}));

vi.mock("@/utils/logger.js", () => ({
  logger: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    section: vi.fn(),
    warning: vi.fn(),
    path: (path: string) => path,
  },
}));

describe("init.command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.log to avoid test output pollution
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  describe("init", () => {
    it("should run installation in normal mode", async () => {
      const { installAllTemplates, generateEvalCommand } = await import("@/core/installer.js");
      const { logger } = await import("@/utils/logger.js");

      const command = await import("./init.command.js");
      await command.createInitCommand().parseAsync([], { from: "user" });

      expect(installAllTemplates).toHaveBeenCalled();
      expect(generateEvalCommand).toHaveBeenCalled();
      expect(logger.success).toHaveBeenCalledWith("CCAI templates installed successfully!");
    });

    it("should preview changes in dry-run mode", async () => {
      const { installAllTemplates, generateEvalCommand } = await import("@/core/installer.js");
      const { logger } = await import("@/utils/logger.js");

      const command = await import("./init.command.js");
      await command.createInitCommand().parseAsync(["--dry-run"], { from: "user" });

      // Verify that installer was called with dry-run context
      const calls = vi.mocked(installAllTemplates).mock.calls[0];
      expect(calls[1]).toBeDefined();
      expect(calls[1]?.isDryRun()).toBe(true);
      const evalCalls = vi.mocked(generateEvalCommand).mock.calls[0];
      expect(evalCalls[0]).toBeDefined();
      expect(evalCalls[0]?.isDryRun()).toBe(true);
      expect(logger.section).toHaveBeenCalledWith("Dry Run - Preview of Changes");
      expect(logger.warning).toHaveBeenCalledWith("\nNo files were modified (dry-run mode)");
    });

    it("should support force flag", async () => {
      const { installAllTemplates } = await import("@/core/installer.js");

      const command = await import("./init.command.js");
      await command.createInitCommand().parseAsync(["--force"], { from: "user" });

      expect(installAllTemplates).toHaveBeenCalledWith(
        true, // force = true
        expect.any(Object)
      );
    });

    it("should show operation summary in dry-run mode", async () => {
      const { logger } = await import("@/utils/logger.js");

      const command = await import("./init.command.js");
      await command.createInitCommand().parseAsync(["--dry-run"], { from: "user" });

      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("Total operations:"));
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("Directories to create:"));
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("Files to write:"));
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("Files to delete:"));
    });
  });
});
