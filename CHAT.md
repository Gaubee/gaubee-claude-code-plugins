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
- **首选**：GLM（擅长工具调用，成本低）
- **备选**：MiniMax
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
    │   ├── ccai.md
    │   ├── ccai-glm.md
    │   └── ccai-minimax.md
    ├── skills/
    │   └── ai-delegation/
    │       ├── SKILL.md
    │       └── examples/
    └── providers/
        ├── glm/
        │   ├── system-prompt.md
        │   └── settings.example.json
        └── minimax/
            ├── system-prompt.md
            └── settings.example.json
```

**Rolldown 打包配置**：

使用 Rolldown 进行打包，生成单一可执行文件，并内嵌模板资源。

**rolldown.config.ts**：
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

1. **智能路由实现**：
   - [ ] 实现多 Provider 并行调用获取计划的机制
   - [ ] 设计计划评估算法（成本、质量、速度权重）
   - [ ] 决定是否需要用户确认选择的 Provider

2. **用户体验优化**：
   - [ ] `ccai add` 提供交互式配置向导
   - [ ] API Key 安全存储（考虑使用系统 keychain）
   - [ ] 支持环境变量覆盖配置

3. **更新机制**：
   - [ ] 检测本地与远程版本差异
   - [ ] 智能合并：保留用户自定义，更新系统文件
   - [ ] 提供版本回滚功能

4. **CLI 命令实现**：
   - [ ] `npx ccai init` - 初始化安装
   - [ ] `npx ccai add <provider>` - 添加提供商
   - [ ] `npx ccai list` - 列出已配置的提供商
   - [ ] `npx ccai config <provider>` - 配置提供商
   - [ ] `npx ccai update` - 更新模板
   - [ ] `npx ccai test <provider>` - 测试连接

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
