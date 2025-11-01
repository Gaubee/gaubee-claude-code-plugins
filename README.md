# CCAI - Claude Code AI Assistant

[![npm version](https://badge.fury.io/js/ccai.svg)](https://www.npmjs.com/package/ccai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

English | [中文](./README-zh.md)

**CCAI** is an intelligent AI provider management and routing tool for Claude Code, designed to help you efficiently delegate tool-intensive tasks to cost-effective AI providers.

## Features

- 🚀 **Multi-Provider Management**: Configure and manage multiple AI providers (GLM, MiniMax, etc.)
- 🧠 **Intelligent Routing**: Automatically select the best provider based on task characteristics
- 💰 **Cost Optimization**: Route tasks to cost-efficient providers for batch operations
- 📊 **Performance Tracking**: Log and analyze provider performance over time
- 🔄 **Easy Updates**: Seamlessly update provider configurations and routing strategies
- 🛠️ **Type-Safe**: Built with TypeScript for complete type safety

## Installation

```bash
npm i -g ccai
ccai init
```

This will install CCAI templates to your `~/.claude` directory.

## Quick Start

### 1. Add a Provider

```bash
npx ccai add glm
```

This creates a configuration file at `~/.claude/ccai/settings-glm.json`.

### 2. Configure Provider Settings

Edit the provider configuration:

```bash
npx ccai get glm
```

Update the configuration file with your provider's API key and settings:

```json
{
  "ccai": {
    "name": "GLM",
    "description": "GLM-4.6 model, excellent for tool calling and batch processing",
    "systemPrompt": "## GLM Model\n\nYou are GLM-4.6, optimized for...",
    "disabled": false
  },
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "your-api-key-here",
    "ANTHROPIC_BASE_URL": "https://open.bigmodel.cn/api/paas/v4/",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  }
}
```

### 3. Enable Provider

```bash
npx ccai enable glm
```

This generates the `/ccai-glm` command in Claude Code.

### 4. Use in Claude Code

**Direct Execution:**

```
/ccai-glm "Fetch documentation from 10 URLs and summarize key points"
```

**Smart Routing:**

```
/ccai "Process 100 CSV files and generate a summary report"
```

The smart router will analyze the task and select the most suitable provider.

## CLI Commands

### User Commands

- `npx ccai init` - Initialize CCAI templates
- `npx ccai add <provider>` - Add a new provider
- `npx ccai list` - List all configured providers
- `npx ccai get <provider>` - View provider configuration
- `npx ccai enable <provider>` - Enable a provider
- `npx ccai disable <provider>` - Disable a provider
- `npx ccai update` - Update command files

### Internal Commands (used by Claude Code)

- `npx ccai merge-settings <provider>` - Merge provider settings
- `npx ccai merge-prompts --provider <name>` - Merge system prompts
- `npx ccai run --provider <name> [prompt]` - Execute tasks with specific provider

## Run Command

The `run` command provides direct execution of tasks with AI providers, useful for testing and debugging.

### Basic Usage

```bash
# Execute a task directly
npx ccai run --provider glm "analyze this code"

# Read prompt from file
npx ccai run --provider glm --prompt-file ./prompt.txt

# Continue from previous session
npx ccai run --provider glm "continue" --session-id <uuid>
```

### Print Command Mode

The `--print-command` option prints the final Claude command without executing it, useful for debugging or understanding the execution pipeline.

**Output Formats:**

- `bash` (default on macOS/Linux) - Uses bash file substitution `$(< "file")`
- `ps` (default on Windows) - Uses PowerShell syntax `$(Get-Content "file" -Raw)`
- `json` - Outputs command as JSON array for programmatic use
- `text` - Outputs raw escaped command string

**Examples:**

```bash
# Print command with OS-appropriate format
npx ccai run --provider glm "analyze code" --print-command

# macOS/Linux output:
# claude --settings /path/to/settings.json --system-prompt $(< "/tmp/prompt.md") -p 'analyze code'

# Force bash format
npx ccai run --provider glm "analyze code" --print-command=bash

# PowerShell format
npx ccai run --provider glm "analyze code" --print-command=ps

# JSON format (for scripts)
npx ccai run --provider glm "analyze code" --print-command=json
# ["claude","--settings","/path/to/settings.json","--system-prompt","..."]

# Print command structure without prompt
npx ccai run --provider glm --print-command
# (omits -p parameter when no prompt provided)
```

### Advanced Options

```bash
# Task type hint for prompt optimization
npx ccai run --provider glm "scrape website" --example web-scraping

# Enable detailed logging
npx ccai run --provider glm "process data" --log

# Pretty JSON output
npx ccai run --provider glm "generate report" --pretty-json

# Custom output formatting
npx ccai run --provider glm "analyze" --format "{{role}}: {{content}}"
```

### Options Reference

| Option | Type | Description |
|--------|------|-------------|
| `--provider` | string | **Required.** Provider name (e.g., glm, minimax) |
| `--example` | string | Task type hint (web-scraping, code-generation, data-processing, etc.) |
| `--session-id` | uuid | Continue from previous session |
| `--plan-only` | boolean | Generate execution plan only (for intelligent routing) |
| `--log` | boolean | Enable detailed logging with stream-json output |
| `--pretty-json` | boolean | Format JSON output in human-readable way |
| `--format` | string | Custom output template |
| `--prompt-file` | path | Read prompt from file |
| `--print-command` | string\|boolean | Print command without executing (bash\|ps\|json\|text) |

### Use Cases

**1. Testing Provider Configuration:**
```bash
npx ccai run --provider glm "test message" --print-command
```

**2. Debugging Execution Issues:**
```bash
npx ccai run --provider glm "task" --log --print-command=json
```

**3. Generating Shell Scripts:**
```bash
npx ccai run --provider glm "analysis task" --print-command > run.sh
chmod +x run.sh
./run.sh
```

**4. CI/CD Integration:**
```bash
# Generate command for CI pipeline
COMMAND=$(npx ccai run --provider glm "lint code" --print-command=json)
echo $COMMAND | jq -r 'join(" ")' | bash
```

## Architecture

### Directory Structure

```
~/.claude/
├── ccai/
│   ├── settings-glm.json          # GLM configuration
│   ├── settings-minimax.json      # MiniMax configuration
│   ├── routing.md                 # Routing strategy
│   └── log/                       # Task execution logs
├── commands/
│   ├── ccai.md                    # Smart routing command
│   ├── ccai-glm.md                # GLM direct command
│   ├── ccai-minimax.md            # MiniMax direct command
│   └── ccaieval.md                # Performance evaluation command
└── skills/
    └── ccai/
        ├── SKILL.md               # Delegation guidelines
        └── examples/              # Task-specific examples
```

### Configuration Schema

```typescript
interface ProviderSettings {
  ccai: {
    name?: string; // Display name
    description?: string; // Capabilities description
    systemPrompt?: string; // Provider-specific prompt
    disabled?: boolean; // Enable/disable status
  };
  env: {
    ANTHROPIC_AUTH_TOKEN: string;
    ANTHROPIC_BASE_URL: string;
    [key: string]: string;
  };
}
```

## Routing Strategy

CCAI uses a Markdown-based routing strategy (`~/.claude/ccai/routing.md`) that describes:

1. **Routing Principles**: Cost, performance, and load balancing rules
2. **Task Type Matching**: Which providers excel at specific task types
3. **Provider Capabilities**: Detailed descriptions of each provider's strengths
4. **Special Rules**: Custom routing logic and constraints

Example routing rule:

```markdown
### Web Scraping Tasks

- **Primary**: Provider with strong tool-calling capabilities
- **Max Cost**: $0.10
- **Evaluation**: Speed > Cost
```

## Task Types

CCAI supports task-specific optimizations for:

- 🌐 **web-scraping**: Web data extraction and document fetching
- 💻 **code-generation**: Generating boilerplate and components
- 📊 **data-processing**: Batch data transformation and analysis
- 🔍 **code-analysis**: Codebase search and pattern detection
- 📚 **documentation-research**: Technical documentation research
- 🎨 **visual-inspection**: UI testing and screenshot analysis

## Performance Evaluation

Analyze provider performance and update routing strategy:

```
/ccaieval
```

This command:

1. Collects task logs from the past 7 days
2. Calculates success rates, costs, and performance metrics
3. Generates recommendations
4. Updates `routing.md` with insights

## Development

### Prerequisites

- Node.js 18+
- pnpm 10+

### Build from Source

```bash
# Clone repository
git clone https://github.com/Gaubee/ccai.git
cd ccai

# Install dependencies
pnpm install

# Build
pnpm build

# Test
pnpm dev
```

### Project Structure

```
ccai/
├── src/
│   ├── cli/              # CLI implementation
│   ├── core/             # Core modules
│   ├── types/            # Type definitions
│   ├── utils/            # Utilities
│   └── generated/        # Generated template files
├── scripts/
│   └── generate-templates.ts  # Template generator
├── templates/            # Template files
│   ├── commands/         # Command templates
│   ├── skills/           # Skill templates
│   └── ccai/             # Configuration templates
└── dist/                 # Built output
```

## Design Principles

CCAI follows these core principles:

- **KISS** (Keep It Simple): Clean CLI interface and clear functionality
- **YAGNI** (You Aren't Gonna Need It): Implement only essential features
- **DRY** (Don't Repeat Yourself): Shared skills and reusable components
- **SOLID**: Single responsibility, extensible design, proper abstractions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Links

- [Documentation](./docs)
- [GitHub Repository](https://github.com/Gaubee/ccai)
- [Issue Tracker](https://github.com/Gaubee/ccai/issues)
- [NPM Package](https://www.npmjs.com/package/ccai)
