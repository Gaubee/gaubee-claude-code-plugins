## DONE

---

1. 配置oxlint和prettier来提高项目代码的一致性
2. 将 templates/skills/ai-delegation 改成 templates/skills/ccai

---

1.  `templates/skills/ccai/SKILL.md` 的目的是让 claude code 的主模型知道：它可以使用 `/ccai-provider` 来派遣任务(建议`run in background`)

- 充分阅读 [Claude Code Skills](./references/claude-code/skills.md) 文档
- 创建专门的 `templates/skills/ccai/system-prompt.md`
- 强调 MCP 工具优先（chrome-devtools-mcp > WebFetch）
- 强调不能交互、必须独立完成
- 网页抓取使用 chrome-devtools-mcp
- UI 工作基于客观工具和脚本
- 更新 `SKILL.md` 符合 Skills 规范（添加 YAML frontmatter）
- 更新 `merger.ts` 使用 system-prompt.md 而不是 SKILL.md 2. `templates/skills/ccai/system-prompt.md` 告诉模型优先使用 MCP 工具，`templates/skills/ccai/examples/*.md` 针对特定领域做补充建议

---

## TODO

---

1.  提升测试覆盖率，特别是 commands，基于 dryRun 来编写测试

- 更新命令函数支持 OperationContext 参数
  - add.command.ts: 导出 `addProvider(provider, options, context?)` 函数
  - enable.command.ts: 导出 `enableProvider(provider, options, context?)` 函数
  - disable.command.ts: 导出 `disableProvider(provider, options, context?)` 函数
- 创建基于 dryRun 的测试文件
  - add.command.test.ts: 4 个测试用例（创建、覆盖、force flag、模板替换）
  - enable.command.test.ts: 3 个测试用例（启用、skipUpdate、幂等性）
  - disable.command.test.ts: 3 个测试用例（禁用、skipUpdate、幂等性）
  - list.command.test.ts: 4 个测试用例（空列表、列表展示、verbose、缺失配置）
  - init.command.test.ts: 4 个测试用例（正常安装、dry-run、force、操作摘要）
- 测试覆盖率提升
  - 总体覆盖率：29.81% → 41.13% (+11.32%)
  - commands 模块：0% → 33.52% (+33.52%)
  - 新增测试用例：41 → 59 (+18 个)
  - 所有测试通过 ✅

---
