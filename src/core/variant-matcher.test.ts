import { describe, expect, it } from "vitest";
import {
  buildVariantPlaceholders,
  evaluateExpression,
  isVariantMatch,
  matchPattern,
  resolveVariantArgs,
  resolveVariantMatch,
} from "./variant-matcher.js";

describe("variant-matcher", () => {
  describe("isVariantMatch", () => {
    it("should identify variant match objects", () => {
      expect(isVariantMatch({ "{{log}}": { true: ["a"] } })).toBe(true);
      expect(isVariantMatch("string")).toBe(false);
      expect(isVariantMatch([])).toBe(false);
    });
  });

  describe("evaluateExpression", () => {
    it("should replace single placeholder", () => {
      const result = evaluateExpression("{{log}}", { log: "true" });
      expect(result).toBe("true");
    });

    it("should replace multiple placeholders", () => {
      const result = evaluateExpression("{{log}}+{{prettyJson}}", {
        log: "true",
        prettyJson: "false",
      });
      expect(result).toBe("true+false");
    });

    it("should handle missing placeholders", () => {
      const result = evaluateExpression("{{log}}+{{missing}}", { log: "true" });
      expect(result).toBe("true+{{missing}}");
    });

    it("should handle complex expressions", () => {
      const result = evaluateExpression("{{a}}-{{b}}-{{c}}", {
        a: "1",
        b: "2",
        c: "3",
      });
      expect(result).toBe("1-2-3");
    });
  });

  describe("matchPattern", () => {
    it("should match exact values", () => {
      expect(matchPattern("true", "true")).toBe(true);
      expect(matchPattern("false", "true")).toBe(false);
    });

    it("should match wildcard", () => {
      expect(matchPattern("anything", "*")).toBe(true);
      expect(matchPattern("something", "*")).toBe(true);
    });

    it("should match brace expansion", () => {
      expect(matchPattern("true", "{true,false}")).toBe(true);
      expect(matchPattern("false", "{true,false}")).toBe(true);
      expect(matchPattern("null", "{true,false}")).toBe(false);
    });

    it("should match glob patterns", () => {
      expect(matchPattern("true+false", "true+*")).toBe(true);
      expect(matchPattern("false+true", "true+*")).toBe(false);
      expect(matchPattern("true+false+null", "*+*+*")).toBe(true);
    });

    it("should match complex patterns", () => {
      expect(matchPattern("undefined", "{undefined,null}")).toBe(true);
      expect(matchPattern("null", "{undefined,null}")).toBe(true);
      expect(matchPattern("false", "{undefined,null}")).toBe(false);
    });
  });

  describe("resolveVariantMatch", () => {
    it("should resolve simple match", () => {
      const variantMatch = {
        "{{log}}": {
          true: ["stream-json"],
          false: ["json"],
        },
      };

      expect(resolveVariantMatch(variantMatch, { log: "true" })).toEqual(["stream-json"]);
      expect(resolveVariantMatch(variantMatch, { log: "false" })).toEqual(["json"]);
    });

    it("should resolve with wildcard fallback", () => {
      const variantMatch = {
        "{{log}}": {
          true: ["stream-json"],
          "*": ["json"],
        },
      };

      expect(resolveVariantMatch(variantMatch, { log: "true" })).toEqual(["stream-json"]);
      expect(resolveVariantMatch(variantMatch, { log: "false" })).toEqual(["json"]);
      expect(resolveVariantMatch(variantMatch, { log: "anything" })).toEqual(["json"]);
    });

    it("should resolve complex expression", () => {
      const variantMatch = {
        "{{log}}+{{prettyJson}}": {
          "true+true": ["stream-json", "--verbose"],
          "false+false": ["json"],
          "*": ["json"],
        },
      };

      expect(resolveVariantMatch(variantMatch, { log: "true", prettyJson: "true" })).toEqual([
        "stream-json",
        "--verbose",
      ]);
      expect(resolveVariantMatch(variantMatch, { log: "false", prettyJson: "false" })).toEqual([
        "json",
      ]);
      expect(resolveVariantMatch(variantMatch, { log: "true", prettyJson: "false" })).toEqual([
        "json",
      ]);
    });

    it("should return empty array if no match", () => {
      const variantMatch = {
        "{{log}}": {
          true: ["stream-json"],
        },
      };

      expect(resolveVariantMatch(variantMatch, { log: "false" })).toEqual([]);
    });

    it("should handle brace expansion patterns", () => {
      const variantMatch = {
        "{{somestr}}": {
          "{true,false}": ["ABC"],
          null: ["aa"],
        },
      };

      expect(resolveVariantMatch(variantMatch, { somestr: "true" })).toEqual(["ABC"]);
      expect(resolveVariantMatch(variantMatch, { somestr: "false" })).toEqual(["ABC"]);
      expect(resolveVariantMatch(variantMatch, { somestr: "null" })).toEqual(["aa"]);
    });
  });

  describe("resolveVariantArgs", () => {
    it("should resolve mixed args", () => {
      const args = [
        "--settings",
        "{{SETTINGS_PATH}}",
        {
          "{{log}}": {
            true: ["--verbose"],
            false: [],
          },
        },
        "-p",
        "{{TASK}}",
      ];

      const result = resolveVariantArgs(args, { log: "true" });

      expect(result).toEqual(["--settings", "{{SETTINGS_PATH}}", "--verbose", "-p", "{{TASK}}"]);
    });

    it("should handle multiple variant matches", () => {
      const args = [
        {
          "{{log}}": {
            true: ["--log"],
            false: [],
          },
        },
        {
          "{{prettyJson}}": {
            true: ["--pretty"],
            false: [],
          },
        },
      ];

      const result = resolveVariantArgs(args, { log: "true", prettyJson: "false" });

      expect(result).toEqual(["--log"]);
    });

    it("should flatten nested arrays", () => {
      const args = [
        "--base",
        {
          "{{log}}": {
            true: ["--verbose", "--debug"],
            false: [],
          },
        },
        "--end",
      ];

      const result = resolveVariantArgs(args, { log: "true" });

      expect(result).toEqual(["--base", "--verbose", "--debug", "--end"]);
    });
  });

  describe("buildVariantPlaceholders", () => {
    it("should build placeholders from command and options", () => {
      const commandPlaceholders = {
        SETTINGS_PATH: "/path/to/settings",
        SYSTEM_PROMPT: "prompt",
        TASK: "task",
      };

      const options = {
        log: true,
        prettyJson: false,
        sessionId: "abc-123",
      };

      const result = buildVariantPlaceholders(commandPlaceholders, options);

      expect(result).toEqual({
        SETTINGS_PATH: "/path/to/settings",
        SYSTEM_PROMPT: "prompt",
        TASK: "task",
        log: "true",
        prettyJson: "false",
        sessionId: "abc-123",
        taskType: "undefined",
      });
    });

    it("should handle undefined options", () => {
      const commandPlaceholders = {
        SETTINGS_PATH: "/path/to/settings",
        SYSTEM_PROMPT: "prompt",
        TASK: "task",
      };

      const result = buildVariantPlaceholders(commandPlaceholders, {});

      expect(result).toEqual({
        SETTINGS_PATH: "/path/to/settings",
        SYSTEM_PROMPT: "prompt",
        TASK: "task",
        log: "false",
        prettyJson: "false",
        sessionId: "undefined",
        taskType: "undefined",
      });
    });
  });
});
