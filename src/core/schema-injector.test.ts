import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock logger - must be before imports
vi.mock("@/utils/logger.js", () => ({
  logger: {
    warn: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    provider: vi.fn((name: string) => name),
  },
}));

import {
  extractJsonFromOutput,
  formatSchemaAsMarkdown,
  injectSchemaToPrompt,
  type JsonSchema,
  validateAndWarn,
  validateOutput,
} from "./schema-injector.js";

describe("schema-injector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("formatSchemaAsMarkdown", () => {
    it("should format simple object schema", () => {
      const schema: JsonSchema = {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "User name",
          },
          age: {
            type: "number",
            description: "User age",
          },
        },
        required: ["name"],
      };

      const result = formatSchemaAsMarkdown(schema);

      expect(result).toContain("**Properties:**");
      expect(result).toContain("`name` (required): string");
      expect(result).toContain("User name");
      expect(result).toContain("`age` (optional): number");
      expect(result).toContain("User age");
    });

    it("should format nested object schema", () => {
      const schema: JsonSchema = {
        type: "object",
        properties: {
          user: {
            type: "object",
            properties: {
              name: { type: "string" },
              email: { type: "string" },
            },
          },
        },
      };

      const result = formatSchemaAsMarkdown(schema);

      expect(result).toContain("`user`");
      expect(result).toContain("`name`");
      expect(result).toContain("`email`");
    });

    it("should format array schema", () => {
      const schema: JsonSchema = {
        type: "array",
        items: {
          type: "string",
        },
      };

      const result = formatSchemaAsMarkdown(schema);

      expect(result).toContain("**Array items:**");
    });

    it("should format enum values", () => {
      const schema: JsonSchema = {
        type: "string",
        enum: ["success", "error", "pending"],
      };

      const result = formatSchemaAsMarkdown(schema);

      expect(result).toContain("**Allowed values:**");
      expect(result).toContain("`success`");
      expect(result).toContain("`error`");
      expect(result).toContain("`pending`");
    });
  });

  describe("injectSchemaToPrompt", () => {
    it("should inject input schema only", () => {
      const basePrompt = "Base prompt";
      const inputSchema = {
        type: "object",
        properties: {
          task: { type: "string" },
        },
      };

      const result = injectSchemaToPrompt(basePrompt, inputSchema);

      expect(result).toContain("Base prompt");
      expect(result).toContain("## Input Schema");
      expect(result).toContain("`task`");
      expect(result).not.toContain("## Output Schema");
    });

    it("should inject output schema only", () => {
      const basePrompt = "Base prompt";
      const outputSchema = {
        type: "object",
        properties: {
          result: { type: "string" },
        },
      };

      const result = injectSchemaToPrompt(basePrompt, undefined, outputSchema);

      expect(result).toContain("Base prompt");
      expect(result).toContain("## Output Schema");
      expect(result).toContain("`result`");
      expect(result).not.toContain("## Input Schema");
    });

    it("should inject both schemas", () => {
      const basePrompt = "Base prompt";
      const inputSchema = {
        type: "object",
        properties: {
          task: { type: "string" },
        },
      };
      const outputSchema = {
        type: "object",
        properties: {
          result: { type: "string" },
        },
      };

      const result = injectSchemaToPrompt(basePrompt, inputSchema, outputSchema);

      expect(result).toContain("Base prompt");
      expect(result).toContain("## Input Schema");
      expect(result).toContain("## Output Schema");
      expect(result).toContain("`task`");
      expect(result).toContain("`result`");
    });

    it("should not inject anything if no schemas provided", () => {
      const basePrompt = "Base prompt";

      const result = injectSchemaToPrompt(basePrompt);

      expect(result).toBe(basePrompt);
    });
  });

  describe("validateOutput", () => {
    it("should validate correct object", () => {
      const schema: JsonSchema = {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
        required: ["name"],
      };

      const output = {
        name: "John",
        age: 30,
      };

      const result = validateOutput(output, schema);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect missing required field", () => {
      const schema: JsonSchema = {
        type: "object",
        properties: {
          name: { type: "string" },
        },
        required: ["name"],
      };

      const output = {};

      const result = validateOutput(output, schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Missing required field: 'name'");
    });

    it("should detect type mismatch", () => {
      const schema: JsonSchema = {
        type: "string",
      };

      const output = 123;

      const result = validateOutput(output, schema);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("Expected type 'string'");
    });

    it("should validate enum values", () => {
      const schema: JsonSchema = {
        type: "string",
        enum: ["success", "error"],
      };

      const validOutput = "success";
      const invalidOutput = "pending";

      expect(validateOutput(validOutput, schema).valid).toBe(true);
      expect(validateOutput(invalidOutput, schema).valid).toBe(false);
    });

    it("should validate array items", () => {
      const schema: JsonSchema = {
        type: "array",
        items: {
          type: "string",
        },
      };

      const validOutput = ["a", "b", "c"];
      const invalidOutput = ["a", 123, "c"];

      const validResult = validateOutput(validOutput, schema);
      const invalidResult = validateOutput(invalidOutput, schema);

      expect(validResult.valid).toBe(true);
      // Note: Our basic validation checks array type but doesn't deeply validate item types
      // This is intentional for the "warn but continue" approach
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe("extractJsonFromOutput", () => {
    it("should parse plain JSON", () => {
      const output = '{"result": "success"}';

      const result = extractJsonFromOutput(output);

      expect(result).toEqual({ result: "success" });
    });

    it("should extract JSON from markdown code block", () => {
      const output = `
Some text before

\`\`\`json
{
  "result": "success",
  "status": "ok"
}
\`\`\`

Some text after
      `;

      const result = extractJsonFromOutput(output);

      expect(result).toEqual({ result: "success", status: "ok" });
    });

    it("should extract JSON from mixed content", () => {
      const output = `
Here is the result:

{"result": "success", "count": 42}

That's all!
      `;

      const result = extractJsonFromOutput(output);

      expect(result).toEqual({ result: "success", count: 42 });
    });

    it("should throw error if no JSON found", () => {
      const output = "No JSON here";

      expect(() => extractJsonFromOutput(output)).toThrow("Could not extract valid JSON");
    });
  });

  describe("validateAndWarn", () => {
    it("should validate correct JSON output", () => {
      const output = '{"result": "success"}';
      const schema: JsonSchema = {
        type: "object",
        properties: {
          result: { type: "string" },
        },
        required: ["result"],
      };

      const result = validateAndWarn(output, schema, "test-provider");

      expect(result.valid).toBe(true);
    });

    it("should return invalid for incorrect JSON output", () => {
      const output = '{"result": 123}';
      const schema: JsonSchema = {
        type: "object",
        properties: {
          result: { type: "string" },
        },
        required: ["result"],
      };

      const result = validateAndWarn(output, schema, "test-provider");

      expect(result.valid).toBe(false);
    });

    it("should handle non-JSON output gracefully", () => {
      const output = "Not JSON at all";
      const schema: JsonSchema = {
        type: "object",
      };

      const result = validateAndWarn(output, schema, "test-provider");

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
