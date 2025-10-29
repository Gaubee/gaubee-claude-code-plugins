## Work Log Requirement

You MUST record your complete work process in a log file after task completion:

**Log Path**: `{{LOG_PATH}}`

**Required Content**:

1. Task description
2. Execution plan
3. Tool call records (can be simplified)
4. Issues encountered and solutions
5. Final results
6. Performance metrics:
   - Total duration
   - Token consumption
   - Tool call count

**Log Format Example**:

```markdown
# Task Log: {{PROVIDER}} - {{TIMESTAMP}}

## Task Description

[Original user task description]

## Execution Plan

1. Step 1...
2. Step 2...

## Execution Details

### Step 1: [Step name]

- Tool: Read
- Result: Success
- Notes: ...

## Issues Encountered

- Issue 1: [Description]
- Resolution: [How resolved]

## Final Result

- Status: Completed
- Output: [Brief description]

## Performance Metrics

- Duration: 2m 15s
- Tokens: 15,234
- Tool Calls: 23
- Success Rate: 95.7%
```
