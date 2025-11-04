import type { CommandArg, VariantMatch } from "@/types/index.js";
import type { CommandPlaceholders } from "./command-executor.js";
import { minimatch } from "minimatch";

/**
 * Check if an argument is a variant match object
 */
export function isVariantMatch(arg: CommandArg): arg is VariantMatch {
  return typeof arg === "object" && !Array.isArray(arg);
}

/**
 * Evaluate expression by replacing placeholders
 *
 * Example:
 * - expression: "{{log}}+{{prettyJson}}"
 * - placeholders: { log: "true", prettyJson: "false" }
 * - result: "true+false"
 */
export function evaluateExpression(
  expression: string,
  placeholders: Record<string, string>
): string {
  let result = expression;

  // Replace all {{placeholder}} with actual values
  for (const [key, value] of Object.entries(placeholders)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    result = result.replace(pattern, String(value));
  }

  return result;
}

/**
 * Match a value against a pattern using minimatch
 *
 * Supports all standard glob patterns including:
 * - Exact match: "true"
 * - Wildcard: "*"
 * - Brace expansion: "{true,false}"
 * - Glob patterns: "true+*", "**", etc.
 *
 * See: https://github.com/isaacs/minimatch
 */
export function matchPattern(value: string, pattern: string): boolean {
  return minimatch(value, pattern);
}

/**
 * Resolve variant match to array of strings
 *
 * Process:
 * 1. Evaluate expression to get actual value
 * 2. Find matching pattern
 * 3. Return corresponding args array
 * 4. If no match found, return empty array
 */
export function resolveVariantMatch(
  variantMatch: VariantMatch,
  placeholders: Record<string, string>
): string[] {
  // Get the first (and should be only) expression
  const [expression, patterns] = Object.entries(variantMatch)[0];

  if (!expression || !patterns) {
    return [];
  }

  // Evaluate expression
  const actualValue = evaluateExpression(expression, placeholders);

  // Find matching pattern
  for (const [pattern, args] of Object.entries(patterns)) {
    if (matchPattern(actualValue, pattern)) {
      return args;
    }
  }

  // No match found, return empty array (equivalent to "*": [])
  return [];
}

/**
 * Resolve all variant matches in args array
 *
 * Converts Array<string | VariantMatch> to Array<string>
 */
export function resolveVariantArgs(
  args: CommandArg[],
  placeholders: Record<string, string>
): string[] {
  const result: string[] = [];

  for (const arg of args) {
    if (isVariantMatch(arg)) {
      // Resolve variant match and flatten into result
      const resolved = resolveVariantMatch(arg, placeholders);
      result.push(...resolved);
    } else {
      // Keep string as-is
      result.push(arg);
    }
  }

  return result;
}

/**
 * Build placeholders from CommandPlaceholders and ExecuteOptions
 */
export function buildVariantPlaceholders(
  commandPlaceholders: CommandPlaceholders,
  options: {
    log?: boolean;
    prettyJson?: boolean;
    sessionId?: string;
    taskType?: string;
    [key: string]: unknown;
  }
): Record<string, string> {
  return {
    // Command placeholders
    SETTINGS_PATH: commandPlaceholders.SETTINGS_PATH,
    SYSTEM_PROMPT: commandPlaceholders.SYSTEM_PROMPT,
    PROMPT: commandPlaceholders.PROMPT,
    INPUT: commandPlaceholders.INPUT,
    TASK: commandPlaceholders.TASK, // Deprecated: kept for backward compatibility

    // Options as strings
    log: String(options.log ?? false),
    prettyJson: String(options.prettyJson ?? false),
    sessionId: options.sessionId ?? "undefined",
    taskType: options.taskType ?? "undefined",

    // Add any custom placeholders
    ...Object.fromEntries(
      Object.entries(commandPlaceholders).filter(
        ([key]) =>
          !["SETTINGS_PATH", "SYSTEM_PROMPT", "PROMPT", "INPUT", "TASK"].includes(key)
      )
    ),
  };
}
