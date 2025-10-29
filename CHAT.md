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
> @TODO 建议使用 `/ccai-glm`,因为`/ccai:glm`这种语法会令人误以为是claude-plugin
1. **精确控制**：`/ccai:glm` 或 `/ccai-glm`
   - 直接调用指定提供商
   - 用户完全控制使用哪个模型

2. **智能路由**：`/ccai`
   - 同时调用多个提供商
   - 每个提供商列出执行计划
   - 选择最符合预期的计划
   - 将任务和计划交给选中的提供商执行
   - 支持用户自定义路由策略文档

**命名讨论**：
- 需要确定前缀：`/ccai:glm` vs `/ccai-glm` vs 其他？

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
```json
{
  "ccai": {
    "name": "glm",
    "discription": "擅长 data-processing 和 code-generation",
  },
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "xxx",
    "ANTHROPIC_BASE_URL": "https://xxx/api",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  },
}
```

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
> @TODO 改成 markdown，作为提示词的一部分来提供给 `/ccai` 的命令。使用md会更加灵活，用户配置起来也更加方便
```json
{
  "routing": {
    "strategy": "auto|manual|balanced",
    "rules": [
      {
        "taskType": "web-scraping",
        "preferredProviders": ["glm"],
        "maxCost": 0.1
      },
      {
        "taskType": "code-generation",
        "preferredProviders": ["glm", "minimax"],
        "evaluationCriteria": ["quality", "speed"]
      }
    ]
  }
}
```

### 技术实现要点

#### 1. NPM 包结构

```
ccai/
├── package.json
├── bin/
│   └── ccai.js              # CLI 入口
├── src/
│   ├── commands/
│   │   ├── init.ts          # 初始化安装
│   │   ├── add.ts           # 添加提供商
│   │   ├── update.ts        # 更新同步
│   │   ├── config.ts        # 配置管理
│   │   └── list.ts          # 列出提供商
│   ├── core/
│   │   ├── installer.ts     # 文件安装逻辑
│   │   ├── merger.ts        # JSON 混合逻辑
│   │   └── router.ts        # 路由逻辑
│   └── templates/
│       ├── commands/
│       ├── skills/
│       └── providers/
└── templates/               # 源模板文件
    ├── commands/
    │   ├── ai.md
    │   └── ai-glm.md
    ├── skills/
    │   └── ai-delegation/
    └── providers/
        ├── glm/
        └── minimax/
```

> @TODO 使用 rolldown 来进行打包

#### 2. 关键功能实现

**JSON 混合器**：
```typescript
import { merge } from 'lodash'
import os from 'os'
import path from 'path'
import fs from 'fs'

export function mergeSettings(provider: string): string {
  const claudeDir = path.join(os.homedir(), '.claude')
  const defaultSettings = JSON.parse(
    fs.readFileSync(path.join(claudeDir, 'settings.json'), 'utf-8')
  )
  const providerSettings = JSON.parse(
    fs.readFileSync(path.join(claudeDir, 'ccai', `settings-${provider}.json`), 'utf-8')
  )

  const merged = merge({}, defaultSettings, providerSettings)
  const tempPath = path.join(os.tmpdir(), `ccai-settings-${provider}.json`)
  fs.writeFileSync(tempPath, JSON.stringify(merged, null, 2))

  return tempPath
}
```

**命令调用**：
```typescript
export function executeAI(provider: string, task: string) {
  const settingsPath = mergeSettings(provider)
  const systemPromptPath = path.join(
    os.homedir(),
    '.claude',
    'providers',
    provider,
    'system-prompt.md'
  )

  execSync(`claude --dangerously-skip-permissions \
    --settings ${settingsPath} \
    --output-format json \
    --system-prompt "$(< ${systemPromptPath})" \
    -p "${task}"`, { stdio: 'inherit' })
}
```

### 待解决问题

1. **命令前缀确定**：
   - `/ai:glm` - 使用冒号分隔
   - `/ai-glm` - 使用连字符分隔
   - `/ai.glm` - 使用点号分隔
   - 其他方案？

2. **智能路由实现细节**：
   - 如何并行调用多个提供商获取计划？
   - 计划评估标准如何量化？
   - 是否需要用户确认选择的提供商？

3. **用户体验优化**：
   - 是否在 `ccai add` 时提供交互式配置向导？
   - 如何处理 API Key 的安全存储？
   - 是否支持环境变量配置？

4. **更新机制**：
   - 如何检测本地版本和远程版本差异？
   - 更新时是否覆盖用户自定义的文件？
   - 是否支持版本回滚？

### 下一步行动

1. ✅ 记录会议纪要
2. ⏳ 确定命令前缀方案
3. ⏳ 设计 settings.json 混合机制的详细实现
4. ⏳ 设计智能路由的实现方案
5. ⏳ 初始化 npm 包项目结构
6. ⏳ 实现核心功能模块

### 技术栈

- **语言**：TypeScript
- **CLI 框架**：待定（commander.js / yargs / oclif）
- **构建工具**：tsdown / rolldown
- **测试**：vitest
- **工具库**：
  - `@gaubee/nodekit` - 工具函数
  - `lodash` - JSON 合并
  - `zod` - 配置验证

### 设计原则遵循

本次讨论和方案设计中遵循的原则：

- **KISS**：命令行接口简洁，核心功能清晰
- **YAGNI**：只实现当前明确需要的功能，���由策略等高级特性作为可选
- **SRP**：每个命令、模块职责单一明确
- **OCP**：通过配置文件扩展提供商，无需修改代码
- **DRY**：共享 ai-delegation skill，避免重复逻辑
