import { logger } from "@/utils/logger.js";

/**
 * JSON Schema type definition
 */
export interface JsonSchema {
  type?: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  enum?: unknown[];
  description?: string;
  [key: string]: unknown;
}

/**
 * Format JSON Schema as readable Markdown
 */
export function formatSchemaAsMarkdown(schema: JsonSchema, indent = 0): string {
  const lines: string[] = [];
  const prefix = "  ".repeat(indent);

  if (schema.description) {
    lines.push(`${prefix}${schema.description}`);
    lines.push("");
  }

  if (schema.type === "object" && schema.properties) {
    lines.push(`${prefix}**Properties:**`);
    lines.push("");

    for (const [key, propSchema] of Object.entries(schema.properties)) {
      const required = schema.required?.includes(key) ? " (required)" : " (optional)";
      const type = propSchema.type || "any";
      const desc = propSchema.description || "";

      lines.push(`${prefix}- \`${key}\`${required}: ${type}`);
      if (desc) {
        lines.push(`${prefix}  ${desc}`);
      }

      // Handle nested objects
      if (propSchema.type === "object" && propSchema.properties) {
        lines.push("");
        lines.push(formatSchemaAsMarkdown(propSchema, indent + 1));
      }

      // Handle arrays
      if (propSchema.type === "array" && propSchema.items) {
        lines.push(`${prefix}  Items:`);
        lines.push(formatSchemaAsMarkdown(propSchema.items, indent + 2));
      }

      // Handle enums
      if (propSchema.enum) {
        lines.push(`${prefix}  Allowed values: ${propSchema.enum.map((v) => `\`${v}\``).join(", ")}`);
      }

      lines.push("");
    }
  } else if (schema.type === "array" && schema.items) {
    lines.push(`${prefix}**Array items:**`);
    lines.push("");
    lines.push(formatSchemaAsMarkdown(schema.items, indent + 1));
  } else if (schema.enum) {
    lines.push(`${prefix}**Allowed values:** ${schema.enum.map((v) => `\`${v}\``).join(", ")}`);
  }

  return lines.join("\n");
}

/**
 * Inject input and output schemas into system prompt
 */
export function injectSchemaToPrompt(
  basePrompt: string,
  inputSchema?: Record<string, unknown>,
  outputSchema?: Record<string, unknown>
): string {
  const sections: string[] = [basePrompt];

  if (inputSchema) {
    sections.push(`
## Input Schema

The input to this task should follow this schema:

${formatSchemaAsMarkdown(inputSchema as JsonSchema)}
`);
  }

  if (outputSchema) {
    sections.push(`
## Output Schema

Your output should follow this schema:

${formatSchemaAsMarkdown(outputSchema as JsonSchema)}

**Important:** Please ensure your response adheres to this schema structure. If you cannot provide a field, use \`null\` or an appropriate default value.
`);
  }

  return sections.join("\n\n---\n");
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate output against schema (basic validation)
 */
export function validateOutput(output: unknown, schema: JsonSchema): ValidationResult {
  const errors: string[] = [];

  // Basic type checking
  if (schema.type) {
    const actualType = Array.isArray(output) ? "array" : typeof output;
    if (actualType !== schema.type) {
      errors.push(`Expected type '${schema.type}', got '${actualType}'`);
      return { valid: false, errors };
    }
  }

  // Object validation
  if (schema.type === "object" && typeof output === "object" && output !== null) {
    const obj = output as Record<string, unknown>;

    // Check required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in obj)) {
          errors.push(`Missing required field: '${field}'`);
        }
      }
    }

    // Validate properties
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in obj) {
          const propResult = validateOutput(obj[key], propSchema);
          if (!propResult.valid) {
            errors.push(...propResult.errors.map((err) => `${key}: ${err}`));
          }
        }
      }
    }
  }

  // Array validation
  if (schema.type === "array" && Array.isArray(output)) {
    if (schema.items) {
      for (let i = 0; i < output.length; i++) {
        const itemResult = validateOutput(output[i], schema.items);
        if (!itemResult.valid) {
          errors.push(...itemResult.errors.map((err) => `[${i}]: ${err}`));
        }
      }
    }
  }

  // Enum validation
  if (schema.enum && !schema.enum.includes(output)) {
    errors.push(`Value '${output}' is not in allowed values: ${schema.enum.join(", ")}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Extract JSON from AI output (handles markdown code blocks)
 */
export function extractJsonFromOutput(output: string): unknown {
  // Try to parse as-is first
  try {
    return JSON.parse(output);
  } catch {
    // Try to extract from markdown code block
    const jsonBlockMatch = output.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      try {
        return JSON.parse(jsonBlockMatch[1]);
      } catch {
        // Fall through
      }
    }

    // Try to extract any JSON-like structure
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // Fall through
      }
    }

    throw new Error("Could not extract valid JSON from output");
  }
}

/**
 * Validate AI output and log warnings if validation fails
 */
export function validateAndWarn(
  output: string,
  schema: JsonSchema,
  provider: string
): ValidationResult {
  try {
    const json = extractJsonFromOutput(output);
    const result = validateOutput(json, schema);

    if (!result.valid) {
      logger.warning(`Output validation failed for provider ${logger.provider(provider)}:`);
      for (const error of result.errors) {
        logger.warning(`  - ${error}`);
      }
      logger.info("Continuing execution despite validation errors...");
    }

    return result;
  } catch (error) {
    logger.warning(
      `Failed to parse output as JSON for provider ${logger.provider(provider)}: ${error instanceof Error ? error.message : String(error)}`
    );
    logger.info("Continuing execution despite parsing errors...");
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}
