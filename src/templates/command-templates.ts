import type { CustomCommand } from "@/types/index.js";

/**
 * Command template type
 */
export type CommandTemplate = "claude" | "gemini" | "codex";

/**
 * Get command configuration for a specific template
 */
export function getCommandTemplate(template: CommandTemplate): CustomCommand {
  switch (template) {
    case "claude":
      return {
        executable: "claude",
        args: [
          "--dangerously-skip-permissions",
          "--settings",
          "{{SETTINGS_PATH}}",
          {
            "{{log}}": {
              true: ["--output-format", "stream-json", "--verbose"],
              false: ["--output-format", "json"],
            },
          },
          {
            "{{sessionId}}": {
              "{undefined,null}": [],
              "*": ["--resume", "{{sessionId}}"],
            },
          },
          "--system-prompt",
          "{{SYSTEM_PROMPT}}",
          "-p",
          "{{PROMPT}}",
        ],
      };

    case "gemini":
      return {
        executable: "gemini",
        args: [
          "--yolo",
          {
            "{{log}}": {
              true: ["--output-format", "stream-json"],
              false: ["--output-format", "json"],
            },
          },
          "--prompt",
          "{{PROMPT}}",
        ],
      };

    case "codex":
      return {
        executable: "codex",
        args: [
          "--full-auto",
          "--ask-for-approval",
          "never",
          "--sandbox",
          "danger-full-access",
          "exec",
          {
            "{{log}}": {
              true: ["--json"],
              false: [],
            },
          },
          {
            "{{sessionId}}": {
              "{undefined,null}": ["{{PROMPT}}"],
              "*": ["resume", "{{sessionId}}"],
            },
          },
        ],
      };

    default:
      throw new Error(`Unknown command template: ${template}`);
  }
}

/**
 * Get description for a command template
 */
export function getCommandTemplateDescription(template: CommandTemplate): string[] {
  switch (template) {
    case "claude":
      return [
        "Claude CLI - Official Anthropic CLI",
        "",
        "**Features**:",
        "- Full tool support",
        "- Session resumption",
        "- System prompt injection",
        "- Stream JSON output",
      ];

    case "gemini":
      return [
        "Gemini CLI - Google Gemini CLI",
        "",
        "**Features**:",
        "- YOLO mode (auto-approve all actions)",
        "- JSON output support",
        "- No session resumption support",
      ];

    case "codex":
      return [
        "Codex CLI - Anthropic Codex CLI",
        "",
        "**Features**:",
        "- Full auto mode",
        "- Session resumption",
        "- Sandbox execution",
        "- JSON output",
      ];

    default:
      return ["Unknown command template"];
  }
}

/**
 * Get system prompt template for a command template
 */
export function getCommandTemplateSystemPrompt(
  template: CommandTemplate,
  provider: string
): string[] {
  const basePrompt = [
    `## ${provider.toUpperCase()} Provider`,
    "",
    `You are using ${provider} with ${template} CLI.`,
    "",
  ];

  switch (template) {
    case "claude":
      return [
        ...basePrompt,
        "**Claude CLI Features**:",
        "- Full access to all Claude tools",
        "- Session can be resumed with --resume",
        "- System prompts are fully supported",
        "",
        "Please leverage these capabilities to complete tasks efficiently.",
      ];

    case "gemini":
      return [
        ...basePrompt,
        "**Gemini CLI Features**:",
        "- Running in YOLO mode (all actions auto-approved)",
        "- No session resumption available",
        "- Focus on completing tasks in a single run",
        "",
        "Please complete the task efficiently without expecting session continuation.",
      ];

    case "codex":
      return [
        ...basePrompt,
        "**Codex CLI Features**:",
        "- Running in full-auto mode with danger-full-access sandbox",
        "- Session can be resumed",
        "- All commands execute without approval",
        "",
        "Please leverage the full automation capabilities to complete tasks efficiently.",
      ];

    default:
      return basePrompt;
  }
}
