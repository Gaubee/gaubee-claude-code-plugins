# CCAI - Claude Code AI 助手

[![npm version](https://badge.fury.io/js/ccai.svg)](https://www.npmjs.com/package/ccai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](./README.md) | 中文

**CCAI** 是一个为 Claude Code 设计的智能 AI 提供商管理和路由工具,帮助您高效地将工具密集型任务委托给成本优化的 AI 提供商。

## 特性

- 🚀 **多提供商管理**: 配置和管理多个 AI 提供商(GLM、MiniMax 等)
- 🧠 **智能路由**: 根据任务特征自动选择最佳提供商
- 💰 **成本优化**: 将任务路由到成本效益高的提供商进行批量操作
- 📊 **性能追踪**: 记录和分析提供商的性能表现
- 🔄 **轻松更新**: 无缝更新提供商配置和路由策略
- 🛠️ **类型安全**: 使用 TypeScript 构建,提供完整的类型安全

## 安装

```bash
npx ccai init
```

这将把 CCAI 模板安装到您的 `~/.claude` 目录。

## 快速开始

### 1. 添加提供商

```bash
npx ccai add glm
```

这会在 `~/.claude/ccai/settings-glm.json` 创建配置文件。

### 2. 配置提供商设置

编辑提供商配置:

```bash
npx ccai get glm
```

使用您的提供商 API 密钥和设置更新配置文件:

```json
{
  "ccai": {
    "name": "GLM",
    "description": "GLM-4.6 模型,擅长工具调用和批量处理",
    "systemPrompt": "## GLM 模型\n\n你是 GLM-4.6,针对...",
    "disabled": false
  },
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "your-api-key-here",
    "ANTHROPIC_BASE_URL": "https://open.bigmodel.cn/api/paas/v4/",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  }
}
```

### 3. 启用提供商

```bash
npx ccai enable glm
```

这会在 Claude Code 中生成 `/ccai-glm` 命令。

### 4. 在 Claude Code 中使用

**直接执行:**

```
/ccai-glm "从 10 个 URL 获取文档并总结要点"
```

**智能路由:**

```
/ccai "处理 100 个 CSV 文件并生成摘要报告"
```

智能路由器会分析任务并选择最合适的提供商。

## CLI 命令

### 用户命令

- `npx ccai init` - 初始化 CCAI 模板
- `npx ccai add <provider>` - 添加新提供商
- `npx ccai list` - 列出所有配置的提供商
- `npx ccai get <provider>` - 查看提供商配置
- `npx ccai enable <provider>` - 启用提供商
- `npx ccai disable <provider>` - 禁用提供商
- `npx ccai update` - 更新命令文件

### 内部命令(由 Claude Code 使用)

- `npx ccai merge-settings <provider>` - 合并提供商设置
- `npx ccai merge-prompts --provider <name>` - 合并系统提示词

## 架构

### 目录结构

```
~/.claude/
├── ccai/
│   ├── settings-glm.json          # GLM 配置
│   ├── settings-minimax.json      # MiniMax 配置
│   ├── routing.md                 # 路由策略
│   └── log/                       # 任务执行日志
├── commands/
│   ├── ccai.md                    # 智能路由命令
│   ├── ccai-glm.md                # GLM 直接命令
│   ├── ccai-minimax.md            # MiniMax 直接命令
│   └── ccaieval.md                # 性能评估命令
└── skills/
    └── ccai/
        ├── SKILL.md               # 委托指南
        └── examples/              # 任务特定示例
```

### 配置模式

```typescript
interface ProviderSettings {
  ccai: {
    name?: string; // 显示名称
    description?: string; // 能力描述
    systemPrompt?: string; // 提供商特定提示词
    disabled?: boolean; // 启用/禁用状态
  };
  env: {
    ANTHROPIC_AUTH_TOKEN: string;
    ANTHROPIC_BASE_URL: string;
    [key: string]: string;
  };
}
```

## 路由策略

CCAI 使用基于 Markdown 的路由策略(`~/.claude/ccai/routing.md`),描述:

1. **路由原则**: 成本、性能和负载均衡规则
2. **任务类型匹配**: 哪些提供商擅长特定任务类型
3. **提供商能力**: 每个提供商优势的详细描述
4. **特殊规则**: 自定义路由逻辑和约束

路由规则示例:

```markdown
### Web 抓取任务

- **首选**: 具有强大工具调用能力的提供商
- **最大成本**: $0.10
- **评估标准**: 速度 > 成本
```

## 任务类型

CCAI 支持以下任务类型的特定优化:

- 🌐 **web-scraping**: Web 数据提取和文档获取
- 💻 **code-generation**: 生成样板代码和组件
- 📊 **data-processing**: 批量数据转换和分析
- 🔍 **code-analysis**: 代码库搜索和模式检测
- 📚 **documentation-research**: 技术文档研究
- 🎨 **visual-inspection**: UI 测试和截图分析

## 性能评估

分析提供商性能并更新路由策略:

```
/ccaieval
```

此命令会:

1. 收集过去 7 天的任务日志
2. 计算成功率、成本和性能指标
3. 生成建议
4. 使用见解更新 `routing.md`

## 开发

### 前置要求

- Node.js 18+
- pnpm 10+

### 从源码构建

```bash
# 克隆仓库
git clone https://github.com/your-username/ccai.git
cd ccai

# 安装依赖
pnpm install

# 构建
pnpm build

# 测试
pnpm dev
```

### 项目结构

```
ccai/
├── src/
│   ├── cli/              # CLI 实现
│   ├── core/             # 核心模块
│   ├── types/            # 类型定义
│   ├── utils/            # 工具函数
│   └── generated/        # 生成的模板文件
├── scripts/
│   └── generate-templates.ts  # 模板生成器
├── templates/            # 模板文件
│   ├── commands/         # 命令模板
│   ├── skills/           # 技能模板
│   └── ccai/             # 配置模板
└── dist/                 # 构建输出
```

## 设计原则

CCAI 遵循以下核心原则:

- **KISS**(保持简单): 简洁的 CLI 界面和清晰的功能
- **YAGNI**(不需要就不做): 只实现必要的功能
- **DRY**(不要重复): 共享技能和可重用组件
- **SOLID**: 单一职责、可扩展设计、适当抽象

## 贡献

欢迎贡献!请随时提交 Pull Request。

## 许可证

MIT 许可证 - 详见 [LICENSE](./LICENSE)

## 链接

- [文档](./docs)
- [GitHub 仓库](https://github.com/your-username/ccai)
- [问题追踪](https://github.com/your-username/ccai/issues)
- [NPM 包](https://www.npmjs.com/package/ccai)
