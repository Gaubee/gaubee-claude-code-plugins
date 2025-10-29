import { OperationContext } from "@/types/operations.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock modules
vi.mock("@/utils/fs.js", () => ({
  fileExists: vi.fn(),
  getProviderSettingsPath: vi.fn((provider: string) => `~/.claude/ccai/settings-${provider}.json`),
  writeJsonFile: vi.fn(),
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

vi.mock("@/generated/templates.js", () => ({
  default: {
    "ccai/settings-provider.json.template": JSON.stringify({
      ccai: {
        name: "{{PROVIDER}}",
        description: "{{PROVIDER}} Provider description and capabilities.",
        systemPrompt: "You are using {{PROVIDER}} model.",
        disabled: true,
      },
      env: {
        ANTHROPIC_AUTH_TOKEN: "your-{{provider}}-api-key-here",
        ANTHROPIC_BASE_URL: "https://api.{{provider}}.com/v1",
      },
    }),
  },
}));

describe("add.command", () => {
  let context: OperationContext;

  beforeEach(() => {
    vi.clearAllMocks();
    context = new OperationContext(true); // dry-run mode
  });

  describe("addProvider", () => {
    it("should create provider settings file", async () => {
      const { addProvider } = await import("./add.command.js");
      const { fileExists, writeJsonFile } = await import("@/utils/fs.js");

      vi.mocked(fileExists).mockResolvedValue(false);

      await addProvider("glm", { force: false }, context);

      // Verify writeJsonFile was called with correct arguments
      expect(writeJsonFile).toHaveBeenCalledWith(
        "~/.claude/ccai/settings-glm.json",
        expect.objectContaining({
          ccai: expect.objectContaining({
            name: "GLM",
            description: expect.stringContaining("GLM Provider description"),
            systemPrompt: expect.stringContaining("GLM model"),
          }),
          env: expect.objectContaining({
            ANTHROPIC_AUTH_TOKEN: "your-glm-api-key-here",
            ANTHROPIC_BASE_URL: "https://api.glm.com/v1",
          }),
        }),
        context
      );
    });

    it("should fail if provider already exists without force flag", async () => {
      const { addProvider } = await import("./add.command.js");
      const { fileExists } = await import("@/utils/fs.js");
      const { logger } = await import("@/utils/logger.js");

      vi.mocked(fileExists).mockResolvedValue(true);

      await expect(addProvider("glm", { force: false }, context)).rejects.toThrow();
      expect(logger.error).toHaveBeenCalled();
    });

    it("should overwrite if provider exists with force flag", async () => {
      const { addProvider } = await import("./add.command.js");
      const { fileExists, writeJsonFile } = await import("@/utils/fs.js");

      vi.mocked(fileExists).mockResolvedValue(true);

      await addProvider("glm", { force: true }, context);

      expect(writeJsonFile).toHaveBeenCalled();
    });

    it("should replace provider placeholders in template", async () => {
      const { addProvider } = await import("./add.command.js");
      const { fileExists, writeJsonFile } = await import("@/utils/fs.js");

      vi.mocked(fileExists).mockResolvedValue(false);

      await addProvider("minimax", { force: false }, context);

      const callArgs = vi.mocked(writeJsonFile).mock.calls[0];
      const settings = callArgs[1] as any;

      expect(settings.ccai.name).toBe("MINIMAX");
      expect(settings.ccai.description).toContain("MINIMAX");
      expect(settings.ccai.systemPrompt).toContain("MINIMAX");
      expect(settings.env.ANTHROPIC_AUTH_TOKEN).toBe("your-minimax-api-key-here");
      expect(settings.env.ANTHROPIC_BASE_URL).toBe("https://api.minimax.com/v1");
    });
  });
});
