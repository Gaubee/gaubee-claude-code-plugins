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
{
  "type": "result",
  "subtype": "success",
  "is_error": false,
  "duration_ms": 41973,
  "duration_api_ms": 34735,
  "num_turns": 32,
  "result": "",
  "session_id": "26283f86-1bdd-4e8c-99cd-493c95c7e074",
  "total_cost_usd": 0.017215,
  "usage": {
    "input_tokens": 0,
    "cache_creation_input_tokens": 0,
    "cache_read_input_tokens": 0,
    "output_tokens": 1005,
    "server_tool_use": { "web_search_requests": 0 },
    "service_tier": "standard",
    "cache_creation": { "ephemeral_1h_input_tokens": 0, "ephemeral_5m_input_tokens": 0 }
  },
  "modelUsage": {
    "claude-haiku-4-5-20251001": {
      "inputTokens": 0,
      "outputTokens": 428,
      "cacheReadInputTokens": 0,
      "cacheCreationInputTokens": 0,
      "webSearchRequests": 0,
      "costUSD": 0.00214,
      "contextWindow": 200000
    },
    "minimax-m2": {
      "inputTokens": 0,
      "outputTokens": 1005,
      "cacheReadInputTokens": 0,
      "cacheCreationInputTokens": 0,
      "webSearchRequests": 0,
      "costUSD": 0.015075000000000002,
      "contextWindow": 200000
    }
  },
  "permission_denials": [],
  "uuid": "40740e09-d006-4adf-8abe-7fb9d83b44db"
}
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

1. run.command.ts 新增一个options： --print-command，意味着不执行命令，而是打印最终要执行的 claude-code 命令。
2. 支持 `--print-command=json`，那么打印JSON-Array结构，方便测试。并基于此，去完善我们的测试，提升测试覆盖率。
3. 就是默认情况下 --print-command=bash，支持 `bash|ps|json|text` 这几种输出，如果是bash，就是把 --system-prompt 后面巨大的参数内容，变成 "($< filepath)"这种方式。
   不过如果是text，还是得考虑一下转义的问题，因为有人可能会用 `ccai run --print-command=text > xxx.sh` 的方式去转存命令
4. 我们的系统提示词的注入，也到在最后再去做注入，类似于 `args: ['--print-command',"{{CCAI_SYSTEM_PROMPT}}"]`，然后如果是`printCommand==false`，那么就直接换成我们的 `readFile(system_prompt)`，否则根据`printCommand`的类型，去替换`{{CCAI_SYSTEM_PROMPT}}`
5. 在printCommand模式下，如果没有提供prompts，那么不该进入`Interactive Mode`，而是直接省略`-p`参数。同时默认的logger的打印也不该有（比如`ℹ Executing task with provider: glm`这样的内容都不应该出现）

---

我要在 settings-provider.json.template 中支持三种自定义: 可以自定义 command+args；可以自定义输入的inputSchema，可以自定义outputSchema

这里需要再一些情况，就是我们`ccai run`是支持一些参数的，比如 `--log`，那么它是会改变 `--output-format`的，所以这种情况下，我们最好在语法上支持简单的表达式，或者支持变体匹配。我修改了templates/ccai/settings-provider.json.template ，将缺省参数加上了`//`前缀，我个人这样可能会好一些，用户如果有需求就自己删除`//`前缀就好。另外我简单加了变体匹配的语法，你看看有没有更好的选择。

还是按我这种简单占位符的写法吧，如果要加入表达式，还不如让开发自己写一个sh脚本去做来的方便。

```json
{
  "{{log}}+{{prettyJson}}": {
    "true+true": ["json-stream"],
    "false+false": ["json"],
    "*": ["json"]
  },
  "{{somestr}}": {
    "{true|false}": ["{{ABC}}"],
    "null": ["aa"]
  }
}
```

1. 这里第一层是表达式，可以多个表达式，我们通过替换来获得“实际值”。
2. 第二层是用来 match 的，支持 glob 语法，所以我能写 `*`
3. 第三层是一个数组，也就是我们最终要进行拼接的 ARGS。
4. 如果一个表达式没有任何符合的匹配，那么就是空数组，等价于`"*":[]`。

执行的逻辑是先处理这种表达式匹配，将`command.args:Array<string|VarMatchs>`变成我们目前的这种简单的 `command.args:Array<string>`
然后再遍历 `command.args:Array<string>` 做匹配替换，得到我们最终要执行的命令。

接下来，我需要你在 `ccai add <provider>` 这个命令中，增加一个`--command={claude,gemini,codex}`这三种模板，
gemini 的文档在 `~/.claude/gemini-cli.md`，启动大概是 `gemini --yolo --output-format json --prompt {{TASK}}`（它目前应该是不支持通过外部直接唤醒会话）
codex 的文档在 `~/.claude/codex-cli.md` 和 `~/.claude/codex-cli-exec.md`，启动大概是 `codex --full-auto --ask-for-approval never --sandbox danger-full-access exec  --json {{TASK}} resume "{{SESSION_ID}}"`

---

## TODO

---

很好，我进一步改进了一下 templates/ccai/settings-provider.json.template 文件。接下来，为了确保更好的一致性，我建议将 {{TASK}} 拆分成 {{PROMPT}} 和 {{INPUT}}。
我解释一下，目前的我们在run --help中可以看到：

````
Usage: ccai run [options] [prompt...]

Execute a task with an AI provider

Arguments:
  prompt                    Task prompt (can be multiple arguments, or enter REPL mode if omitted)

Options:
  --provider <provider>     Provider name (e.g., glm, minimax)
  --example <type>          Task type example to enhance prompt
  --session-id <uuid>       Continue from a previous session
  --plan-only               Generate execution plan only (for intelligent routing)
  --log                     Enable detailed logging with stream-json output format (auto-enables verbose)
  --pretty-json             Format JSON output in a human-readable way
  --format [template]       Format output using template (default shows key info)
  --prompt-file <path>      Read prompt from file instead of arguments
  --print-command [format]  Print the final claude command without executing it (text|json|bash|ps)
  -h, --help                display help for command
```

这里我们之所以要将拆分成 {{PROMPT}} 和 {{INPUT}} 两部分，是因为要明确要求 {{INPUT}} 默认是符合 inputSchema 的结构（不是强关联，但至少是我们通过提示词让AI提供的input参数）。
如果我们告诉AI，提示词是：`/ccai-add 帮我算一下1+1`是多少，然后我的 provider=add 的的配置:
```json
{
...
inputSchema:{type:"string","description":"js math expression"},
command:{executable:"node",args:["-e", "console.log({{INPUT}})"]}
...
}
```
那么这里的{{PROMPT}}就是：`/ccai-add 帮我算一下1+1`，而{{INPUT}}则：`1+1`

默认情况下，它们其实是一样的，也就是说：`[··](Usage: ccai run [options] [inputPrompt...])`
如果只是通过 inputPrompt 来传入，那么 `args.input` 和 `args.prompt` 是同样的内容
但是我们可以通过 `--prompt=<content>` 或 `--prompt-file=<path>` 来专门指定 prompt 的内容
也可以可以通过 `--input=<content>` 或 `--input-file=<path>` 来专门指定 input 的内容

也就是说，上面那个例子，最终的效果应该是`ccai run --provider=add --prompt="帮我算一下1+1" --input="1+1"`



---

run.command.ts 的 provider 现在可空，如果为空，那么和直接在主agent中调用claude-code-commands一样： `/ccai [..prompts]`

---

provider的配置文件现在支持自定义command

---

1. 提升测试覆盖率，特别是其他 commands（除 run 外），基于 dryRun 来编写测试

---

1. 我们需要在`ccai-exec.md.template`中提供异常处理的逻辑：基于这些信息返回到主Agent后，如果发现错误，那么它可以基于错误信息，提供修复引导，配合 session_id 来恢复上下文继续工作。有些可能是工具调用失败、错误、有些可能是
2. run 添加 `--log`支持，如果启用`--log`，那么我们将使用`claude --output-format stream-json --verbose -p "..."` 来配置输出。

---

1. run 如果配置了`--pretty-json`，可以使用`util.inspect/format`或者更加专业的格式化库来对打印内容做美化输出。

---

1. run 如果配置了`--format[=custom template]`，所以我们应该基于json内容和模板来做打印。默认打印 type/subtype/result/session_id/is_error/num_turns 等关键信息和统计信息。
   （但是目前还需要收集足够多的结构信息才能知道如何格式化最好。）

---

1. run 添加 `--prompt-file`的支持，方便使用者自己从一个文件导入复杂的prompt，同时也不用开启repl。

---
````
