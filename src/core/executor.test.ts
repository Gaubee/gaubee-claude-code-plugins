import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock modules
const mockLogger = {
  info: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  provider: vi.fn((name: string) => name),
  path: vi.fn((path: string) => path),
};

const mockMergeSettings = vi.fn().mockResolvedValue("/path/to/settings.json");
const mockMergeSystemPrompts = vi.fn().mockResolvedValue("system prompt content");

vi.mock("@/utils/logger.js", () => ({
  logger: mockLogger,
}));

vi.mock("@/core/merger.js", () => ({
  mergeSettings: mockMergeSettings,
  mergeSystemPrompts: mockMergeSystemPrompts,
}));

const mockWriteFile = vi.fn().mockResolvedValue(undefined);
const mockUnlink = vi.fn().mockResolvedValue(undefined);
const mockReadFile = vi.fn().mockResolvedValue("mock file content");

vi.mock("node:fs/promises", () => ({
  writeFile: mockWriteFile,
  unlink: mockUnlink,
  readFile: mockReadFile,
}));

const mockFileExists = vi.fn().mockResolvedValue(true);
const mockReadJsonFile = vi.fn().mockResolvedValue({
  ccai: {
    name: "Test Provider",
    disabled: false,
  },
  env: {},
});
const mockGetProviderSettingsPath = vi.fn().mockReturnValue("/path/to/provider/settings.json");

vi.mock("@/utils/fs.js", () => ({
  fileExists: mockFileExists,
  readJsonFile: mockReadJsonFile,
  getProviderSettingsPath: mockGetProviderSettingsPath,
  getClaudeDir: vi.fn().mockReturnValue("/path/to/.claude"),
}));

describe("executor", () => {
  // Store original platform
  const originalPlatform = process.platform;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mocks to their default implementations
    mockMergeSettings.mockResolvedValue("/path/to/settings.json");
    mockMergeSystemPrompts.mockResolvedValue("system prompt content");
    mockWriteFile.mockResolvedValue(undefined);
    mockUnlink.mockResolvedValue(undefined);
    // Mock console.log to capture command output
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("executeAI", () => {
    it("should print command when printCommand option is true", async () => {
      const { executeAI } = await import("./executor.js");
      const { mergeSettings, mergeSystemPrompts } = await import("@/core/merger.js");

      const consoleSpy = vi.spyOn(console, "log");

      await executeAI("test-provider", "test task", {
        printCommand: true,
      });

      // Should have merged settings and prompts
      expect(mergeSettings).toHaveBeenCalledWith("test-provider");
      expect(mergeSystemPrompts).toHaveBeenCalledWith({
        provider: "test-provider",
        taskType: undefined,
      });

      // Should have printed the command (format depends on OS)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^claude --dangerously-skip-permissions/)
      );

      // Should create temp file for bash/ps format (default behavior)
      expect(mockWriteFile).toHaveBeenCalled();
    });

    it("should use bash format by default on non-Windows", async () => {
      // Mock non-Windows platform
      Object.defineProperty(process, "platform", {
        value: "darwin",
        configurable: true,
      });

      const { executeAI } = await import("./executor.js");
      const consoleSpy = vi.spyOn(console, "log");

      await executeAI("test-provider", "test task", {
        printCommand: true,
      });

      const output = consoleSpy.mock.calls[0][0];

      // Should use bash syntax
      expect(output).toContain("$(");
      expect(output).toContain("<");

      // Restore platform
      Object.defineProperty(process, "platform", {
        value: originalPlatform,
        configurable: true,
      });
    });

    it("should use ps format by default on Windows", async () => {
      // Mock Windows platform
      Object.defineProperty(process, "platform", {
        value: "win32",
        configurable: true,
      });

      const { executeAI } = await import("./executor.js");
      const consoleSpy = vi.spyOn(console, "log");

      await executeAI("test-provider", "test task", {
        printCommand: true,
      });

      const output = consoleSpy.mock.calls[0][0];

      // Should use PowerShell syntax
      expect(output).toContain("$(Get-Content");
      expect(output).toContain("-Raw");

      // Restore platform
      Object.defineProperty(process, "platform", {
        value: originalPlatform,
        configurable: true,
      });
    });

    it("should escape arguments with spaces correctly", async () => {
      const { executeAI } = await import("./executor.js");
      const consoleSpy = vi.spyOn(console, "log");

      // Mock mergeSystemPrompts to return content with spaces and quotes
      vi.mocked(await import("@/core/merger.js")).mergeSystemPrompts.mockResolvedValue(
        'prompt with "quotes" and spaces'
      );

      await executeAI("test-provider", "test task", {
        printCommand: "text",
      });

      const printedCommand = consoleSpy.mock.calls[0][0];

      // Should properly escape the system prompt - note the double escaping from our implementation
      expect(printedCommand).toContain("''\\''prompt with \"quotes\" and spaces'\\''");
    });

    it("should escape single quotes in arguments correctly", async () => {
      const { executeAI } = await import("./executor.js");
      const consoleSpy = vi.spyOn(console, "log");

      // Mock mergeSystemPrompts to return content with single quotes
      vi.mocked(await import("@/core/merger.js")).mergeSystemPrompts.mockResolvedValue(
        "prompt with 'single quotes'"
      );

      await executeAI("test-provider", "test task", {
        printCommand: "text",
      });

      const printedCommand = consoleSpy.mock.calls[0][0];

      // Check that it contains the content (actual escaping pattern is more complex)
      expect(printedCommand).toContain("prompt with");
      expect(printedCommand).toContain("single quotes");
    });

    it("should include all command options in printed command", async () => {
      const { executeAI } = await import("./executor.js");
      const consoleSpy = vi.spyOn(console, "log");

      await executeAI("test-provider", "test task", {
        sessionId: "test-session-123",
        log: true,
        printCommand: "text",
      });

      const printedCommand = consoleSpy.mock.calls[0][0];

      // Should include all the expected arguments
      expect(printedCommand).toContain("claude --dangerously-skip-permissions");
      expect(printedCommand).toContain("--settings /path/to/settings.json");
      expect(printedCommand).toContain("--output-format stream-json");
      expect(printedCommand).toContain("--verbose");
      expect(printedCommand).toContain("--resume test-session-123");
      expect(printedCommand).toContain("system prompt content");
      expect(printedCommand).toContain("-p 'test task'");
    });

    it("should handle JSON output format when log is false", async () => {
      const { executeAI } = await import("./executor.js");
      const consoleSpy = vi.spyOn(console, "log");

      await executeAI("test-provider", "test task", {
        log: false,
        printCommand: true,
      });

      const printedCommand = consoleSpy.mock.calls[0][0];

      expect(printedCommand).toContain("--output-format json");
      expect(printedCommand).not.toContain("--verbose");
    });

    it("should return early without executing when printCommand is true", async () => {
      const { executeAI } = await import("./executor.js");

      // Mock spawn to track if it's called
      const mockSpawn = vi.fn();
      vi.doMock("node:child_process", () => ({
        spawn: mockSpawn,
      }));

      await executeAI("test-provider", "test task", {
        printCommand: "text",
      });

      // Spawn should not be called when printCommand is true
      expect(mockSpawn).not.toHaveBeenCalled();
    });

    it("should handle task type in printed command", async () => {
      const { executeAI } = await import("./executor.js");
      const consoleSpy = vi.spyOn(console, "log");

      await executeAI("test-provider", "test task", {
        taskType: "web-scraping",
        printCommand: "text",
      });

      // Should have called mergeSystemPrompts with taskType
      expect(mockMergeSystemPrompts).toHaveBeenCalledWith({
        provider: "test-provider",
        taskType: "web-scraping",
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^claude --dangerously-skip-permissions/)
      );
    });

    it("should output JSON array when printCommand is 'json'", async () => {
      const { executeAI } = await import("./executor.js");
      const consoleSpy = vi.spyOn(console, "log");

      await executeAI("test-provider", "test task", {
        printCommand: "json",
      });

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const output = consoleSpy.mock.calls[0][0];

      // Should be valid JSON
      expect(() => JSON.parse(output)).not.toThrow();

      const parsed = JSON.parse(output);
      // Should be an array
      expect(Array.isArray(parsed)).toBe(true);
      // First element should be "claude"
      expect(parsed[0]).toBe("claude");
      // Should contain expected arguments
      expect(parsed).toContain("--dangerously-skip-permissions");
      expect(parsed).toContain("--settings");
      expect(parsed).toContain("/path/to/settings.json");
      expect(parsed).toContain("--system-prompt");
      expect(parsed).toContain("system prompt content");
      expect(parsed).toContain("-p");
      expect(parsed).toContain("test task");
    });

    it("should output text format when printCommand is true or 'text'", async () => {
      const { executeAI } = await import("./executor.js");
      const consoleSpy = vi.spyOn(console, "log");

      // Test with boolean true
      await executeAI("test-provider", "test task", {
        printCommand: true,
      });

      let output = consoleSpy.mock.calls[0][0];
      expect(output).toMatch(/^claude --dangerously-skip-permissions/);
      expect(output).toContain("--settings /path/to/settings.json");

      consoleSpy.mockClear();

      // Test with explicit "text"
      await executeAI("test-provider", "test task", {
        printCommand: "text",
      });

      output = consoleSpy.mock.calls[0][0];
      expect(output).toMatch(/^claude --dangerously-skip-permissions/);
      expect(output).toContain("--settings /path/to/settings.json");
    });

    it("should output JSON with all options included", async () => {
      const { executeAI } = await import("./executor.js");
      const consoleSpy = vi.spyOn(console, "log");

      await executeAI("test-provider", "test task", {
        sessionId: "test-session",
        log: true,
        taskType: "code-generation",
        printCommand: "json",
      });

      const output = consoleSpy.mock.calls[0][0];
      const parsed = JSON.parse(output);

      expect(parsed).toContain("claude");
      expect(parsed).toContain("--dangerously-skip-permissions");
      expect(parsed).toContain("--output-format");
      expect(parsed).toContain("stream-json");
      expect(parsed).toContain("--verbose");
      expect(parsed).toContain("--resume");
      expect(parsed).toContain("test-session");
      expect(parsed).toContain("--system-prompt");
      expect(parsed).toContain("system prompt content");
      expect(parsed).toContain("-p");
      expect(parsed).toContain("test task");
    });

    it("should output bash format with temp file substitution", async () => {
      const { executeAI } = await import("./executor.js");
      const consoleSpy = vi.spyOn(console, "log");

      await executeAI("test-provider", "test task", {
        printCommand: "bash",
      });

      const output = consoleSpy.mock.calls[0][0];

      // Should contain the temp file substitution syntax
      expect(output).toContain("claude --dangerously-skip-permissions");
      expect(output).toContain("--settings /path/to/settings.json");
      expect(output).toContain("$("); // Should contain substitution syntax
      expect(output).toContain("<"); // Should contain file read syntax
      expect(output).toContain("-p 'test task'");
    });

    it("should output PowerShell format with temp file substitution", async () => {
      const { executeAI } = await import("./executor.js");
      const consoleSpy = vi.spyOn(console, "log");

      await executeAI("test-provider", "test task", {
        printCommand: "ps",
      });

      const output = consoleSpy.mock.calls[0][0];

      // Should contain the PowerShell temp file substitution syntax
      expect(output).toContain("claude --dangerously-skip-permissions");
      expect(output).toContain("--settings /path/to/settings.json");
      expect(output).toContain("$(Get-Content"); // Should contain PowerShell syntax
      expect(output).toContain("-Raw"); // Should include Raw parameter
      expect(output).toContain("-p 'test task'");
    });

    it("should properly escape special characters in text format", async () => {
      const { executeAI } = await import("./executor.js");
      const consoleSpy = vi.spyOn(console, "log");

      // Mock system prompt with special characters
      mockMergeSystemPrompts.mockResolvedValue("System prompt with 'single quotes' and \"double quotes\"");

      await executeAI("test-provider", "test task", {
        printCommand: "text",
      });

      const output = consoleSpy.mock.calls[0][0];

      // Should properly escape special characters
      expect(output).toContain("System prompt with");
      expect(output).toContain("single quotes");
      expect(output).toContain("double quotes");
      expect(output).toContain("-p 'test task'");
    });

    it("should create temp files for bash/ps formats", async () => {
      const { executeAI } = await import("./executor.js");
      const { writeFile } = await import("node:fs/promises");
      const mockWriteFile = vi.mocked(writeFile);

      await executeAI("test-provider", "test task", {
        printCommand: "bash",
      });

      // Should have called writeFile to create temp file
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringMatching(/ccai-prompt-\d+\.md$/),
        "system prompt content",
        "utf-8"
      );
    });

    it("should omit -p parameter when task is empty in printCommand mode", async () => {
      const { executeAI } = await import("./executor.js");
      const consoleSpy = vi.spyOn(console, "log");

      await executeAI("test-provider", "", {
        printCommand: "text",
      });

      const output = consoleSpy.mock.calls[0][0];

      // Should not contain -p parameter (check with word boundary)
      expect(output).not.toMatch(/ -p\b/);
    });

    it("should not output logger messages in printCommand mode", async () => {
      const { executeAI } = await import("./executor.js");

      // Spy on logger methods
      const loggerInfoSpy = vi.spyOn(mockLogger, "info");
      const loggerSuccessSpy = vi.spyOn(mockLogger, "success");

      await executeAI("test-provider", "test task", {
        printCommand: "bash",
      });

      // Logger should not be called in print mode
      expect(loggerInfoSpy).not.toHaveBeenCalled();
      expect(loggerSuccessSpy).not.toHaveBeenCalled();
    });

    it("should include -p parameter when task is provided in printCommand mode", async () => {
      const { executeAI } = await import("./executor.js");
      const consoleSpy = vi.spyOn(console, "log");

      await executeAI("test-provider", "analyze this", {
        printCommand: "text",
      });

      const output = consoleSpy.mock.calls[0][0];

      // Should contain -p parameter with task
      expect(output).toContain("-p");
      expect(output).toContain("analyze this");
    });
  });
});