import { describe, expect, it } from "vitest";
import {
  getCommandTemplate,
  getCommandTemplateDescription,
  getCommandTemplateSystemPrompt,
} from "./command-templates.js";

describe("command-templates", () => {
  describe("getCommandTemplate", () => {
    it("should return claude template", () => {
      const template = getCommandTemplate("claude");

      expect(template.executable).toBe("claude");
      expect(template.args).toBeDefined();
      expect(
        template.args?.some(
          (arg) => typeof arg === "string" && arg.includes("--dangerously-skip-permissions")
        )
      ).toBe(true);
    });

    it("should return gemini template", () => {
      const template = getCommandTemplate("gemini");

      expect(template.executable).toBe("gemini");
      expect(template.args).toBeDefined();
      expect(template.args?.some((arg) => typeof arg === "string" && arg.includes("--yolo"))).toBe(
        true
      );
    });

    it("should return codex template", () => {
      const template = getCommandTemplate("codex");

      expect(template.executable).toBe("codex");
      expect(template.args).toBeDefined();
      expect(
        template.args?.some((arg) => typeof arg === "string" && arg.includes("--full-auto"))
      ).toBe(true);
    });

    it("should throw error for unknown template", () => {
      expect(() => getCommandTemplate("unknown" as any)).toThrow("Unknown command template");
    });
  });

  describe("getCommandTemplateDescription", () => {
    it("should return claude description", () => {
      const description = getCommandTemplateDescription("claude");

      expect(Array.isArray(description)).toBe(true);
      expect(description.some((line) => line.includes("Claude CLI"))).toBe(true);
    });

    it("should return gemini description", () => {
      const description = getCommandTemplateDescription("gemini");

      expect(Array.isArray(description)).toBe(true);
      expect(description.some((line) => line.includes("Gemini CLI"))).toBe(true);
    });

    it("should return codex description", () => {
      const description = getCommandTemplateDescription("codex");

      expect(Array.isArray(description)).toBe(true);
      expect(description.some((line) => line.includes("Codex CLI"))).toBe(true);
    });
  });

  describe("getCommandTemplateSystemPrompt", () => {
    it("should return claude system prompt", () => {
      const prompt = getCommandTemplateSystemPrompt("claude", "test-provider");

      expect(Array.isArray(prompt)).toBe(true);
      expect(prompt.some((line) => line.includes("TEST-PROVIDER"))).toBe(true);
      expect(prompt.some((line) => line.includes("Claude CLI"))).toBe(true);
    });

    it("should return gemini system prompt", () => {
      const prompt = getCommandTemplateSystemPrompt("gemini", "test-provider");

      expect(Array.isArray(prompt)).toBe(true);
      expect(prompt.some((line) => line.includes("YOLO mode"))).toBe(true);
    });

    it("should return codex system prompt", () => {
      const prompt = getCommandTemplateSystemPrompt("codex", "test-provider");

      expect(Array.isArray(prompt)).toBe(true);
      expect(prompt.some((line) => line.includes("full-auto"))).toBe(true);
    });
  });
});
