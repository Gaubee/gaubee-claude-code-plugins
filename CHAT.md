# 会议纪要

## 2025-10-29 - 从 Claude Code 插件迁移到 NPM 包方案

### 背景

尝试将仓库作为 Claude Code 插件安装时遇到问题：插件系统不支持文件之间的引用关系。决定改为 npm 包方案，通过 `npx ccai` 命令行工具来安装和管理。

### 核心决策

#### 1. 工具定位：`ccai` (Claude Code AI Assistant)

已注册 npm 包名：`ccai`

**核心职责**：
- ✅ 初始化安装（复制文件到 `~/.claude`）
- ✅ 更新同步
- ✅ 提供商管理
- ✅ 配置管理（混合 JSON 技术）

#### 2. 配置管理策略

**混合 JSON 技术**：
```typescript
// 伪代码
const defaultSettings = readJSON('~/.claude/settings.json')
const providerSettings = readJSON('~/.claude/ccai/settings-glm.json')
const mergedSettings = merge(defaultSettings, providerSettings)
const tempPath = path.join(os.tmpdir(), 'ccai-settings-glm.json')
writeJSON(tempPath, mergedSettings)

// 使用临时配置启��� claude
exec(`claude --settings ${tempPath} ...`)
```

**配置文件位置**：
- 用户配置：`~/.claude/ccai/settings-{provider}.json`
- 临时混合：`os.tmpdir()/ccai-settings-{provider}.json`

#### 3. 目录结构设计

**扁平结构**：
```
~/.claude/
├── ccai/
│   ├── settings-glm.json      # GLM 配置
│   ├── settings-minimax.json  # MiniMax 配置
│   └── routing.json           # 路由策略配置（可选）
├── commands/
│   ├── ai.md                  # 智能路由命令
│   └── ai-glm.md              # 精确控制命令（或 ai:glm）
├── skills/
│   └── ai-delegation/         # 共享 skill
└── providers/
    ├── glm/
    │   └── system-prompt.md
    └── minimax/
        └── system-prompt.md
```

#### 4. 命令设计

**两种控制方式**：

1. **精确控制**：`/ccai-{provider}`
   - `/ccai-glm "任务"` - 调用 GLM
   - `/ccai-minimax "任务"` - 调用 MiniMax
   - 直接调用指定提供商，用户完全控制使用哪个模型

   **命名决策**：
   - ✅ 采用连字符分隔：`/ccai-glm`
   - ❌ 不采用冒号：`/ccai:glm` - 避免与 Claude Plugin 语法混淆
   - 优点：清晰直观，不会误导用户以为这是 Claude 官方插件系统

2. **智能路由**：`/ccai`
   - 同时调用多个提供商
   - 每个提供商列出执行计划
   - 选择最符合预期的计划
   - 将任务和计划交给选中的提供商执行
   - 支持用户自定义路由策略文档（Markdown 格式）

**命令映射关系**：
```
/ccai       → ~/.claude/commands/ccai.md
/ccai-glm   → ~/.claude/commands/ccai-glm.md
/ccai-minimax → ~/.claude/commands/ccai-minimax.md
```

#### 5. 提供商管理

**添加提供商**：
```bash
npx ccai add glm
```

**行为**：
1. 在 `~/.claude/ccai/` 创建 `settings-glm.json`
2. 不内置任何 provider 模板
3. 生成空的配置文件供用户填写

**配置文件结构**：

```typescript
// TypeScript 类型定义
interface ProviderCcaiConfig {
  name?: string          // Provider 展示名称
  description?: string   // Provider 能力描述
  systemPrompt?: string  // Provider 专属系统提示词（会被合并到最顶部）
  disabled?: boolean     // 是否禁用该 Provider
}

interface ProviderSettings {
  ccai: ProviderCcaiConfig
  env: Record<string, string>
}
```

```json
{
  "ccai": {
    "name": "GLM-4",
    "description": "GLM-4 是智谱 AI 推出的大语言模型，擅长工具调用、批量任务处理和代码生成。\n\n**优势**：\n- 成本低廉\n- 工具调用熟练\n- 适��批量处理\n\n**适用场景**：\n- Data Processing\n- Code Generation\n- Web Scraping",
    "systemPrompt": "## GLM-4 模型特性\n\n你是 GLM-4 模型，具备以下特性：\n\n1. **并行工具调用**：你可以同时调用多个工具，充分利用这一能力提高效率\n2. **批量处理优化**：对于重复性任务，使用循环和批处理减少重复逻辑\n3. **成本意识**：你的 token 成本较低，适合处理大批量任务\n\n请充分发挥这些优势完成任务。",
    "disabled": false
  },
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "your-api-key-here",
    "ANTHROPIC_BASE_URL": "https://open.bigmodel.cn/api/paas/v4/",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  }
}
```

**字段说明**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `ccai.name` | `string` | 否 | Provider 展示名称，用于 UI 显示 |
| `ccai.description` | `string` | 否 | Provider 能力描述，支持 Markdown 格式，会显示在命令文件和路由策略中 |
| `ccai.systemPrompt` | `string` | 否 | Provider 专属系统提示词，会在 `merge-prompts` 时被合并到**最顶部**，优先级最高 |
| `ccai.disabled` | `boolean` | 否 | 是否禁用该 Provider，禁用后不会出现在路由选项中，默认 `false` |
| `env` | `Record<string, string>` | 是 | 环境变量配置，必须包含 `ANTHROPIC_AUTH_TOKEN` 和 `ANTHROPIC_BASE_URL` |

**元数据用途**：
- `npx ccai list` 命令读取所有提供商的元数据
- 根据任务类型、成本、能力等决定路由策略

#### 6. 智能路由机制

**工作流程**：

```
用户调用 /ccai "任务描述"
    ↓
1. 读取所有已配置的提供商元数据
    ↓
2. 根据任务特征过滤合适的提供商
    ↓
3. 并行调用 2-3 个提供商，要求它们：
   - 分析任务
   - 制定执行计划
   - 估算成本和时间
    ↓
4. 评估所有计划：
   - 可行���
   - 成本
   - 预期质量
    ↓
5. 选择最优计划
    ↓
6. 调用选中的提供商执行任务
```

**路由策略配置**（可选）：

使用 Markdown 格式，作为提示词的一部分注入到 `/ccai` 命令中。这样更灵活，用户可以用自然语言描述策略。

**文件位置**：`~/.claude/ccai/routing.md`

**示例配置**：
```markdown
# AI Provider 路由策略

## 路由原则

在选择 AI Provider 时，请遵循以下优先级：

1. **成本优先**：优先选择性价比高的 Provider
2. **任务适配**：根据任务类型选择擅长该领域的 Provider
3. **负载均衡**：避免单一 Provider 过载

## 任务类型匹配规则

### Web Scraping 任务
- **首选**：MiniMax（擅长工具调用，成本低）
- **备选**：GLM
- **最大成本**：$0.10

### Code Generation 任务
- **首选**：GLM, MiniMax（评估标准：代码质量 > 速度）
- **避免**：无

### Data Processing 任务
- **首选**：GLM（大批量处理，成本敏感）
- **最大成本**：$0.05

### Documentation Research 任务
- **首选**：任意可用 Provider
- **评估标准**：速度 > 成本

## Provider 能力描述

### GLM
- **优势**：工具调用熟练、成本低、适合批量任务
- **限制**：上下文窗口 200K
- **适用场景**：Web scraping、Batch processing、Code generation

### MiniMax
- **优势**：待评估
- **限制**：待评估
- **适用场景**：待评估

## 特殊规则

- 如果任务描述中明确提到性能要求，优先考虑速度而非成本
- 如果任务预计 token 消耗超过 100K，必须选择成本最低的 Provider
- 用户可以通过 `--prefer-provider=glm` 参数强制指定 Provider
```

**使用方式**：

`/ccai` 命令会自动读取 `routing.md`，并将其作为系统提示词的一部分：

```bash
# 在 ccai.md 中
claude --settings ${mergedSettings} \
  --system-prompt "$(< ~/.claude/skills/ai-delegation/SKILL.md)" \
  --append-system-prompt "$(< ~/.claude/ccai/routing.md)" \
  -p "${task}"
```

#### 6.1 日志记录机制

**工作日志记录**：

在 provider 的 system-prompt 中增加要求：

```markdown
## 工作日志记录

执行任务时，你必须记录完整的工作过程到日志文件：

**日志路径**：`~/.claude/ccai/log/{provider}-{TIMESTAMP}.md`
- `{provider}`：当前 Provider 名称（如 glm、minimax）
- `{TIMESTAMP}`：格式为 `YYYY-MM-DD_HH-mm-ss`

**日志内容要求**：
1. **任务描述**：完整的用户任务
2. **执行计划**：你的分步执行计划
3. **工具调用记录**：每个工具调用及其结果（可简化）
4. **遇到的问题**：错误、异常或需要调整的地方
5. **最终结果**：任务完成情况和输出
6. **性能指标**：
   - 总耗时
   - Token 消耗
   - 工具调用次数

**日志格式示例**：
\`\`\`markdown
# Task Log: GLM-4 - 2025-10-29_14-30-15

## Task Description
[用户原始任务描述]

## Execution Plan
1. Step 1...
2. Step 2...

## Execution Details
### Step 1: [步骤名称]
- Tool: Read
- Result: Success
- Notes: ...

## Issues Encountered
- Issue 1: [描述]
- Resolution: [如何解决]

## Final Result
- Status: Completed
- Output: [简要描述]

## Performance Metrics
- Duration: 2m 15s
- Tokens: 15,234
- Tool Calls: 23
- Success Rate: 95.7%
\`\`\`
```

**routing.md 格式更新**：

在 `routing.md` 末尾添加评估历史追踪：

```markdown
---

## 路由策略评估历史

> **最后评估时间**：2025-10-29 14:30:15
> **最后评估基于**：glm-2025-10-29_10-20-40.md, minimax-2025-10-29_11-15-22.md
> **下次建议评估**：2025-11-05（一周后）

**评估说明**：
- 如果当前时间距离最后评估时间超过 **7 天**，建议执行 `/ccaieval` 更新路由策略
- 执行 `/ccaieval` 后需要 **重启 Claude Code** 以重新加载更新的 `routing.md`
```

#### 6.2 路由策略评估命令

**新增命令**：`/ccaieval`

**作用**：分析近期任务日志，评估各 Provider 的实际表现，自动更新 `routing.md`。

**命令文件**：`~/.claude/commands/ccaieval.md`

```markdown
---
description: Evaluate AI providers performance and update routing strategy
---

You are evaluating AI providers' recent performance to update the routing strategy.

## Execution Steps

**Step 1: 收集日志**

扫描 `~/.claude/ccai/log/` 目录，收集最近 7 天的任务日志：

\`\`\`bash
find ~/.claude/ccai/log -name "*.md" -mtime -7
\`\`\`

**Step 2: 分析日志**

对每个 Provider 的日志进行统计分析：

1. **成功率**：完成任务数 / 总任务数
2. **平均耗时**：所有任务的平均执行时间
3. **平均成本**：根据 Token 消耗估算成本
4. **任务类型分布**：各类型任务的表现

使用 Read 工具读取日志文件，解析关键指标。

**Step 3: 生成评估报告**

生成结构化的评估报告：

\`\`\`markdown
# Provider Performance Report - 2025-10-29

## Summary Statistics

| Provider | Tasks | Success Rate | Avg Duration | Avg Cost | Best For |
|----------|-------|--------------|--------------|----------|----------|
| GLM      | 15    | 93.3%        | 2m 30s       | $0.015   | Code Gen, Data Processing |
| MiniMax  | 8     | 87.5%        | 3m 10s       | $0.022   | Web Scraping |

## Detailed Analysis

### GLM
- **Strengths**: Fast execution, low cost, excellent for batch operations
- **Weaknesses**: Occasional timeout on complex tasks
- **Recommendation**: Continue as primary for cost-sensitive tasks

### MiniMax
- **Strengths**: Reliable web scraping, good error handling
- **Weaknesses**: Higher cost, slower than GLM
- **Recommendation**: Use for web-heavy tasks

## Routing Strategy Updates

Based on the analysis, the following changes are recommended:

1. **Web Scraping**: 首选 MiniMax（基于实际成功率）
2. **Code Generation**: 首选 GLM（基于成本和速度）
3. **Data Processing**: 首选 GLM（基于批量处理表现）
\`\`\`

**Step 4: 更新 routing.md**

使用 Edit 工具更新 `~/.claude/ccai/routing.md`：

1. 更新 Provider 能力描述（基于实际表现）
2. 更新任务类型匹配规则
3. 更新评估历史部分：
   - 最后评估时间：当前时间
   - 最后评估基于：本次分析的日志文件列表
   - 下次建议评估：7天后

**Step 5: 提示用户**

提醒用户：

\`\`\`
✅ 路由策略已更新

📄 评估报告：~/.claude/ccai/routing-eval-2025-10-29.md
📝 策略文件：~/.claude/ccai/routing.md

⚠️  重要：需要重启 Claude Code 以加载新的路由策略
    使用 Cmd+Q (macOS) 或 Ctrl+Q (Linux/Windows) 退出后重新启动
\`\`\`

**Step 6: 保存评估报告**

将完整的评估报告保存到：
`~/.claude/ccai/routing-eval-{YYYY-MM-DD}.md`

## Notes

- 如果日志文件少于 5 个，提示用户数据不足，建议稍后再评估
- 支持手动指定评估时间范围：`/ccaieval --days 14`
```

**自动提示逻辑**：

在 `routing.md` 中添加提示词段落（供主 Claude 会话读取）：

```markdown
## 系统维护提示

**对于主 Claude 会话**：

请检查当前日期与"最后评估时间"的间隔：

- 如果 >= 7 天：
  \`\`\`
  ⏰ 路由策略评估提醒

  距离上次路由策略评估已超过 7 天，建议执行评估以优化 Provider 选择。

  执行命令：/ccaieval

  注意：评估完成后需要重启 Claude Code 才能生效。
  是否现在执行评估？
  \`\`\`
- 如果 < 7 天：无需提示
```

**优点**：
- ✅ 灵活：用户用自然语言描述策略
- ✅ 可读：Markdown 格式清晰易懂
- ✅ 可扩展：可随时添加新规则无需改代码
- ✅ 上下文丰富：LLM 可以理解复杂的业务规则

### 技术实现要点

#### 1. NPM 包结构

```
ccai/
├── package.json
├── tsconfig.json
├── rolldown.config.ts       # Rolldown 打包配置
├── bin/
│   └── ccai.js              # CLI 入口（打包后）
├── src/
│   ├── index.ts             # 主入口
│   ├── cli/
│   │   ├── index.ts         # CLI 主逻辑
│   │   └── commands/
│   │       ├── init.command.ts
│   │       ├── add.command.ts
│   │       ├── update.command.ts
│   │       ├── config.command.ts
│   │       └── list.command.ts
│   ├── core/
│   │   ├── installer.ts     # 文件安装逻辑
│   │   ├── merger.ts        # JSON 混合逻辑
│   │   ├── router.ts        # 路由逻辑
│   │   └── executor.ts      # Provider 执行器
│   ├── types/
│   │   ├── config.schema.ts # Zod schemas
│   │   └── index.ts
│   └── utils/
│       ├── fs.ts            # 文件操作
│       ├── prompt.ts        # 交互提示
│       └── logger.ts        # 日志输出
└── templates/               # 源模板文件（会被打包为资源）
    ├── commands/
    │   ├── ccai.md              # 智能路由命令
    │   ├── ccaieval.md          # 路由评估命令
    │   └── ccai-provider.md.template  # Provider 命令模板（动态生成时使用）
    ├── skills/
    │   └── ai-delegation/
    │       ├── SKILL.md
    │       └── examples/
    │           ├── code-analysis.md
    │           ├── code-generation.md
    │           ├── documentation-research.md
    │           ├── visual-inspection.md
    │           └── web-scraping.md
    ├── ccai/
    │   ├── routing.md.example   # 路由策略示例
    │   └── settings-provider.json.template  # Provider 配置模板
    └── system-prompt.md         # 统一的系统提示词（不再按 provider 分离）
```

**文件命名说明**：

1. **不再内置特定 Provider 的命令文件**：
   - ❌ 删除：`ccai-glm.md`、`ccai-minimax.md`
   - ✅ 新增：`ccai-provider.md.template`（通用模板）

2. **动态生成 Provider 命令**：
   - 当用户执行 `npx ccai add glm` 时
   - 自动从模板生成 `~/.claude/commands/ccai-glm.md`
   - 模板中的 `{{PROVIDER}}` 占位符会被替换为实际的 provider 名称

3. **Provider 配置模板化**：
   - `settings-provider.json.template`：通用配置模板
   - 用户添加 provider 时，基于模板生成特定配置文件
   - 不再内置 `glm` 和 `minimax` 的硬编码配置

#### 1.1 模板文件拆分设计

**核心思想**：将命令模板拆分为可复用的基础模板和动态组合的内容。

**模板文件结构**：

```
templates/
├── commands/
│   ├── ccai-exec.md.template        # 执行命令基础模板（被 ccai.md 和 ccai-{provider}.md 复用）
│   └── ccai-router.md.template      # 路由策略模板（仅用于 ccai.md）
├── ccai/
│   ├── routing.md.example           # 路由策略示例
│   └── settings-provider.json.template
└── skills/ai-delegation/
    ├── SKILL.md
    └── examples/
        ├── code-analysis.md
        ├── code-generation.md
        ├── documentation-research.md
        ├── visual-inspection.md
        └── web-scraping.md
```

**ccai-exec.md.template**（执行命令基础模板）：

```markdown
---
description: {{DESCRIPTION}}
---

{{PROVIDER_INFO}}

## Context

This command is used when:
- The task is tool-intensive (many Read/Write/WebFetch/Grep operations)
- The task has clear boundaries (well-defined inputs/outputs)
- Verification is simple (file list, spot-check, statistics)
- Cost(Delegation + Verification) < Cost(Direct Execution)

Refer to `~/.claude/skills/ai-delegation/SKILL.md` for decision criteria.

## Available Task Types

You can enhance the system prompt with task-specific examples:

{{EXAMPLES_LIST}}

## Execution Steps

**Step 1: Prepare Task Prompt**

Write **Task Description($ARGUMENTS)** to `/tmp/ccai-task-{{PROVIDER}}.md`

**Step 2: Execute {{PROVIDER}} via Bash**

Run the following command:

\`\`\`bash
# Basic execution (no task type)
claude --dangerously-skip-permissions \
  --settings "$(ccai merge-settings {{PROVIDER}})" \
  --output-format json \
  --system-prompt "$(ccai merge-prompts --provider {{PROVIDER}})" \
  -p "$(< /tmp/ccai-task-{{PROVIDER}}.md)"

# With task-specific enhancement (if applicable)
claude --dangerously-skip-permissions \
  --settings "$(ccai merge-settings {{PROVIDER}})" \
  --output-format json \
  --system-prompt "$(ccai merge-prompts --example web-scraping --provider {{PROVIDER}})" \
  -p "$(< /tmp/ccai-task-{{PROVIDER}}.md)"
\`\`\`

**Step 3: Save Task Log**

Save the execution log to:
`~/.claude/ccai/log/{{PROVIDER}}-$(date +%Y-%m-%d_%H-%M-%S).md`

**Step 4: Return Results**

The {{PROVIDER}} output will be displayed. Your job is to:
1. Review the output
2. Perform quick verification (as described in the output)
3. Report completion status to the user

## Task Description($ARGUMENTS)

$ARGUMENTS
```

**ccai-router.md.template**（路由策略模板）：

```markdown
---
description: Intelligently route tasks to the most suitable AI provider
---

You are routing a task to the most suitable AI provider based on task characteristics and provider capabilities.

{{PROVIDERS_INFO}}

## Routing Strategy

Read the routing strategy from `~/.claude/ccai/routing.md` for detailed rules and preferences.

## Routing Steps

**Step 1: Analyze Task**

Analyze the user's task to determine:
- Task type (web-scraping, code-generation, data-processing, etc.)
- Estimated complexity
- Tool usage intensity
- Expected duration

**Step 2: Select Providers**

Based on the task analysis and routing strategy, select 1-3 suitable providers from the available options above.

Filter out disabled providers (where `disabled: true`).

**Step 3: (Optional) Get Execution Plans**

For complex tasks, you may request execution plans from multiple providers:

\`\`\`bash
for provider in glm minimax; do
  echo "Getting plan from $provider..."
  ccai merge-prompts --provider $provider --plan-only > /tmp/prompt-$provider.md
  claude --settings "$(ccai merge-settings $provider)" \
    --system-prompt "$(< /tmp/prompt-$provider.md)" \
    -p "Analyze this task and provide an execution plan with cost estimation: $(< /tmp/task.md)"
done
\`\`\`

Compare the plans and select the best one.

**Step 4: Execute Selected Provider**

Use the selected provider's command:

\`\`\`bash
/ccai-{selected_provider} "$ARGUMENTS"
\`\`\`

## Task Description($ARGUMENTS)

$ARGUMENTS
```

**占位符说明**：

| 占位符 | 说明 | 示例值 |
|--------|------|--------|
| `{{PROVIDER}}` | Provider 名称 | `glm` |
| `{{DESCRIPTION}}` | 命令描述 | `Delegate task to GLM for cost-efficient execution` |
| `{{PROVIDER_INFO}}` | Provider 介绍信息 | 从 `settings-{provider}.json` 的 `ccai` 字段读取 |
| `{{EXAMPLES_LIST}}` | 可用的 task type 列表 | `- web-scraping\n- code-generation\n...` |
| `{{PROVIDERS_INFO}}` | 所有 Provider 的介绍 | 汇总所有 settings 的 `ccai` 字段 |

**生成逻辑**：

1. **生成 `ccai.md`**：
   ```typescript
   const ccaiExecContent = templates['commands/ccai-exec.md.template']
     .replace(/{{PROVIDER}}/g, 'selected-provider')
     .replace(/{{DESCRIPTION}}/g, 'Intelligently route and execute tasks')
     .replace(/{{PROVIDER_INFO}}/g, '') // 留空，由路由部分提供
     .replace(/{{EXAMPLES_LIST}}/g, getExamplesList())

   const ccaiRouterContent = templates['commands/ccai-router.md.template']
     .replace(/{{PROVIDERS_INFO}}/g, getAllProvidersInfo())

   const ccaiContent = ccaiRouterContent + '\n\n---\n\n' + ccaiExecContent

   writeFile('~/.claude/commands/ccai.md', ccaiContent)
   ```

2. **生成 `ccai-{provider}.md`**：
   ```typescript
   const providerSettings = readSettings(provider)
   const providerInfo = formatProviderInfo(providerSettings.ccai)

   const content = templates['commands/ccai-exec.md.template']
     .replace(/{{PROVIDER}}/g, provider)
     .replace(/{{DESCRIPTION}}/g, `Delegate task to ${provider} for cost-efficient execution`)
     .replace(/{{PROVIDER_INFO}}/g, providerInfo)
     .replace(/{{EXAMPLES_LIST}}/g, getExamplesList())

   writeFile(`~/.claude/commands/ccai-${provider}.md`, content)
   ```

**Provider 介绍信息格式化**：

```typescript
function formatProviderInfo(ccaiConfig: ProviderCcaiConfig): string {
  if (!ccaiConfig) return ''

  const parts: string[] = []

  if (ccaiConfig.name) {
    parts.push(`## Provider: ${ccaiConfig.name}`)
  }

  if (ccaiConfig.description) {
    parts.push(`\n${ccaiConfig.description}`)
  }

  if (ccaiConfig.disabled) {
    parts.push(`\n⚠️ **This provider is currently disabled.**`)
  }

  return parts.join('\n')
}

function getAllProvidersInfo(): string {
  const providers = listProviders() // 扫描 ~/.claude/ccai/settings-*.json
  const infos: string[] = []

  for (const provider of providers) {
    const settings = readSettings(provider)
    if (settings.ccai) {
      infos.push(`### ${settings.ccai.name || provider}`)
      infos.push(`- **Status**: ${settings.ccai.disabled ? '❌ Disabled' : '✅ Enabled'}`)
      if (settings.ccai.description) {
        infos.push(`- **Description**: ${settings.ccai.description}`)
      }
      infos.push('') // 空行
    }
  }

  return infos.join('\n')
}
```

**Examples 列表生成**：

```typescript
function getExamplesList(): string {
  const examples = [
    'web-scraping',
    'code-generation',
    'data-processing',
    'code-analysis',
    'documentation-research',
    'visual-inspection'
  ]

  return examples.map(ex => `- \`${ex}\``).join('\n')
}
```

**安装流程更新**：

```bash
# 用户添加 provider
$ npx ccai add glm

# ccai 执行的操作：
1. 从 templates/ccai/settings-provider.json.template 生成
   ~/.claude/ccai/settings-glm.json

2. 从 templates/commands/ccai-provider.md.template 生成
   ~/.claude/commands/ccai-glm.md
   （将所有 {{PROVIDER}} 替换为 "glm"）

3. 提示用户编辑配置文件：
   "✅ GLM provider added successfully!
    📝 Please edit the configuration: ~/.claude/ccai/settings-glm.json
    🔧 Configure: npx ccai config glm"
```

**Rolldown 打包配置**：

使用 Rolldown 进行打包，生成单一可执行文件，并内嵌模板资源。

**⚠️ 配置验证说明**：

以下配置基于 Rolldown 的基本用法编写，但在实际实现时需要注意：

1. **虚拟模块语法**：需要验证 Rolldown 的虚拟模块 API 是否与 Rollup/Vite 一致
2. **Plugin 钩子**：`buildStart`、`resolveId`、`load`、`emitFile` 等钩子需查文档确认
3. **备选方案**：如果 Rolldown 不支持虚拟模块，可考虑：
   - 使用 `@rollup/plugin-virtual` 插件
   - 或者改用构建时脚本生成 `templates.ts` 文件
   - 或者使用 `import.meta.glob` 在运行时读取

**推荐的验证步骤**（实施时）：

```bash
# 1. 查阅 Rolldown 官方文档
https://rolldown.rs/guide/plugins

# 2. 测试虚拟模块支持
npm create rolldown@latest test-project
# 在测试项目中验证虚拟模块写法

# 3. 如果不支持，使用构建脚本方案
# scripts/build-templates.ts
import { readdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

function scanTemplates(dir: string) {
  // ... 扫描逻辑
}

const templates = scanTemplates('./templates')
writeFileSync(
  './src/generated/templates.ts',
  `export default ${JSON.stringify(templates, null, 2)} as const`
)
```

**rolldown.config.ts**（待验证）：
```typescript
import { defineConfig } from 'rolldown'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

export default defineConfig({
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'esm',
    // 单文件输出
    entryFileNames: '[name].js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  // 外部依赖（不打包进来）
  external: [
    'node:*', // Node.js 内置模块
    'fs',
    'path',
    'os',
    'child_process',
  ],
  plugins: [
    // 内嵌模板文件为字符串
    inlineTemplatesPlugin(),
  ],
})

// 自定义插件：将 templates 目录内嵌为虚拟模块
function inlineTemplatesPlugin() {
  return {
    name: 'inline-templates',
    async buildStart() {
      // 扫描 templates 目录
      const templates = await scanTemplates('./templates')

      // 注册虚拟模块
      this.emitFile({
        type: 'asset',
        fileName: 'templates.json',
        source: JSON.stringify(templates),
      })
    },
    resolveId(id: string) {
      if (id === 'virtual:templates') {
        return id
      }
    },
    load(id: string) {
      if (id === 'virtual:templates') {
        return `export default ${JSON.stringify(templates)}`
      }
    },
  }
}

async function scanTemplates(dir: string) {
  // 递归扫描并读取所有模板文件
  // 返回 { [path]: content } 映射
  const result: Record<string, string> = {}

  async function scan(currentDir: string, prefix = '') {
    const entries = await readdir(currentDir, { withFileTypes: true })

    for (const entry of entries) {
      const relativePath = join(prefix, entry.name)
      const fullPath = join(currentDir, entry.name)

      if (entry.isDirectory()) {
        await scan(fullPath, relativePath)
      } else {
        const content = await readFile(fullPath, 'utf-8')
        result[relativePath] = content
      }
    }
  }

  await scan(dir)
  return result
}
```

**使用内嵌模板**：

在代码中导入虚拟模块：

```typescript
// src/core/installer.ts
import templates from 'virtual:templates'

export async function installTemplates(targetDir: string) {
  for (const [path, content] of Object.entries(templates)) {
    const targetPath = join(targetDir, path)
    await ensureDir(dirname(targetPath))
    await writeFile(targetPath, content, 'utf-8')
  }
}
```

**虚拟模块类型声明**：

为了获得 TypeScript 类型支持，需要为虚拟模块生成 `.d.ts` 类型文件。

**方案一：手动维护类型文件**

创建 `src/types/virtual-modules.d.ts`：

```typescript
declare module 'virtual:templates' {
  const templates: Record<string, string>
  export default templates
}
```

**方案二：在插件中自动生成类型文件**

增强 `inlineTemplatesPlugin`，在构建时生成类型定义：

```typescript
function inlineTemplatesPlugin() {
  let templates: Record<string, string> = {}

  return {
    name: 'inline-templates',
    async buildStart() {
      // 扫描 templates 目录
      templates = await scanTemplates('./templates')

      // 生成类型定义文件
      const dtsContent = `declare module 'virtual:templates' {
  const templates: {
${Object.keys(templates).map(path => `    '${path}': string`).join('\n')}
  }
  export default templates
}
`
      // 写入类型文件
      await writeFile('./src/types/virtual-templates.d.ts', dtsContent, 'utf-8')

      // 或者使用 emitFile
      this.emitFile({
        type: 'asset',
        fileName: 'virtual-templates.d.ts',
        source: dtsContent,
      })
    },
    resolveId(id: string) {
      if (id === 'virtual:templates') {
        return id
      }
    },
    load(id: string) {
      if (id === 'virtual:templates') {
        return `export default ${JSON.stringify(templates)}`
      }
    },
  }
}
```

**方案三：使用构建脚本（推荐）**

如果 Rolldown 的虚拟模块支持不完善，使用构建时脚本：

```typescript
// scripts/generate-templates.ts
import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs'
import { join, relative } from 'path'

interface Templates {
  [path: string]: string
}

function scanTemplates(dir: string, baseDir = dir): Templates {
  const result: Templates = {}

  function scan(currentDir: string) {
    const entries = readdirSync(currentDir)

    for (const entry of entries) {
      const fullPath = join(currentDir, entry)
      const stat = statSync(fullPath)

      if (stat.isDirectory()) {
        scan(fullPath)
      } else {
        const relativePath = relative(baseDir, fullPath)
        const content = readFileSync(fullPath, 'utf-8')
        result[relativePath] = content
      }
    }
  }

  scan(dir)
  return result
}

// 生成模板数据
const templates = scanTemplates('./templates')

// 生成 TypeScript 文件
const tsContent = `// Auto-generated by scripts/generate-templates.ts
// Do not edit manually

export type TemplateKey = ${Object.keys(templates).map(k => `'${k}'`).join(' | ')}

export const templates = ${JSON.stringify(templates, null, 2)} as const

export default templates
`

writeFileSync('./src/generated/templates.ts', tsContent, 'utf-8')

console.log(`✅ Generated templates.ts with ${Object.keys(templates).length} files`)
```

**package.json 配置**：

```json
{
  "scripts": {
    "generate:templates": "tsx scripts/generate-templates.ts",
    "prebuild": "pnpm generate:templates",
    "build": "rolldown",
    "dev": "pnpm generate:templates && tsx src/index.ts"
  }
}
```

**使用方式**：

```typescript
// src/core/installer.ts
import templates, { type TemplateKey } from '@/generated/templates'

export async function installTemplate(
  templateKey: TemplateKey,
  targetPath: string
) {
  const content = templates[templateKey]
  await writeFile(targetPath, content, 'utf-8')
}

// 类型安全：templateKey 只能是实际存在的模板路径
await installTemplate('commands/ccai.md', '~/.claude/commands/ccai.md')
await installTemplate('invalid/path.md', '...') // ❌ 类型错误
```

**优点**：
- ✅ 完整的 TypeScript 类型支持
- ✅ 编译时检查模板路径正确性
- ✅ IDE 自动补全所有可用模板
- ✅ 不依赖 Rolldown 的虚拟模块支持

**打包命令**：

```json
{
  "scripts": {
    "build": "rolldown",
    "dev": "tsx src/index.ts",
    "prepublishOnly": "pnpm build"
  }
}
```

**打包策略**：
- ✅ 单文件输出：`dist/index.js`
- ✅ 模板内嵌：所有 Markdown 和配置模板打包为虚拟模块
- ✅ 依赖外置：Node.js 内置模块和大型依赖（如 `commander`）不打包
- ✅ Tree-shaking：只打包使用到的代码

**发布到 npm**：
```json
{
  "name": "ccai",
  "version": "0.1.0",
  "bin": {
    "ccai": "./dist/index.js"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "type": "module"
}
```

#### 2. 关键功能实现

#### 2.1 Settings 混合器

```typescript
import os from 'os'
import path from 'path'
import fs from 'fs'

export function mergeSettings(provider: string): string {
  const claudeDir = path.join(os.homedir(), '.claude')

  // 读取默认配置（如果存在）
  let defaultSettings = {}
  const defaultSettingsPath = path.join(claudeDir, 'settings.json')
  if (fs.existsSync(defaultSettingsPath)) {
    defaultSettings = JSON.parse(fs.readFileSync(defaultSettingsPath, 'utf-8'))
  }

  // 读取 Provider 特定配置
  const providerSettings = JSON.parse(
    fs.readFileSync(path.join(claudeDir, 'ccai', `settings-${provider}.json`), 'utf-8')
  )

  // 合并配置（provider 配置优先级更高）
  const merged = {
    ...defaultSettings,
    ...providerSettings,
    // 合并 env 字段
    env: {
      ...defaultSettings.env,
      ...providerSettings.env,
    },
  }

  // 写入临时文件
  const tempPath = path.join(os.tmpdir(), `ccai-settings-${provider}.json`)
  fs.writeFileSync(tempPath, JSON.stringify(merged, null, 2))

  return tempPath
}
```

#### 2.2 系统提示词合并器

**设计原则**：

不再为每个 Provider 维护独立的 `system-prompt.md`，而是：
1. **统一基础提示词**：所有 Provider 共享同一个基础系统提示词
2. **任务类型增强**：根据任务特征，动态追加专属的增强提示词

**实现方式**：

```typescript
export interface PromptMergeOptions {
  provider: string
  taskType?: 'web-scraping' | 'code-generation' | 'data-processing' | 'code-analysis' | 'documentation-research' | 'visual-inspection'
  customPrompts?: string[]  // 用户自定义的额外提示词
}

export function mergeSystemPrompts(options: PromptMergeOptions): string {
  const claudeDir = path.join(os.homedir(), '.claude')
  const prompts: string[] = []

  // 1. 基础系统提示词（统一）
  const basePromptPath = path.join(claudeDir, 'skills', 'ai-delegation', 'SKILL.md')
  if (fs.existsSync(basePromptPath)) {
    prompts.push(fs.readFileSync(basePromptPath, 'utf-8'))
  }

  // 2. 任务类型专属增强提示词
  if (options.taskType) {
    const examplePath = path.join(
      claudeDir,
      'skills',
      'ai-delegation',
      'examples',
      `${options.taskType}.md`
    )
    if (fs.existsSync(examplePath)) {
      prompts.push(fs.readFileSync(examplePath, 'utf-8'))
    }
  }

  // 3. Provider 特定的配置提示（从 settings 中读取）
  const settingsPath = path.join(claudeDir, 'ccai', `settings-${options.provider}.json`)
  if (fs.existsSync(settingsPath)) {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    if (settings.ccai?.promptAdditions) {
      prompts.push(settings.ccai.promptAdditions)
    }
  }

  // 4. 用户自定义额外提示词
  if (options.customPrompts) {
    prompts.push(...options.customPrompts)
  }

  // 5. 日志记录要求
  prompts.push(getLogRequirementPrompt(options.provider))

  // 合并所有提示词，用分隔符分开
  return prompts.join('\n\n---\n\n')
}

function getLogRequirementPrompt(provider: string): string {
  return `
## 工作日志记录要求

你必须在任务完成后，将完整的工作过程记录到日志文件：

**日志路径**：\`~/.claude/ccai/log/${provider}-\${TIMESTAMP}.md\`
- TIMESTAMP 格式：YYYY-MM-DD_HH-mm-ss

**必须包含**：
1. 任务描述
2. 执行计划
3. 工具调用记录（可简化）
4. 遇到的问题和解决方案
5. 最终结果
6. 性能指标（耗时、Token、成功率）

详细格式请参考日志记录机制说明。
`
}
```

**Provider settings 配置示例**：

```json
{
  "ccai": {
    "name": "glm",
    "description": "擅长 data-processing 和 code-generation",
    "promptAdditions": "## GLM-4 特殊说明\n\n你是 GLM-4 模型，擅长处理批量任务和工具调用。\n请充分利用并行工具调用能力，提高执行效率。"
  },
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "xxx",
    "ANTHROPIC_BASE_URL": "https://xxx/api"
  }
}
```

#### 2.3 命令调用（更新后）

```typescript
export function executeAI(provider: string, task: string, options?: {
  taskType?: PromptMergeOptions['taskType']
}) {
  // 1. 合并 Settings
  const settingsPath = mergeSettings(provider)

  // 2. 合并系统提示词
  const systemPrompt = mergeSystemPrompts({
    provider,
    taskType: options?.taskType,
  })

  // 3. 写入临时提示词文件
  const promptPath = path.join(os.tmpdir(), `ccai-prompt-${provider}.md`)
  fs.writeFileSync(promptPath, systemPrompt, 'utf-8')

  // 4. 执行 Claude
  execSync(`claude --dangerously-skip-permissions \
    --settings ${settingsPath} \
    --output-format json \
    --system-prompt "$(< ${promptPath})" \
    -p "${task}"`, { stdio: 'inherit' })
}
```

**任务类型自动检测**：

可以在 `/ccai` 智能路由命令中，让主 Claude 会话分析任务并确定 taskType：

```markdown
# 在 ccai.md 中

**Step 2: 分析任务类型**

请分析用户任务，确定任务类型：
- web-scraping: 涉及网页抓取、文档下载
- code-generation: 生成代码文件
- data-processing: 数据转换、批量处理
- code-analysis: 代码分析、搜索引用
- documentation-research: 文档研究、技术调研
- visual-inspection: UI 检查、截图分析

**Step 3: 调用 Provider**

使用 ccai CLI 工具调用选中的 Provider：

\`\`\`bash
ccai execute glm --task-type web-scraping "$(< /tmp/task.md)"
\`\`\`
```

**CLI 命令**：

```bash
# ccai CLI 新增命令
npx ccai execute <provider> [options]

Options:
  --task-type <type>     Task type for prompt enhancement
  --prompt <file>        Additional prompt file to append
  --no-log               Disable task logging
```

**优点**：
- ✅ **DRY 原则**：统一的基础提示词，避免重复维护
- ✅ **灵活性**：根据任务类型动态组合提示词
- ✅ **可扩展**：轻松添加新的任务类型增强
- ✅ **Provider 定制**：允许 Provider 特定的提示词补充
- ✅ **类型安全**：通过 TypeScript 类型约束任务类型

### 已解决的设计问题

1. ✅ **命令前缀确定**：
   - 采用 `/ccai-glm` 连字符方案
   - 避免与 Claude Plugin 语法混淆

2. ✅ **路由策略格式**：
   - 使用 Markdown 格式（`~/.claude/ccai/routing.md`）
   - 作为系统提示词的一部分注入
   - 用户可用自然语言描述策略

3. ✅ **打包方案**：
   - 使用 Rolldown 进行打包
   - 模板文件内嵌为虚拟模块
   - 单文件输出，便于分发

### 待实现的功能细节

1. **核心功能模块**：
   - [ ] `mergeSettings(provider)` - Settings 混合器
   - [ ] `mergeSystemPrompts(options)` - 系统提示词合并器
   - [ ] `executeAI(provider, task, options)` - Provider 执行器
   - [ ] 模板占位符替换引擎（`{{PROVIDER}}` → 实际值）

2. **日志和评估系统**：
   - [ ] 任务日志自动记录到 `~/.claude/ccai/log/`
   - [ ] `/ccaieval` 命令实现
   - [ ] 日志解析和统计分析
   - [ ] routing.md 自动更新机制
   - [ ] 一周未评估自动提示逻辑

3. **智能路由实现**：
   - [ ] 实现多 Provider 并行调用获取计划的机制
   - [ ] 设计计划评估算法（成本、质量、速度权重）
   - [ ] 任务类型自动检测
   - [ ] 决定是否需要用户确认选择的 Provider

4. **用户体验优化**：
   - [ ] `ccai add` 提供交互式配置向导
   - [ ] API Key 安全存储（考虑使用系统 keychain）
   - [ ] 支持环境变量覆盖配置
   - [ ] 彩色终端输出和进度提示

5. **更新机制**：
   - [ ] 检测本地与远程版本差异
   - [ ] 智能合并：保留用户自定义，更新系统文件
   - [ ] 提供版本回滚功能

6. **CLI 命令实现**：

**用户命令**：
   - [ ] `npx ccai init` - 初始化安装
     - 复制所有模板文件到 `~/.claude/`
     - 创建必要的目录结构
   - [ ] `npx ccai add <provider>` - 添加提供商
     - 从模板生成 `settings-{provider}.json`
     - 生成 `ccai-{provider}.md` 命令文件
     - 提示用户编辑配置
   - [ ] `npx ccai list` - 列出已配置的提供商
     - 扫描 `~/.claude/ccai/settings-*.json`
     - 显示每个 provider 的状态（enabled/disabled）、名称、描述
   - [ ] `npx ccai enable <provider>` - 启用指定提供商
     - 修改 `~/.claude/ccai/settings-{provider}.json`
     - 设置 `ccai.disabled: false`
   - [ ] `npx ccai disable <provider>` - 禁用指定提供商
     - 修改 `~/.claude/ccai/settings-{provider}.json`
     - 设置 `ccai.disabled: true`
     - 禁用后该 provider 不会出现在智能路由的选项中
   - [ ] `npx ccai get <provider>` - 查看提供商配置
     - 打印配置文件路径：`~/.claude/ccai/settings-{provider}.json`
     - 打印完整配置内容（格式化 JSON）
     - 用于调试和检查配置
   - [ ] `npx ccai update` - 更新模板
     - 检测本地与 npm 包版本差异
     - 智能合并：保留用户自定义，更新系统文件

**内部命令**（供命令文件调用）：
   - [ ] `npx ccai merge-settings <provider>` - 生成合并配置
     - 合并 `~/.claude/settings.json` 和 `~/.claude/ccai/settings-{provider}.json`
     - 输出临时文件路径到 stdout
     - 在 `ccai-{provider}.md` 中调用：`claude --settings "$(ccai merge-settings glm)"`
   - [ ] `npx ccai merge-prompts <provider>` - 生成合并提示词
     - 合并基础 SKILL.md + task-type 增强 + provider 配置的 systemPrompt
     - 输出合并后的提示词内容到 stdout
     - 在 `ccai-{provider}.md` 中调用：`--system-prompt "$(ccai merge-prompts glm)"`

7. **模板系统**：
   - [ ] 实现构建时模板扫描脚本
   - [ ] 生成 TypeScript 类型定义
   - [ ] 模板动态占位符替换
   - [ ] 验证 Rolldown 虚拟模块支持

### 下一步行动

**阶段一：核心设计（已完成）**
1. ✅ 记录会议纪要
2. ✅ 确定命令前缀方案（`/ccai-glm`）
3. ✅ 设计 settings.json 混合机制
4. ✅ 设计路由策略方案（Markdown 格式）
5. ✅ 确定打包方案（Rolldown）

**阶段二：项目初始化（进行中）**
1. ⏳ 初始化 npm 包项目结构
2. ⏳ 配置 TypeScript + Rolldown
3. ⏳ 设置开发环境和工具链

**阶段三：核心功能开发**
1. ⏳ 实现 `installer.ts` - 文件安装逻辑
2. ⏳ 实现 `merger.ts` - Settings 混合逻辑
3. ⏳ 实现 `executor.ts` - Provider 执行器
4. ⏳ 实现 CLI 命令：
   - `init` - 初始化安装
   - `add` - 添加提供商
   - `list` - 列出提供商
   - `config` - 配置管理
   - `update` - 更新同步

**阶段四：高级功能**
1. ⏳ 实现智能路由机制
2. ⏳ 创建路由策略模板
3. ⏳ 实现测试命令

**阶段五：测试与发布**
1. ⏳ 编写单元测试（Vitest）
2. ⏳ 编写集成测试
3. ⏳ 完善 README 文档
4. ⏳ 发布到 npm

### 技术栈

- **语言**：TypeScript
- **CLI 框架**：Commander.js（轻量级，符合 KISS 原则）
- **构建工具**：Rolldown（单文件打包，模板内嵌）
- **测试**：Vitest
- **工具库**：
  - `@gaubee/nodekit` - Node.js 工具函数
  - `zod` - 配置验证和类型安全
  - `picocolors` - 终端颜色输出

### 设计原则遵循

本次讨论和方案设计中遵循的原则：

- **KISS**：命令行接口简洁，核心功能清晰
- **YAGNI**：只实现当前明确需要的功能，路由策略等高级特性作为可选
- **SRP**：每个命令、模块职责单一明确
- **OCP**：通过配置文件扩展提供商，无需修改代码
- **DRY**：共享 ai-delegation skill，避免重复逻辑

---

## 会议总结

### 核心决策汇总

1. **项目定位**：从 Claude Code 插件改为 npm 包（`ccai`）
2. **命令命名**：
   - 智能路由：`/ccai`
   - 精确控制：`/ccai-{provider}`（如 `/ccai-glm`）
3. **配置混合**：用户配置 + 默认配置 → 临时文件
4. **路由策略**：Markdown 格式，作为系统提示词注入
5. **打包方案**：Rolldown 单文件输出，模板内嵌

### 关键创新点

- **Markdown 路由策略**：用自然语言描述路由规则，LLM 可直接理解
- **Settings 混合机制**：保持用户配置独立，避免污染默认配置
- **模板内嵌打包**：单一可执行文件，无需额外资源文件
- **双模式命令**：精确控制 + 智能路由，满足不同场景需求

### 下一步重点

**立即开始**：
1. 初始化 npm 项目结构
2. 实现核心的 installer 和 merger 模块
3. 创建命令模板文件

**后续迭代**：
1. 完善智能路由机制
2. 添加更多 AI Provider 支持
3. 优化用户体验（交互式向导、错误提示等）

---

*最后更新：2025-10-29*
