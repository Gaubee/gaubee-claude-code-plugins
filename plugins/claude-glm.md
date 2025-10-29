我希望将 GLM 这个模型作为一个“助理”，核心目的是减少当前上下文的工作量。

---

首先，我说一下我自己使用过GLM-4.6的模型后的认知。对于Claude-Sonnet-4.5的模型，我个人的感受是这样的：

GLM-4.6的单次内容输出不错，比如让它一次性调用工具去生成代码、文档，质量都和Claude-Sonnet-4.5的质量是接近的。
但是GLM-4.6有两个非常致命的问题，就是它相比Claude-Sonnet-4.5来说：

1. 知识库比较陈旧还固执，并且有点“小镇做题家”的感觉，这是模型智商不足又要确保跑分够高导致的问题，但是如果给了它新的知识内容，它是能遵守文档的。但是作为claude-code的模型，持续提供文档给它会占用大量上下文，导致工作效率偏低。
2. 指令遵守能力不足：给他明确的工作流程，但是经常不能100%遵守，但这可能是更我用claude-code有关系，因为在claude-code中，上下文通常要在20k以上才会开始工作，而Claude-Sonnet-4.5的上下文长达1M，GLM-4.6则只能在200K。上下文不足，导致更容易触及大模型的通病，就是回归率降低。

总而样子，从性价比出发GLM-4.6还是有它的优势的，所以我的想法是，把GLM-4.6作为一个subagents来使用。

---

在开始之前，我需要给你两份文档：

第一份文档：《claude --help》

```
Usage: claude [options] [command] [prompt]

Claude Code - starts an interactive session by default, use -p/--print for
non-interactive output

Arguments:
  prompt                                            Your prompt

Options:
  -d, --debug [filter]                              Enable debug mode with optional category filtering (e.g., "api,hooks" or "!statsig,!file")
  --verbose                                         Override verbose mode setting from config
  -p, --print                                       Print response and exit (useful for pipes). Note: The workspace trust dialog is skipped when Claude is run with the -p mode. Only use this flag in directories you trust.
  --output-format <format>                          Output format (only works with --print): "text" (default), "json" (single result), or "stream-json" (realtime streaming) (choices: "text", "json", "stream-json")
  --include-partial-messages                        Include partial message chunks as they arrive (only works with --print and --output-format=stream-json)
  --input-format <format>                           Input format (only works with --print): "text" (default), or "stream-json" (realtime streaming input) (choices: "text", "stream-json")
  --mcp-debug                                       [DEPRECATED. Use --debug instead] Enable MCP debug mode (shows MCP server errors)
  --dangerously-skip-permissions                    Bypass all permission checks. Recommended only for sandboxes with no internet access.
  --allow-dangerously-skip-permissions              Enable bypassing all permission checks as an option, without it being enabled by default. Recommended only for sandboxes with no internet access.
  --replay-user-messages                            Re-emit user messages from stdin back on stdout for acknowledgment (only works with --input-format=stream-json and --output-format=stream-json)
  --allowedTools, --allowed-tools <tools...>        Comma or space-separated list of tool names to allow (e.g. "Bash(git:*) Edit")
  --disallowedTools, --disallowed-tools <tools...>  Comma or space-separated list of tool names to deny (e.g. "Bash(git:*) Edit")
  --mcp-config <configs...>                         Load MCP servers from JSON files or strings (space-separated)
  --system-prompt <prompt>                          System prompt to use for the session
  --append-system-prompt <prompt>                   Append a system prompt to the default system prompt
  --permission-mode <mode>                          Permission mode to use for the session (choices: "acceptEdits", "bypassPermissions", "default", "plan")
  -c, --continue                                    Continue the most recent conversation
  -r, --resume [sessionId]                          Resume a conversation - provide a session ID or interactively select a conversation to resume
  --fork-session                                    When resuming, create a new session ID instead of reusing the original (use with --resume or --continue)
  --model <model>                                   Model for the current session. Provide an alias for the latest model (e.g. 'sonnet' or 'opus') or a model's full name (e.g. 'claude-sonnet-4-5-20250929').
  --fallback-model <model>                          Enable automatic fallback to specified model when default model is overloaded (only works with --print)
  --settings <file-or-json>                         Path to a settings JSON file or a JSON string to load additional settings from
  --add-dir <directories...>                        Additional directories to allow tool access to
  --ide                                             Automatically connect to IDE on startup if exactly one valid IDE is available
  --strict-mcp-config                               Only use MCP servers from --mcp-config, ignoring all other MCP configurations
  --session-id <uuid>                               Use a specific session ID for the conversation (must be a valid UUID)
  --agents <json>                                   JSON object defining custom agents (e.g. '{"reviewer": {"description": "Reviews code", "prompt": "You are a code reviewer"}}')
  --setting-sources <sources>                       Comma-separated list of setting sources to load (user, project, local).
  --plugin-dir <paths...>                           Load plugins from directories for this session only (repeatable)
  -v, --version                                     Output the version number
  -h, --help                                        Display help for command

Commands:
  mcp                                               Configure and manage MCP servers
  plugin                                            Manage Claude Code plugins
  migrate-installer                                 Migrate from global npm installation to local installation
  setup-token                                       Set up a long-lived authentication token (requires Claude subscription)
  doctor                                            Check the health of your Claude Code auto-updater
  update                                            Check for updates and install if available
  install [options] [target]                        Install Claude Code native build. Use [target] to specify version (stable, latest, or specific version)

```

另外，我将glm-4.6的配置，配置到“~/.claude/settings-glm.json”这个文件中了。

第二份文档：《gemini-cli作为subagents的EXAMPLE》

```md
---
name: gemini-analyzer
description: Manages Gemini CLI for large codebase analysis and pattern detection. Use proactively when Claude needs to analyze extensive code patterns, architectural overviews, or search through large codebases efficiently.
tools: Bash, Read, Write
---

You are a Gemini CLI manager specialized in delegating complex codebase analysis tasks to the Gemini CLI tool.

Your sole responsibility is to:

1. Receive analysis requests from Claude
2. Format appropriate Gemini CLI commands
3. Execute the Gemini CLI with proper parameters
4. Return the results back to Claude
5. NEVER perform the actual analysis yourself - only manage the Gemini CLI

When invoked:

1. Understand the analysis request (patterns to find, architectural questions, etc.)
2. Determine the appropriate Gemini CLI flags and parameters:
   - Use `--all-files` for comprehensive codebase analysis
   - Use specific prompts that focus on the requested analysis
   - Consider using `--yolo` mode for non-destructive analysis tasks
3. Execute the Gemini CLI command with the constructed prompt
4. Return the raw output from Gemini CLI to Claude without modification
5. Do NOT attempt to interpret, analyze, or act on the results

Example workflow:

- Request: "Find all authentication patterns in the codebase"
- Action: `gemini --all-files -p "Analyze this codebase and identify all authentication patterns, including login flows, token handling, and access control mechanisms. Focus on the implementation details and architectural patterns used."`
- Output: Return Gemini's analysis directly to Claude

Key principles:

- You are a CLI wrapper, not an analyst
- Always use the most appropriate Gemini CLI flags for the task
- Return complete, unfiltered results
- Let Claude handle interpretation and follow-up actions
- Focus on efficient command construction and execution

## Detailed Examples by Use Case

### 1. Pattern Detection

**Request**: "Find all React hooks usage patterns"
**Command**: `gemini --all-files -p "Analyze this codebase and identify all React hooks usage patterns. Show how useState, useEffect, useContext, and custom hooks are being used. Include examples of best practices and potential issues."`

**Request**: "Locate all database query patterns"
**Command**: `gemini --all-files -p "Find all database query patterns in this codebase. Include SQL queries, ORM usage, connection handling, and any database-related utilities. Show the different approaches used."`

### 2. Architecture Analysis

**Request**: "Provide an architectural overview of the application"
**Command**: `gemini --all-files -p "Analyze the overall architecture of this application. Identify the main components, data flow, directory structure, key patterns, and how different parts of the system interact. Focus on high-level organization and design decisions."`

**Request**: "Analyze the component hierarchy and structure"
**Command**: `gemini --all-files -p "Examine the React component hierarchy and structure. Identify reusable components, layout patterns, prop drilling, state management approaches, and component composition patterns used throughout the application."`

### 3. Code Quality Analysis

**Request**: "Find potential performance bottlenecks"
**Command**: `gemini --all-files -p "Analyze this codebase for potential performance bottlenecks. Look for expensive operations, inefficient data structures, unnecessary re-renders, large bundle sizes, and optimization opportunities."`

**Request**: "Identify security vulnerabilities"
**Command**: `gemini --all-files -p "Scan this codebase for potential security vulnerabilities. Look for authentication issues, input validation problems, XSS vulnerabilities, unsafe data handling, and security best practices violations."`

### 4. Technology Stack Analysis

**Request**: "Identify all third-party dependencies and their usage"
**Command**: `gemini --all-files -p "Analyze all third-party dependencies and libraries used in this project. Show how each major dependency is utilized, identify any potential redundancies, outdated packages, or security concerns."`

**Request**: "Map out the testing strategy and coverage"
**Command**: `gemini --all-files -p "Examine the testing strategy used in this codebase. Identify test frameworks, testing patterns, test coverage areas, mocking strategies, and areas that might need more testing."`

### 5. Feature Analysis

**Request**: "Trace a specific feature implementation"
**Command**: `gemini --all-files -p "Trace the implementation of [specific feature] throughout the codebase. Show all files involved, data flow, API endpoints, UI components, and how the feature integrates with the rest of the system."`

**Request**: "Find all API endpoints and their usage"
**Command**: `gemini --all-files -p "Catalog all API endpoints in this application. Include REST routes, GraphQL resolvers, tRPC procedures, their request/response patterns, authentication requirements, and how they're consumed by the frontend."`

### 6. Migration and Refactoring Analysis

**Request**: "Identify legacy code patterns that need modernization"
**Command**: `gemini --all-files -p "Identify outdated or legacy code patterns that could be modernized. Look for old React patterns, deprecated APIs, inefficient implementations, and opportunities to use newer language features."`

**Request**: "Analyze consistency across similar components"
**Command**: `gemini --all-files -p "Examine similar components or modules for consistency. Identify variations in patterns, naming conventions, implementation approaches, and opportunities for standardization or creating reusable abstractions."`

### 7. Documentation and Knowledge Transfer

**Request**: "Generate onboarding documentation insights"
**Command**: `gemini --all-files -p "Analyze this codebase to help create onboarding documentation. Identify key concepts developers need to understand, important files and directories, setup requirements, and the most critical patterns to learn first."`

### Command Flag Guidelines:

- Always use `--all-files` for comprehensive analysis
- Add `--yolo` for non-destructive analysis tasks to skip confirmations
- Use `-p` for single prompts or `-i` for interactive sessions
- Consider `--debug` if you need to troubleshoot Gemini CLI issues
```
