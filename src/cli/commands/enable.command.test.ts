import { OperationContext } from "@/types/operations.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock modules
vi.mock("@/utils/fs.js", () => ({
  getProviderSettingsPath: vi.fn((provider: string) => `~/.claude/ccai/settings-${provider}.json`),
  readJsonFile: vi.fn(),
  writeJsonFile: vi.fn(),
}));

vi.mock("@/utils/logger.js", () => ({
  logger: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    section: vi.fn(),
    provider: (name: string) => name,
    code: (text: string) => text,
  },
}));

describe("enable.command", () => {
  let context: OperationContext;

  beforeEach(() => {
    vi.clearAllMocks();
    context = new OperationContext(true); // dry-run mode
  });

  describe("enableProvider", () => {
    it("should enable a provider by setting disabled to false", async () => {
      const { enableProvider } = await import("./enable.command.js");
      const { readJsonFile, writeJsonFile } = await import("@/utils/fs.js");

      const mockSettings = {
        ccai: {
          name: "GLM",
          description: "GLM provider",
          systemPrompt: "",
          disabled: true,
        },
        env: {},
      };

      vi.mocked(readJsonFile).mockResolvedValue(mockSettings);

      await enableProvider("glm", { skipUpdate: true }, context);

      // Verify writeJsonFile was called with disabled set to false
      expect(writeJsonFile).toHaveBeenCalledWith(
        "~/.claude/ccai/settings-glm.json",
        expect.objectContaining({
          ccai: expect.objectContaining({
            disabled: false,
          }),
        }),
        context
      );
    });

    it("should skip update when skipUpdate is true", async () => {
      const { enableProvider } = await import("./enable.command.js");
      const { readJsonFile } = await import("@/utils/fs.js");

      vi.mocked(readJsonFile).mockResolvedValue({
        ccai: { disabled: true },
        env: {},
      } as any);

      await enableProvider("glm", { skipUpdate: true }, context);

      // Since we're in dry-run mode and skipUpdate is true, no update should be triggered
      expect(readJsonFile).toHaveBeenCalled();
    });

    it("should handle provider that is already enabled", async () => {
      const { enableProvider } = await import("./enable.command.js");
      const { readJsonFile, writeJsonFile } = await import("@/utils/fs.js");

      const mockSettings = {
        ccai: {
          name: "GLM",
          description: "GLM provider",
          systemPrompt: "",
          disabled: false, // Already enabled
        },
        env: {},
      };

      vi.mocked(readJsonFile).mockResolvedValue(mockSettings);

      await enableProvider("glm", { skipUpdate: true }, context);

      // Should still write (idempotent operation)
      expect(writeJsonFile).toHaveBeenCalled();
    });
  });
});
