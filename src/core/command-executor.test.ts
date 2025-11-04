import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock logger - must be before imports
vi.mock("@/utils/logger.js", () => ({
  logger: {
    warn: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    command: vi.fn((cmd: string) => cmd),
  },
}));

import { replaceCommandPlaceholders, validateCommand } from "./command-executor.js";

describe("command-executor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("replaceCommandPlaceholders", () => {
    it("should replace standard placeholders", () => {
      const args = [
        "--settings",
        "{{SETTINGS_PATH}}",
        "--prompt",
        "{{SYSTEM_PROMPT}}",
        "-p",
        "{{TASK}}",
      ];

      const placeholders = {
        SETTINGS_PATH: "/path/to/settings.json",
        SYSTEM_PROMPT: "You are a helpful assistant",
        TASK: "Do something",
      };

      const result = replaceCommandPlaceholders(args, placeholders);

      expect(result).toEqual([
        "--settings",
        "/path/to/settings.json",
        "--prompt",
        "You are a helpful assistant",
        "-p",
        "Do something",
      ]);
    });

    it("should replace environment variable placeholders", () => {
      process.env.TEST_API_KEY = "secret-key-123";

      const args = ["--api-key", "{{ENV.TEST_API_KEY}}"];

      const result = replaceCommandPlaceholders(args, {
        SETTINGS_PATH: "",
        SYSTEM_PROMPT: "",
        TASK: "",
      });

      expect(result).toEqual(["--api-key", "secret-key-123"]);

      delete process.env.TEST_API_KEY;
    });

    it("should handle missing environment variables", () => {
      const args = ["--api-key", "{{ENV.MISSING_VAR}}"];

      const result = replaceCommandPlaceholders(args, {
        SETTINGS_PATH: "",
        SYSTEM_PROMPT: "",
        TASK: "",
      });

      expect(result).toEqual(["--api-key", ""]);
    });

    it("should replace multiple occurrences of same placeholder", () => {
      const args = ["{{TASK}}", "and", "{{TASK}}", "again"];

      const placeholders = {
        SETTINGS_PATH: "",
        SYSTEM_PROMPT: "",
        TASK: "test",
      };

      const result = replaceCommandPlaceholders(args, placeholders);

      expect(result).toEqual(["test", "and", "test", "again"]);
    });

    it("should not replace non-matching placeholders", () => {
      const args = ["{{UNKNOWN}}", "{{TASK}}"];

      const placeholders = {
        SETTINGS_PATH: "",
        SYSTEM_PROMPT: "",
        TASK: "test",
      };

      const result = replaceCommandPlaceholders(args, placeholders);

      expect(result).toEqual(["{{UNKNOWN}}", "test"]);
    });
  });

  describe("validateCommand", () => {
    it("should validate correct command", () => {
      const command = {
        executable: "claude",
        args: ["--settings", "{{SETTINGS_PATH}}", "-p", "{{TASK}}"],
      };

      expect(() => validateCommand(command)).not.toThrow();
    });

    it("should throw error if executable is missing", () => {
      const command = {
        executable: "",
        args: ["-p", "{{TASK}}"],
      };

      expect(() => validateCommand(command)).toThrow("Command executable is required");
    });

    it("should throw error if args is not an array", () => {
      const command = {
        executable: "claude",
        args: "not an array" as any,
      };

      expect(() => validateCommand(command)).toThrow("Command args must be an array");
    });

    it("should allow command without args", () => {
      const command = {
        executable: "claude",
      };

      expect(() => validateCommand(command)).not.toThrow();
    });
  });
});
