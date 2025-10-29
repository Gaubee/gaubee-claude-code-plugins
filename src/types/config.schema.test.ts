import { describe, expect, it } from "vitest";
import {
  ExecuteOptionsSchema,
  PromptMergeOptionsSchema,
  ProviderCcaiConfigSchema,
  ProviderSettingsSchema,
  TaskTypeSchema,
} from "./config.schema";

describe("ProviderCcaiConfigSchema", () => {
  it("should validate a valid config", () => {
    const validConfig = {
      name: "GLM",
      description: "GLM provider",
      systemPrompt: "You are GLM",
      disabled: false,
    };

    const result = ProviderCcaiConfigSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  it("should validate config with minimal fields", () => {
    const minimalConfig = {};

    const result = ProviderCcaiConfigSchema.safeParse(minimalConfig);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.disabled).toBe(false); // Default value
    }
  });

  it("should reject invalid disabled type", () => {
    const invalidConfig = {
      disabled: "not-a-boolean",
    };

    const result = ProviderCcaiConfigSchema.safeParse(invalidConfig);
    expect(result.success).toBe(false);
  });
});

describe("ProviderSettingsSchema", () => {
  it("should validate valid provider settings", () => {
    const validSettings = {
      ccai: {
        name: "GLM",
        description: "GLM provider",
        disabled: false,
      },
      env: {
        ANTHROPIC_AUTH_TOKEN: "test-token",
        ANTHROPIC_BASE_URL: "https://api.test.com",
      },
    };

    const result = ProviderSettingsSchema.safeParse(validSettings);
    expect(result.success).toBe(true);
  });

  it("should reject settings without ccai field", () => {
    const invalidSettings = {
      env: {
        ANTHROPIC_AUTH_TOKEN: "test-token",
      },
    };

    const result = ProviderSettingsSchema.safeParse(invalidSettings);
    expect(result.success).toBe(false);
  });

  it("should reject settings without env field", () => {
    const invalidSettings = {
      ccai: {
        name: "GLM",
      },
    };

    const result = ProviderSettingsSchema.safeParse(invalidSettings);
    expect(result.success).toBe(false);
  });

  it("should validate env as record of strings", () => {
    const validSettings = {
      ccai: {},
      env: {
        KEY1: "value1",
        KEY2: "value2",
        KEY3: "value3",
      },
    };

    const result = ProviderSettingsSchema.safeParse(validSettings);
    expect(result.success).toBe(true);
  });
});

describe("TaskTypeSchema", () => {
  it("should validate valid task types", () => {
    const validTypes = [
      "web-scraping",
      "code-generation",
      "data-processing",
      "code-analysis",
      "documentation-research",
      "visual-inspection",
    ];

    validTypes.forEach((type) => {
      const result = TaskTypeSchema.safeParse(type);
      expect(result.success).toBe(true);
    });
  });

  it("should reject invalid task type", () => {
    const result = TaskTypeSchema.safeParse("invalid-type");
    expect(result.success).toBe(false);
  });

  it("should reject non-string values", () => {
    const result = TaskTypeSchema.safeParse(123);
    expect(result.success).toBe(false);
  });
});

describe("PromptMergeOptionsSchema", () => {
  it("should validate options with required provider field", () => {
    const validOptions = {
      provider: "glm",
    };

    const result = PromptMergeOptionsSchema.safeParse(validOptions);
    expect(result.success).toBe(true);
  });

  it("should validate options with all fields", () => {
    const validOptions = {
      provider: "glm",
      taskType: "web-scraping",
      customPrompts: ["Custom prompt 1", "Custom prompt 2"],
    };

    const result = PromptMergeOptionsSchema.safeParse(validOptions);
    expect(result.success).toBe(true);
  });

  it("should reject options without provider", () => {
    const invalidOptions = {
      taskType: "web-scraping",
    };

    const result = PromptMergeOptionsSchema.safeParse(invalidOptions);
    expect(result.success).toBe(false);
  });

  it("should reject invalid task type", () => {
    const invalidOptions = {
      provider: "glm",
      taskType: "invalid-task-type",
    };

    const result = PromptMergeOptionsSchema.safeParse(invalidOptions);
    expect(result.success).toBe(false);
  });
});

describe("ExecuteOptionsSchema", () => {
  it("should validate empty options", () => {
    const emptyOptions = {};

    const result = ExecuteOptionsSchema.safeParse(emptyOptions);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.skipLog).toBeUndefined(); // No default value
    }
  });

  it("should validate options with taskType", () => {
    const validOptions = {
      taskType: "code-generation",
    };

    const result = ExecuteOptionsSchema.safeParse(validOptions);
    expect(result.success).toBe(true);
  });

  it("should validate options with skipLog", () => {
    const validOptions = {
      skipLog: true,
    };

    const result = ExecuteOptionsSchema.safeParse(validOptions);
    expect(result.success).toBe(true);
  });

  it("should validate options with all fields", () => {
    const validOptions = {
      taskType: "data-processing",
      skipLog: true,
    };

    const result = ExecuteOptionsSchema.safeParse(validOptions);
    expect(result.success).toBe(true);
  });

  it("should reject invalid skipLog type", () => {
    const invalidOptions = {
      skipLog: "not-a-boolean",
    };

    const result = ExecuteOptionsSchema.safeParse(invalidOptions);
    expect(result.success).toBe(false);
  });
});
