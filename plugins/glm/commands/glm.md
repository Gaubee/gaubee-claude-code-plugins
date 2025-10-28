---
description: Delegate task to GLM-4.6 for cost-efficient execution (invoked by glm-delegation skill or user)
---

You are delegating a task to GLM-4.6 for execution.

## Context

This command is used when:
- The task is tool-intensive (many Read/Write/WebFetch/Grep operations)
- The task has clear boundaries (well-defined inputs/outputs)
- Verification is simple (file list, spot-check, statistics)
- Cost(Delegation + Verification) < Cost(Direct Execution)

Refer to `~/.claude/skills/glm-delegation/SKILL.md` for decision criteria.

## Execution Steps

**Step 1: Prepare Task Prompt**

Write **Task Description(`$ARGUMENTS`)** to `/tmp/ai-task.md`
> Use bash: `cat > /tmp/ai-task.md << 'EOF' ...` to write file.

**Important**: If the task requires technical documentation (e.g., Zod API, React patterns), you MUST provide it in the prompt:
- Documentation URLs (for AI to use WebFetch)
- Local file paths (for AI to use Read)
- Or embed key API definitions directly

**Step 2: Execute GLM-4.6 via Bash**

Run the following command:

```bash
claude --dangerously-skip-permissions --settings ~/.claude/settings-glm.json --output-format json --system-prompt "$(< ~/.claude/skills/glm-delegation/SKILL.md)" -p "$(< /tmp/ai-task.md)"
```

If our task can find similar examples in `~/.claude/skills/glm-delegation/examples/*.md`, we can use `--append-system-prompt "$(< example.md)"` to supplement the system-prompt

**Step 3: Return Results**

The GLM-4.6 output will be displayed. Your job is to:
1. Review the output
2. Perform quick verification (as described in the output)
3. Report completion status to the user

## Verification Guidance

After GLM-4.6 completes:
- **File operations**: Use `ls -lh` to verify files were created
- **Code generation**: Spot-check 2-3 files with `cat` or `head`
- **Data processing**: Compare statistics (counts, sizes)
- **Web scraping**: Check file count and sample content

If issues are found, you can delegate a follow-up correction task.

## Task Description(`$ARGUMENTS`)

$ARGUMENTS
