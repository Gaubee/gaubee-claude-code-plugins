import type { SDKMessage, SDKResultMessage } from "@anthropic-ai/claude-agent-sdk";
import { inspect } from "node:util";
import { logger } from "./logger.js";

/**
 * Pretty print a JSON object using util.inspect
 */
export function prettyPrintJson(json: unknown): void {
  console.log(
    inspect(json, {
      colors: true,
      depth: null,
      compact: false,
      breakLength: 80,
    })
  );
}

/**
 * Claude CLI JSON output structure
 * Using SDKMessage from @anthropic-ai/claude-agent-sdk
 * For formatting purposes, we primarily work with SDKResultMessage which contains
 * the execution results and usage statistics
 */
export type ClaudeOutput = SDKMessage;

/**
 * Extended result output type that includes all possible fields from both
 * success and error result messages. All fields are optional for flexible formatting.
 */
export type ClaudeResultOutput = {
  uuid?: string;
  session_id?: string;
  type?: "result";
  subtype?: "success" | "error_max_turns" | "error_during_execution";
  duration_ms?: number;
  duration_api_ms?: number;
  is_error?: boolean;
  num_turns?: number;
  result?: string; // Only present in success subtype
  total_cost_usd?: number;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
    server_tool_use?: {
      web_search_requests?: number;
    };
  };
  modelUsage?: {
    [modelName: string]: {
      inputTokens?: number;
      outputTokens?: number;
      cacheReadInputTokens?: number;
      cacheCreationInputTokens?: number;
      webSearchRequests?: number;
      costUSD?: number;
      contextWindow?: number;
    };
  };
  permission_denials?: Array<{
    tool_name: string;
    tool_use_id: string;
    tool_input: Record<string, unknown>;
  }>;
};

/**
 * Safely get a value with fallback
 */
function safeGet<T>(value: T | undefined | null, fallback: T): T {
  return value ?? fallback;
}

/**
 * Format Claude output in a pretty, human-readable way
 * Tolerant of missing fields
 */
export function formatClaudeOutput(output: ClaudeResultOutput): void {
  // Header
  logger.section("Execution Summary");

  // Status
  const isError = safeGet(output.is_error, false);
  const statusIcon = isError ? "❌" : "✅";
  const statusText = isError ? "Failed" : "Success";
  const subtype = safeGet(output.subtype, "unknown");
  console.log(`${statusIcon} Status: ${statusText} (${subtype})`);

  // Session ID
  if (output.session_id) {
    console.log(`🔗 Session ID: ${logger.path(output.session_id)}`);
  }

  // Timing
  const durationMs = safeGet(output.duration_ms, 0);
  const durationApiMs = safeGet(output.duration_api_ms, 0);
  if (durationMs > 0 || durationApiMs > 0) {
    console.log(
      `⏱️  Duration: ${(durationMs / 1000).toFixed(2)}s (API: ${(durationApiMs / 1000).toFixed(2)}s)`
    );
  }

  // Turns
  const numTurns = safeGet(output.num_turns, 0);
  if (numTurns > 0) {
    console.log(`🔄 Turns: ${numTurns}`);
  }

  // Cost
  const totalCost = output.total_cost_usd;
  if (totalCost !== undefined && totalCost !== null && typeof totalCost === "number") {
    console.log(`💰 Cost: $${totalCost.toFixed(6)}`);
  }

  // Token usage
  if (output.usage) {
    logger.section("Token Usage");
    const inputTokens = safeGet(output.usage.input_tokens, 0);
    const outputTokens = safeGet(output.usage.output_tokens, 0);
    console.log(`📥 Input: ${inputTokens.toLocaleString()}`);
    console.log(`📤 Output: ${outputTokens.toLocaleString()}`);

    const cacheRead = safeGet(output.usage.cache_read_input_tokens, 0);
    if (cacheRead > 0) {
      console.log(`💾 Cache Read: ${cacheRead.toLocaleString()}`);
    }

    const cacheCreation = safeGet(output.usage.cache_creation_input_tokens, 0);
    if (cacheCreation > 0) {
      console.log(`💾 Cache Creation: ${cacheCreation.toLocaleString()}`);
    }

    const webSearches = output.usage.server_tool_use?.web_search_requests;
    if (webSearches && webSearches > 0) {
      console.log(`🔍 Web Searches: ${webSearches}`);
    }
  }

  // Model usage breakdown
  if (output.modelUsage && Object.keys(output.modelUsage).length > 0) {
    logger.section("Model Usage");
    for (const [model, usage] of Object.entries(output.modelUsage)) {
      console.log(`\n📊 ${logger.provider(model)}`);
      console.log(`   Input: ${safeGet(usage.inputTokens, 0).toLocaleString()}`);
      console.log(`   Output: ${safeGet(usage.outputTokens, 0).toLocaleString()}`);

      const cacheRead = safeGet(usage.cacheReadInputTokens, 0);
      if (cacheRead > 0) {
        console.log(`   Cache Read: ${cacheRead.toLocaleString()}`);
      }

      const webSearches = safeGet(usage.webSearchRequests, 0);
      if (webSearches > 0) {
        console.log(`   Web Searches: ${webSearches}`);
      }

      const cost = safeGet(usage.costUSD, 0);
      if (typeof cost === "number") {
        console.log(`   Cost: $${cost.toFixed(6)}`);
      }

      const contextWindow = safeGet(usage.contextWindow, 0);
      if (contextWindow > 0) {
        console.log(`   Context Window: ${contextWindow.toLocaleString()}`);
      }
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

