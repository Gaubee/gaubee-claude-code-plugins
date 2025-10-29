import { inspect } from "node:util";
import { logger } from "./logger.js";

/**
 * Claude CLI JSON output structure
 */
export interface ClaudeOutput {
  type: string;
  subtype: string;
  is_error: boolean;
  duration_ms: number;
  duration_api_ms: number;
  num_turns: number;
  result: string;
  session_id: string;
  total_cost_usd: number;
  usage?: {
    input_tokens: number;
    cache_creation_input_tokens: number;
    cache_read_input_tokens: number;
    output_tokens: number;
    server_tool_use?: {
      web_search_requests: number;
    };
    service_tier?: string;
    cache_creation?: {
      ephemeral_1h_input_tokens: number;
      ephemeral_5m_input_tokens: number;
    };
  };
  modelUsage?: Record<
    string,
    {
      inputTokens: number;
      outputTokens: number;
      cacheReadInputTokens: number;
      cacheCreationInputTokens: number;
      webSearchRequests: number;
      costUSD: number;
      contextWindow: number;
    }
  >;
  permission_denials?: Array<unknown>;
  uuid?: string;
}

/**
 * Format Claude output in a pretty, human-readable way
 */
export function formatClaudeOutput(output: ClaudeOutput): void {
  // Header
  logger.section("Execution Summary");

  // Status
  const statusIcon = output.is_error ? "❌" : "✅";
  const statusText = output.is_error ? "Failed" : "Success";
  console.log(`${statusIcon} Status: ${statusText} (${output.subtype})`);

  // Session ID
  if (output.session_id) {
    console.log(`🔗 Session ID: ${logger.path(output.session_id)}`);
  }

  // Timing
  console.log(
    `⏱️  Duration: ${(output.duration_ms / 1000).toFixed(2)}s (API: ${(output.duration_api_ms / 1000).toFixed(2)}s)`
  );

  // Turns
  console.log(`🔄 Turns: ${output.num_turns}`);

  // Cost
  if (output.total_cost_usd !== undefined) {
    console.log(`💰 Cost: $${output.total_cost_usd.toFixed(6)}`);
  }

  // Token usage
  if (output.usage) {
    logger.section("Token Usage");
    console.log(`📥 Input: ${output.usage.input_tokens.toLocaleString()}`);
    console.log(`📤 Output: ${output.usage.output_tokens.toLocaleString()}`);

    if (output.usage.cache_read_input_tokens > 0) {
      console.log(
        `💾 Cache Read: ${output.usage.cache_read_input_tokens.toLocaleString()}`
      );
    }

    if (output.usage.cache_creation_input_tokens > 0) {
      console.log(
        `💾 Cache Creation: ${output.usage.cache_creation_input_tokens.toLocaleString()}`
      );
    }

    if (output.usage.server_tool_use?.web_search_requests) {
      console.log(
        `🔍 Web Searches: ${output.usage.server_tool_use.web_search_requests}`
      );
    }
  }

  // Model usage breakdown
  if (output.modelUsage && Object.keys(output.modelUsage).length > 0) {
    logger.section("Model Usage");
    for (const [model, usage] of Object.entries(output.modelUsage)) {
      console.log(`\n📊 ${logger.provider(model)}`);
      console.log(`   Input: ${usage.inputTokens.toLocaleString()}`);
      console.log(`   Output: ${usage.outputTokens.toLocaleString()}`);
      if (usage.cacheReadInputTokens > 0) {
        console.log(`   Cache Read: ${usage.cacheReadInputTokens.toLocaleString()}`);
      }
      if (usage.webSearchRequests > 0) {
        console.log(`   Web Searches: ${usage.webSearchRequests}`);
      }
      console.log(`   Cost: $${usage.costUSD.toFixed(6)}`);
      console.log(`   Context Window: ${usage.contextWindow.toLocaleString()}`);
    }
  }

  // Permission denials
  if (output.permission_denials && output.permission_denials.length > 0) {
    logger.section("Permission Denials");
    console.log(
      inspect(output.permission_denials, {
        colors: true,
        depth: 3,
        compact: false,
      })
    );
  }

  // Result
  if (output.result) {
    logger.section("Result");
    console.log(output.result);
  }

  // UUID
  if (output.uuid) {
    console.log(`\n🆔 UUID: ${output.uuid}`);
  }

  console.log(); // Empty line at the end
}

/**
 * Parse and format JSON output from Claude CLI
 */
export function parseAndFormatOutput(jsonString: string): void {
  try {
    const output = JSON.parse(jsonString) as ClaudeOutput;
    formatClaudeOutput(output);
  } catch (error) {
    logger.error("Failed to parse JSON output");
    console.log(jsonString); // Fallback to raw output
  }
}
