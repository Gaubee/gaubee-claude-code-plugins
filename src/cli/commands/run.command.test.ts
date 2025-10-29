import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock modules
vi.mock("@/core/executor.js", () => ({
  executeAI: vi.fn().mockResolvedValue(undefined),
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

vi.mock("@/utils/repl.js", () => ({
  startREPL: vi.fn().mockResolvedValue("prompt from REPL"),
}));

describe("run.command", () => {
  beforeEach(async () => {
    // Only clear call history, keep mock implementations
    const { executeAI } = await import("@/core/executor.js");
    const { startREPL } = await import("@/utils/repl.js");
    vi.mocked(executeAI).mockClear();
    vi.mocked(startREPL).mockClear();
  });

  describe("createRunCommand", () => {
    it("should execute AI with correct provider and prompt", async () => {
      const { createRunCommand } = await import("./run.command.js");
      const { executeAI } = await import("@/core/executor.js");

      const command = createRunCommand();

      // Simulate command execution with provider and prompt
      // Note: parseAsync expects argv array, first element is usually stripped
      await command.parseAsync(["--provider", "glm", "analyze this code"], { from: "user" });

      expect(executeAI).toHaveBeenCalledWith("glm", "analyze this code", {
        taskType: undefined,
      });
    });

    it("should execute AI with task type when provided", async () => {
      const { createRunCommand } = await import("./run.command.js");
      const { executeAI } = await import("@/core/executor.js");

      const command = createRunCommand();

      await command.parseAsync(
        ["--provider", "glm", "--example", "web-scraping", "scrape this website"],
        { from: "user" }
      );

      expect(executeAI).toHaveBeenCalledWith("glm", "scrape this website", {
        taskType: "web-scraping",
      });
    });

    it("should combine multiple prompt arguments", async () => {
      const { createRunCommand } = await import("./run.command.js");
      const { executeAI } = await import("@/core/executor.js");

      const command = createRunCommand();

      await command.parseAsync(
        ["--provider", "glm", "analyze", "this", "complex", "code"],
        { from: "user" }
      );

      expect(executeAI).toHaveBeenCalledWith("glm", "analyze this complex code", {
        taskType: undefined,
      });
    });

    it("should fail if provider is not provided", async () => {
      const { createRunCommand } = await import("./run.command.js");
      const { logger } = await import("@/utils/logger.js");

      const command = createRunCommand();
      command.exitOverride(); // Prevent process.exit in tests

      try {
        await command.parseAsync(["some prompt"], { from: "user" });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // Expected to throw due to exitOverride
      }

      expect(logger.error).toHaveBeenCalledWith("Provider is required");
    });

    it("should enter REPL mode when prompt is empty", async () => {
      const { createRunCommand } = await import("./run.command.js");
      const { executeAI } = await import("@/core/executor.js");
      const { startREPL } = await import("@/utils/repl.js");

      const command = createRunCommand();

      await command.parseAsync(["--provider", "glm"], { from: "user" });

      // Should call startREPL to get the prompt
      expect(startREPL).toHaveBeenCalled();

      // Should execute with the prompt from REPL
      expect(executeAI).toHaveBeenCalledWith("glm", "prompt from REPL", {
        taskType: undefined,
      });
    });

    it("should fail if invalid task type is provided", async () => {
      const { createRunCommand } = await import("./run.command.js");
      const { logger } = await import("@/utils/logger.js");

      const command = createRunCommand();
      command.exitOverride();

      try {
        await command.parseAsync(
          ["--provider", "glm", "--example", "invalid-type", "some prompt"],
          { from: "user" }
        );
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // Expected to throw
      }

      expect(logger.error).toHaveBeenCalledWith("Invalid task type: invalid-type");
    });

    it("should support valid task type: web-scraping", async () => {
      const { createRunCommand } = await import("./run.command.js");
      const { executeAI } = await import("@/core/executor.js");

      const command = createRunCommand();

      await command.parseAsync(
        ["--provider", "glm", "--example", "web-scraping", "test prompt"],
        { from: "user" }
      );

      expect(executeAI).toHaveBeenCalledWith("glm", "test prompt", {
        taskType: "web-scraping",
      });
    });

    it("should support valid task type: code-generation", async () => {
      const { createRunCommand } = await import("./run.command.js");
      const { executeAI } = await import("@/core/executor.js");

      const command = createRunCommand();

      await command.parseAsync(
        ["--provider", "glm", "--example", "code-generation", "test prompt"],
        { from: "user" }
      );

      expect(executeAI).toHaveBeenCalledWith("glm", "test prompt", {
        taskType: "code-generation",
      });
    });

    it("should read prompt from file when --prompt-file is provided", async () => {
      const { createRunCommand } = await import("./run.command.js");
      const { executeAI } = await import("@/core/executor.js");

      // Mock readFile
      const mockReadFile = vi.fn().mockResolvedValue("prompt content from file");
      vi.doMock("node:fs/promises", () => ({
        readFile: mockReadFile,
      }));

      const command = createRunCommand();

      await command.parseAsync(
        ["--provider", "glm", "--prompt-file", "/path/to/prompt.txt"],
        { from: "user" }
      );

      expect(executeAI).toHaveBeenCalledWith("glm", "prompt content from file", {
        taskType: undefined,
        sessionId: undefined,
        planOnly: undefined,
        log: undefined,
        prettyJson: undefined,
        format: undefined,
      });
    });

    it("should fail if prompt file does not exist", async () => {
      const { createRunCommand } = await import("./run.command.js");
      const { logger } = await import("@/utils/logger.js");

      // Mock readFile to throw error
      const mockReadFile = vi.fn().mockRejectedValue(new Error("File not found"));
      vi.doMock("node:fs/promises", () => ({
        readFile: mockReadFile,
      }));

      const command = createRunCommand();
      command.exitOverride();

      try {
        await command.parseAsync(
          ["--provider", "glm", "--prompt-file", "/nonexistent/file.txt"],
          { from: "user" }
        );
      } catch (error) {
        // Expected to throw
      }

      expect(logger.error).toHaveBeenCalled();
    });
  });
});
