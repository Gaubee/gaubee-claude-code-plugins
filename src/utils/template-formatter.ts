import type { ClaudeOutput, ClaudeResultOutput } from "./json-formatter.js";
import { logger } from "./logger.js";

/**
 * Default format template for Claude output
 * Shows key information in a concise format
 */
export const DEFAULT_FORMAT_TEMPLATE = `
Status: {{status}} ({{subtype}})
{{#if session_id}}Session ID: {{session_id}}{{/if}}
Error: {{is_error}}
{{#if num_turns}}Turns: {{num_turns}}{{/if}}
{{#if duration_s}}Duration: {{duration_s}}s{{/if}}{{#if duration_api_s}} (API: {{duration_api_s}}s){{/if}}
{{#if total_cost_usd}}Cost: {{total_cost_usd}}{{/if}}
{{#if input_tokens}}Tokens: {{input_tokens}} in / {{output_tokens}} out{{/if}}
{{#if cache_read_tokens}}Cache Read: {{cache_read_tokens}}{{/if}}
{{#if result}}
Result:
{{result}}
{{/if}}
`.trim();

/**
 * Format helpers for template variables
 */
const formatHelpers = {
  duration_s: (ms: number) => (ms / 1000).toFixed(2),
  duration_api_s: (ms: number) => (ms / 1000).toFixed(2),
  status: (isError: boolean) => (isError ? "❌ Failed" : "✅ Success"),
  cost: (cost: number) => cost.toFixed(6),
  tokens: (count: number) => count.toLocaleString(),
};

/**
 * Simple template engine for formatting Claude output
 * Supports:
 * - {{variable}} - simple variable substitution
 * - {{#if variable}}...{{/if}} - conditional blocks
 */
export function renderTemplate(template: string, data: Record<string, unknown>): string {
  let result = template;

  // Handle conditional blocks: {{#if variable}}...{{/if}}
  result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, content) => {
    const value = data[key];
    // Show block if value is truthy and not empty
    if (value && (typeof value !== "string" || value.trim() !== "")) {
      return content;
    }
    return "";
  });

  // Handle simple variable substitution: {{variable}}
  result = result
    .replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const value = data[key];
      if (value === undefined || value === null) {
        return "";
      }
      return String(value);
    })
    .replace(/\n{3,}/, "\n\n");

  return result;
}

/**
 * Safely get a value with fallback
 */
function safeGet<T>(value: T | undefined | null, fallback: T): T {
  return value ?? fallback;
}

/**
 * Prepare data object for template rendering
 * Tolerant of missing fields - returns empty string for missing values
 */
export function prepareTemplateData(output: ClaudeResultOutput): Record<string, unknown> {
  const durationMs = safeGet(output.duration_ms, 0);
  const durationApiMs = safeGet(output.duration_api_ms, 0);

  return {
    // Basic info
    type: output.type || "",
    subtype: output.subtype || "unknown",
    is_error: output.is_error ? "true" : "false",
    status: output.is_error ? "❌ Failed" : "✅ Success",
    session_id: output.session_id || "",
    uuid: output.uuid || "",

    // Timing
    duration_ms: durationMs || "",
    duration_api_ms: durationApiMs || "",
    duration_s: durationMs ? formatHelpers.duration_s(durationMs) : "",
    duration_api_s: durationApiMs ? formatHelpers.duration_api_s(durationApiMs) : "",

    // Turns and cost
    num_turns: output.num_turns ?? "",
    total_cost_usd:
      output.total_cost_usd !== undefined &&
      output.total_cost_usd !== null &&
      typeof output.total_cost_usd === "number"
        ? output.total_cost_usd.toFixed(6)
        : "",

    // Token usage
    input_tokens: output.usage?.input_tokens ?? "",
    output_tokens: output.usage?.output_tokens ?? "",
    cache_read_tokens: output.usage?.cache_read_input_tokens ?? "",
    cache_creation_tokens: output.usage?.cache_creation_input_tokens ?? "",
    web_search_requests: output.usage?.server_tool_use?.web_search_requests ?? "",

    // Result
    result: output.result || "",

    // Permission denials
    permission_denials_count: output.permission_denials?.length ?? "",
  };
}

/**
 * Format Claude output using a template
 * Tolerant of missing fields - will not error on missing data
 */
export function formatWithTemplate(output: ClaudeResultOutput, template?: string): void {
  const templateStr = template || DEFAULT_FORMAT_TEMPLATE;
  const data = prepareTemplateData(output);

  try {
    const formatted = renderTemplate(templateStr, data);
    console.log(formatted);
  } catch (error) {
    logger.error("Failed to format output with template");
    console.log(JSON.stringify(output, null, 2)); // Fallback to JSON
  }
}

/**
 * Type guard to check if a message is a result message
 */
function isResultMessage(message: ClaudeOutput): boolean {
  return message.type === "result";
}

/**
 * Format a single message with template
 * Handles different message types appropriately
 */
export function formatMessageWithTemplate(message: ClaudeOutput, template?: string): void {
  if (isResultMessage(message)) {
    // Format result messages with full template
    formatWithTemplate(message as ClaudeResultOutput, template);
  } else if (message.type === "system") {
    // Format system messages with basic info
    const systemMsg = message as any;
    console.log(`[System] ${systemMsg.subtype || "init"} - Session: ${systemMsg.session_id || "N/A"}`);
    if (systemMsg.model) {
      console.log(`  Model: ${systemMsg.model}`);
    }
  } else if (message.type === "assistant") {
    // Format assistant messages with basic info
    const assistantMsg = message as any;
    const hasThinking = assistantMsg.message?.content?.some((c: any) => c.type === "thinking");
    const hasText = assistantMsg.message?.content?.some((c: any) => c.type === "text");
    const hasToolUse = assistantMsg.message?.content?.some((c: any) => c.type === "tool_use");

    const parts: string[] = [];
    if (hasThinking) parts.push("thinking");
    if (hasText) parts.push("text");
    if (hasToolUse) parts.push("tool_use");

    console.log(`[Assistant] ${parts.join(", ") || "message"}`);
  } else {
    // For other message types, output a simple notification
    console.log(`[${(message as any).type || "Unknown"}] ${(message as any).subtype || ""}`);
  }
}

/**
 * Parse and format JSON output using template
 * Handles multiple JSON objects separated by newlines
 * Formats all message types appropriately
 */
export function parseAndFormatWithTemplate(jsonString: string, template?: string): void {
  const lines = jsonString.split("\n").filter((line) => line.trim());

  for (const line of lines) {
    try {
      const output = JSON.parse(line) as ClaudeOutput;
      formatMessageWithTemplate(output, template);
    } catch (error) {
      // Skip invalid JSON lines silently
    }
  }
}
