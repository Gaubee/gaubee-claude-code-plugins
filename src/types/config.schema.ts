import { z } from "zod";

/**
 * Provider CCAI metadata configuration
 */
export const ProviderCcaiConfigSchema = z.looseObject({
  name: z.string().optional(),
  description: z.string().optional(),
  systemPrompt: z.string().optional(),
  disabled: z.boolean().optional().default(false),
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
