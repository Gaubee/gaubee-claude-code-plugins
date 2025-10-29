---
description: Evaluate AI providers performance and update routing strategy
---

You are evaluating AI providers' recent performance to update the routing strategy.

## Execution Steps

**Step 1: Collect Logs**

Scan `~/.claude/ccai/log/` directory for task logs from the last 7 days:

```bash
find ~/.claude/ccai/log -name "*.md" -mtime -7
```

**Step 2: Analyze Logs**

For each provider, analyze the logs and calculate:

1. **Success Rate**: Completed tasks / Total tasks
2. **Average Duration**: Mean execution time across all tasks
3. **Average Cost**: Estimated based on token consumption
4. **Task Type Distribution**: Performance by task type

Use the Read tool to read log files and extract key metrics.

**Step 3: Generate Evaluation Report**

Create a structured evaluation report:

```markdown
# Provider Performance Report - YYYY-MM-DD

## Summary Statistics

| Provider  | Tasks | Success Rate | Avg Duration | Avg Cost | Best For   |
| --------- | ----- | ------------ | ------------ | -------- | ---------- |
| Provider1 | N     | X%           | Xm Xs        | $X.XX    | Task types |
| Provider2 | N     | X%           | Xm Xs        | $X.XX    | Task types |

## Detailed Analysis

### Provider 1

- **Strengths**: Description of observed strengths
- **Weaknesses**: Description of observed weaknesses
- **Recommendation**: Usage recommendations

### Provider 2

- **Strengths**: Description of observed strengths
- **Weaknesses**: Description of observed weaknesses
- **Recommendation**: Usage recommendations

## Routing Strategy Updates

Based on the analysis, the following changes are recommended:

1. **Task Type 1**: Preferred provider and reasoning
2. **Task Type 2**: Preferred provider and reasoning
3. **Task Type 3**: Preferred provider and reasoning
```

**Step 4: Update routing.md**

Use the Edit tool to update `~/.claude/ccai/routing.md`:

1. Update provider capability descriptions based on actual performance
2. Update task type matching rules
3. Update evaluation history section:
   - Last Evaluation Time: Current timestamp
   - Last Evaluation Based On: List of log files analyzed
   - Next Recommended Evaluation: 7 days from now

**Step 5: Notify User**

Inform the user:

```
✅ Routing strategy updated

📄 Evaluation Report: ~/.claude/ccai/routing-eval-YYYY-MM-DD.md
📝 Strategy File: ~/.claude/ccai/routing.md

⚠️  Important: Restart Claude Code to load the new routing strategy
    Use Cmd+Q (macOS) or Ctrl+Q (Linux/Windows) to exit and restart
```

**Step 6: Save Evaluation Report**

Save the complete evaluation report to:
`~/.claude/ccai/routing-eval-YYYY-MM-DD.md`

## Notes

- If fewer than 5 log files found, notify user that more data is needed
- Support manual time range: Analyze logs based on user-specified days
- Handle missing or malformed log files gracefully
- Provide actionable recommendations based on data
