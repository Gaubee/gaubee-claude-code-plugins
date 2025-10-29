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

1. executeAI 已暴露成 command：`npx ccai run [--provider=<provider>] [--example=<type>] <prompt>`
   - 创建了 `src/cli/commands/run.command.ts` 实现 run 命令
   - 支持 `--provider` 参数指定 AI provider
   - 支持 `--example` 参数指定任务类型（web-scraping, code-generation 等）
   - 在 CLI index 中注册了 run 命令
2. 更新模板提示词使用 `npx ccai run` 替代 `claude --dangerously-skip-permissions`
   - 更新了 `templates/commands/ccai-exec.md.template`
   - 简化的命令语法：`npx ccai run --provider {{PROVIDER}} "$(< task.md)"`
   - 提供了所有任务类型的示例注释
3. 为 run 命令编写测试（run.command.test.ts）
   - 8个测试用例全部通过
   - 测试覆盖参数验证、任务类型验证、多参数组合等场景
4. 所有测试通过（67个测试）

---

1. 实现 REPL 交互模式
   - 创建了 `src/utils/repl.ts` 实现交互式输入
   - 当 run 命令没有提供 prompt 时自动进入 REPL 模式
   - 用户可以输入多行内容：
     - 按 Enter 添加新行
     - 输入 `/submit` 或按 Ctrl+D 提交执行
     - 按 Ctrl+C 取消
   - 更新了 run 命令测试，覆盖 REPL 模式
   - 所有测试通过（67个测试）

**使用示例**：
```bash
# 直接执行（原有方式）
npx ccai run --provider glm "analyze this code"

# 进入 REPL 模式（新增）
npx ccai run --provider glm
> Enter your prompt below.
> Tips:
>   • Press Enter to add a new line
>   • Press Ctrl+D (or type '/submit' on a new line) to submit
>   • Press Ctrl+C to cancel
>
> Please analyze the following code:
  function test() {
    return 42;
  }
  /submit
```

---

因为我们默认的返回结构是json，这是一个样例：
```json
{"type":"result","subtype":"success","is_error":false,"duration_ms":41973,"duration_api_ms":34735,"num_turns":32,"result":"","session_id":"26283f86-1bdd-4e8c-99cd-493c95c7e074","total_cost_usd":0.017215,"usage":{"input_tokens":0,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"output_tokens":1005,"server_tool_use":{"web_search_requests":0},"service_tier":"standard","cache_creation":{"ephemeral_1h_input_tokens":0,"ephemeral_5m_input_tokens":0}},"modelUsage":{"claude-haiku-4-5-20251001":{"inputTokens":0,"outputTokens":428,"cacheReadInputTokens":0,"cacheCreationInputTokens":0,"webSearchRequests":0,"costUSD":0.00214,"contextWindow":200000},"minimax-m2":{"inputTokens":0,"outputTokens":1005,"cacheReadInputTokens":0,"cacheCreationInputTokens":0,"webSearchRequests":0,"costUSD":0.015075000000000002,"contextWindow":200000}},"permission_denials":[],"uuid":"40740e09-d006-4adf-8abe-7fb9d83b44db"}
```
这里有一个session_id，我们可以使用这个session_id传给`claude --session-id <uuid>`来继续当前这个上下文。在有些时候，如果涉及到分步执行，我们就需要这个参数

1. 实现 session-id 和 plan-only 支持
   - 添加 `--session-id <uuid>` 参数支持会话恢复
   - 添加 `--plan-only` 参数支持计划模式
   - 更新 ExecuteOptions 和 PromptMergeOptions schema
   - 在 executor 中处理 session-id 传递给 claude CLI
   - 在 merger 中添加 plan-only 模式的系统提示词
   - 所有测试通过（67个测试）

**智能路由的两阶段模式**：
```bash
# 阶段1：获取执行计划（plan-only）
npx ccai run --provider glm --plan-only "复杂任务描述"
# 返回 JSON 包含 session_id 和执行计划

npx ccai run --provider minimax --plan-only "复杂任务描述"
# 返回 JSON 包含 session_id 和执行计划

# 阶段2：基于评估选择最佳 provider，使用 session-id 继续执行
npx ccai run --provider glm --session-id <uuid-from-plan>
# 继续之前的会话上下文，执行任务
```

**使用场景**：
- `--session-id`：继续之前的会话，保持上下文
- `--plan-only`：只生成执行计划，不实际执行（用于智能路由评估）
- 两者结合：先用 plan-only 获取多个 provider 的计划和 session-id，评估后选择最佳方案，再用 session-id 继续执行

---


## TODO

---

1. 提升测试覆盖率，特别是其他 commands（除 run 外），基于 dryRun 来编写测试

---

1. 我们需要在`ccai-exec.md.template`中提供异常处理的逻辑：基于这些信息返回到主Agent后，如果发现错误，那么它可以基于错误信息，提供修复引导，配合 session_id 来恢复上下文继续工作。有些可能是工具调用失败、错误、有些可能是
2. run 添加 `--log`/`--verbose` 支持，如果启用`--log`，那么我们将使用`claude --output-format stream-json` 来配置输出。这时候我们将对原始内容做详细的输出。如果启用`--verbose`,那么等同于开启`claude --verbose`，这些参数适合开发者手动调用`npx ccai run`的时候开启

---

1. run 如果配置了`--pretty-output`，所以我们应该基于json内容，打印最终 type/subtype/result/session_id/is_error/num_turns 等关键信息和统计信息即可。但是目前还需要收集足够多的结构信息才能知道如何格式化最好。
