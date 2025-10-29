import type { ClaudeOutput } from "./json-formatter.js";
import { logger } from "./logger.js";

/**
 * Default format template for Claude output
 */
export const DEFAULT_FORMAT_TEMPLATE = `
Status: {{status}} ({{subtype}})
Session ID: {{session_id}}
Error: {{is_error}}
Turns: {{num_turns}}
Duration: {{duration_s}}s (API: {{duration_api_s}}s)
Cost: ${{total_cost_usd}}
Tokens: {{input_tokens}} in / {{output_tokens}} out
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
  result = result.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = data[key];
    if (value === undefined || value === null) {
      return "";
    }
    return String(value);
  });

  return result;
}

/**
 * Prepare data object for template rendering
 */
export function prepareTemplateData(output: ClaudeOutput): Record<string, unknown> {
  return {
    // Basic info
    type: output.type,
    subtype: output.subtype,
    is_error: output.is_error ? "true" : "false",
    status: output.is_error ? "❌ Failed" : "✅ Success",
    session_id: output.session_id || "",
    uuid: output.uuid || "",

    // Timing
    duration_ms: output.duration_ms,
    duration_api_ms: output.duration_api_ms,
    duration_s: formatHelpers.duration_s(output.duration_ms),
    duration_api_s: formatHelpers.duration_api_s(output.duration_api_ms),

    // Turns and cost
    num_turns: output.num_turns,
    total_cost_usd: output.total_cost_usd?.toFixed(6) || "0.000000",

    // Token usage
    input_tokens: output.usage?.input_tokens || 0,
    output_tokens: output.usage?.output_tokens || 0,
    cache_read_tokens: output.usage?.cache_read_input_tokens || 0,
    cache_creation_tokens: output.usage?.cache_creation_input_tokens || 0,
    web_search_requests: output.usage?.server_tool_use?.web_search_requests || 0,

    // Result
    result: output.result || "",

    // Permission denials
    permission_denials_count: output.permission_denials?.length || 0,
  };
}

/**
 * Format Claude output using a template
 */
export function formatWithTemplate(output: ClaudeOutput, template?: string): void {
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
 * Parse and format JSON output using template
 */
export function parseAndFormatWithTemplate(jsonString: string, template?: string): void {
  try {
    const output = JSON.parse(jsonString) as ClaudeOutput;
    formatWithTemplate(output, template);
  } catch (error) {
    logger.error("Failed to parse JSON output");
    console.log(jsonString); // Fallback to raw output
  }
}
