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
npx ccai init
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
git clone https://github.com/your-username/ccai.git
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
- [GitHub Repository](https://github.com/your-username/ccai)
- [Issue Tracker](https://github.com/your-username/ccai/issues)
- [NPM Package](https://www.npmjs.com/package/ccai)
