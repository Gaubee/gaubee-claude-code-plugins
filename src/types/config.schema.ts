import { z } from "zod";

/**
 * Variant match object for conditional arguments
 *
 * Example:
 * {
 *   "{{log}}+{{prettyJson}}": {
 *     "true+true": ["stream-json"],
 *     "false+false": ["json"],
 *     "*": ["json"]
 *   }
 * }
 */
export const VariantMatchSchema = z.record(
  z.string(), // expression like "{{log}}+{{prettyJson}}"
  z.record(
    z.string(), // pattern like "true+true", "*", "{true|false}"
    z.array(z.string()) // resulting args
  )
);

export type VariantMatch = z.infer<typeof VariantMatchSchema>;

/**
 * Command argument can be either a string or a variant match object
 */
export const CommandArgSchema = z.union([z.string(), VariantMatchSchema]);

export type CommandArg = z.infer<typeof CommandArgSchema>;

/**
 * Custom command configuration for non-Claude CLI providers
 */
export const CustomCommandSchema = z.object({
  executable: z.string(),
  args: z.array(CommandArgSchema).optional(),
});

export type CustomCommand = z.infer<typeof CustomCommandSchema>;

/**
 * Provider CCAI metadata configuration
 */
export const ProviderCcaiConfigSchema = z.looseObject({
  name: z.string().optional(),
  description: z.union([z.string(), z.array(z.string())]).optional(),
  systemPrompt: z.union([z.string(), z.array(z.string())]).optional(),
  disabled: z.boolean().optional().default(false),

  // Custom command configuration (for non-Claude CLI providers)
  command: CustomCommandSchema.optional(),

  // Input/Output schemas for documentation and validation
  inputSchema: z.record(z.string(), z.unknown()).optional(),
  outputSchema: z.record(z.string(), z.unknown()).optional(),
});

export type ProviderCcaiConfig = z.infer<typeof ProviderCcaiConfigSchema>;

/**
 * Provider settings configuration
 */
export const ProviderSettingsSchema = z.looseObject({
  ccai: ProviderCcaiConfigSchema,
  env: z.record(z.string(), z.unknown()),
});

export type ProviderSettings = z.infer<typeof ProviderSettingsSchema>;

/**
 * Task types for prompt enhancement
 */
export const TaskTypeSchema = z.enum([
  "web-scraping",
  "code-generation",
  "data-processing",
  "code-analysis",
  "documentation-research",
  "visual-inspection",
]);

export type TaskType = z.infer<typeof TaskTypeSchema>;

/**
 * Prompt merge options
 */
export const PromptMergeOptionsSchema = z.object({
  provider: z.string(),
  taskType: TaskTypeSchema.optional(),
  customPrompts: z.array(z.string()).optional(),
  planOnly: z.boolean().optional(),
});

export type PromptMergeOptions = z.infer<typeof PromptMergeOptionsSchema>;

/**
 * Print command output format
 */
export const PrintCommandFormatSchema = z.enum(["text", "json", "bash", "ps"]);
export type PrintCommandFormat = z.infer<typeof PrintCommandFormatSchema>;

/**
 * Provider execution options
 */
export const ExecuteOptionsSchema = z
  .object({
    input: z.string().optional(),
    taskType: TaskTypeSchema.optional(),
    skipLog: z.boolean().optional(),
    sessionId: z.string().optional(),
    planOnly: z.boolean().optional(),
    log: z.boolean().optional(),
    prettyJson: z.boolean().optional(),
    format: z.string().optional(),
    printCommand: z.union([z.boolean(), PrintCommandFormatSchema]).optional(),
  })
  .optional()
  .default({});

export type ExecuteOptions = z.infer<typeof ExecuteOptionsSchema>;
