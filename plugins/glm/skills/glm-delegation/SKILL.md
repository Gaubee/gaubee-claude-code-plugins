---
name: glm-delegation
description: Automatically identify tool-intensive tasks with clear boundaries and delegate them to GLM-4.6 for cost-efficient execution. Triggers on batch operations (WebFetch, Read, Write, Edit, Bash, MCP, etc.), data processing, code generation, code analysis, and web scraping tasks, chrome-devtools-mcp tasks.
---

# GLM-4.6 Task Delegation Skill

This skill helps you automatically identify tasks suitable for delegation to GLM-4.6, a cost-effective LLM that excels at tool-intensive, well-defined workflows.

## 1. Core Purpose

### 1.1 The Problem

The main Claude session faces rapid context window consumption when performing:
- Batch web scraping (e.g., 50 `WebFetch` calls)
- Batch file operations (e.g., 100 `Read`/`Write`/`Edit` calls)
- Large-scale data processing (multiple transformation steps)

These tasks, while important, quickly bloat the context window.

### 1.2 The Solution

Delegate **tool-intensive** but **clearly-defined** tasks to GLM-4.6:
- GLM-4.6 executes in isolation, preserving your context
- You only need simple verification of results (file list, spot-check, statistics)
- The verification cost is minimal compared to direct execution

### 1.3 Core Characteristics of Delegatable Tasks

#### Well-Defined Boundaries
- **Clear Inputs**: Data sources, URLs, file paths explicitly provided
- **Clear Outputs**: Expected artifacts clearly described
- **Simple Verification**: Results validated with `ls -lh`, spot-checks, or statistics
- **Self-Contained Documentation**: All necessary docs provided (URLs, paths, or embedded)

#### Tool-Intensive
- High volume of tool calls (WebFetch, Read, Write, Edit, Glob, Grep, Bash)
- Would consume significant context if executed directly
- Delegation keeps main session clean

## 2. GLM-4.6 Model Profile

### 2.1 Strengths
- **Proficient Tool User**: Multi-step, tool-driven tasks
- **High-Quality Operations**: Individual operations comparable to Claude Sonnet
- **Cost-Effective**: Ideal for large volumes of repetitive work

### 2.2 Limitations
- **Limited Context**: 200K window (vs. Claude's 1M)
- **Outdated Knowledge**: You **MUST** provide technical documentation
  - Via URLs (for chrome-devtools-mcp or WebFetch)
  - Via local paths (for GLM to use Read)
  - Or embed directly in the prompt
- **Not for Deep Reasoning**: Complex design/strategy stays with main Claude
- **Best for Procedural Tasks**: Mechanical, clearly-defined, process-oriented work

### 2.3 Tool Usage Guidelines for Web Content

**Preferred Approach: chrome-devtools-mcp**

For web scraping, documentation fetching, and visual inspection tasks, **prioritize chrome-devtools-mcp tools** over WebFetch:

1. **Open pages**: Use `mcp__chrome-devtools__new_page` or `mcp__chrome-devtools__navigate_page`
2. **Get content**: Use `mcp__chrome-devtools__take_snapshot` to capture the accessibility tree
3. **Convert**: Transform the snapshot (structured a11y tree) to Markdown or desired format

**Why chrome-devtools-mcp is preferred:**
- ✅ **Real browser environment**: Handles JavaScript-rendered content
- ✅ **Structured content**: Accessibility tree is easier to parse than raw HTML
- ✅ **Better error handling**: Proper timeout, navigation, and state management
- ✅ **Visual capabilities**: Can also take screenshots when needed
- ✅ **Interactive testing**: Can click, fill forms, and interact with pages

**When to use WebFetch:**
- ⚠️ **Fallback only**: When chrome-devtools-mcp is unavailable
- ⚠️ **Simple static pages**: Where JavaScript rendering is not needed
- ⚠️ **API endpoints**: For fetching raw JSON/XML responses

**Example workflow (chrome-devtools-mcp):**
```
1. mcp__chrome-devtools__new_page(url)
2. mcp__chrome-devtools__take_snapshot() → get a11y tree
3. Parse snapshot → extract links, content, structure
4. Convert to Markdown → clean, structured output
5. Write to files
```

**Example workflow (WebFetch fallback):**
```
1. WebFetch(url) → get HTML
2. Parse HTML → extract content
3. Convert to Markdown
4. Write to files
```

## 3. Delegation Decision Criteria

### 3.1 The Sole Criterion

```
Cost(Delegation + Verification) < Cost(Direct Execution)
```

### 3.2 Tasks Suitable for Delegation

✅ **Tool-Intensive**
- Batch operations consuming many tool calls
- Would bloat context if executed directly

✅ **Low Verification Cost**
- Simple checks (file lists, spot-checks, statistics)
- No deep review required
- Output unlikely to need significant modifications

✅ **Clear Boundaries**
- Unambiguous inputs, outputs, acceptance criteria
- All documentation/specs provided upfront

### 3.3 Tasks Unsuitable for Delegation

❌ **Output Requires Deep Refinement**
- "Design a microservices architecture" → Iterative discussion needed
- ✅ Counter-example: "Read 50 architecture docs and summarize" → Only summary quality needs verification

❌ **High Verification Cost**
- "Refactor a core module" → Detailed code review of every change
- ✅ Counter-example: "Batch rename variables" → Spot-check 3-5 files

❌ **Ambiguous Boundaries**
- "Improve project code quality" → No clear standard
- ✅ Counter-example: "Standardize import order" → Clear, objective rule

### 3.4 Cost-Benefit Analysis Table

| Task                                  | Main Agent Cost                           | Delegation + Verification Cost  | Decision           |
| :------------------------------------ | :---------------------------------------- | :------------------------------ | :----------------- |
| Scrape 50 doc pages to Markdown       | 50 `navigate`+`snapshot`+`Write` calls    | Delegate + `ls -lh` check       | ✅ Delegate        |
| Read 30 architecture docs & summarize | 30 `navigate`+`snapshot` + summarization  | Delegate + Read summary         | ✅ Delegate        |
| Batch rename variable in 100 files    | 100 `Read` + `Edit` calls     | Delegate + Spot-check 5 files   | ✅ Delegate        |
| Find all references to a function     | Multiple `Grep`/`Read` calls  | Delegate + Review list          | ✅ Delegate        |
| Design a new architecture             | Medium (Reasoning + Output)   | High (Output + Deep review)     | ❌ Do Not Delegate |
| Refactor a core module                | Medium                        | High (Review every change)      | ❌ Do Not Delegate |

## 4. Automatic Delegation Workflow

When you encounter a task, ask these three questions:

1. **Does it have clear boundaries?** (Clear inputs, outputs, acceptance criteria)
2. **Will it generate many tool calls?** (Consume context rapidly)
3. **Is verification simple?** (No deep review required)

If **all three answers are "yes"**, invoke the `/glm` slash command:

### Step 1: Identify the Task

Recognize patterns like:
- "Scrape all pages from..."
- "Generate 20 files based on..."
- "Find all references to..."
- "Batch process..."
- "Read multiple docs and summarize..."

### Step 2: Prepare the Delegation Prompt

Build a complete task description including:
1. **Inputs**: Data sources, file paths, URLs
2. **Outputs**: Desired result format and location
3. **Acceptance Criteria**: How to verify completion
4. **Technical Documentation**: **NEVER assume GLM knows any technology**
   - Provide doc URLs (for chrome-devtools-mcp to navigate and snapshot)
   - Or local doc paths (for Read)
   - Or embed key API definitions
5. **Specifications**: Coding standards, templates, formatting rules

### Step 3: Invoke the /glm Command

Use the SlashCommand tool:

```
/glm "Please [task description].

**Inputs**:
- [List all data sources, URLs, file paths]

**Output Requirements**:
- [Describe expected artifacts]
- [Specify format, naming conventions, structure]

**Technical Documentation**:
- [Provide URLs or paths to docs]
- [Or embed key API examples]

**Acceptance Criteria**:
- [How to verify completion]
"
```

### Step 4: Verify Results

After GLM-4.6 completes:
- **File List**: `ls -lh ./output/`
- **Spot-Check**: `cat ./output/sample.md | head -20`
- **Statistics**: Compare counts/sizes to expectations
- **Tool Validation**: `pnpm tsc`, `pnpm lint`

If issues found, delegate a follow-up correction task.

## 5. Task Categories

### 5.1 Batch Data Collection
- Web scraping documentation
- API data aggregation
- Multi-source content consolidation
- Resource downloading and organization

### 5.2 Batch Code Operations
- Code generation from templates
- Variable/function renaming
- Code formatting standardization
- Comment/documentation addition

### 5.3 Code Analysis
- Function reference finding
- Complexity/dependency analysis
- Pattern detection
- PR/commit impact analysis

### 5.4 Visual Analysis
- Layout issue analysis
- CSS style extraction
- Component screenshots
- UI state checking

### 5.5 Documentation Processing
- Batch technical doc reading/summarizing
- Architecture pattern research
- Best practice organization
- Technology selection research

## 6. Key Principles

1. **Define Clear Boundaries** - Inputs, outputs, acceptance criteria must be unambiguous
2. **Create Self-Contained Tasks** - Provide all context, specs, examples in the prompt
3. **Documentation is Mandatory** - **NEVER** assume GLM has tech knowledge. Always provide:
   - Documentation URLs (for chrome-devtools-mcp to navigate and snapshot)
   - Local doc paths (for Read)
   - Or embedded API definitions/examples
4. **Prioritize Cost-Effectiveness** - Only delegate when `Cost(Delegation + Verification) < Cost(Direct)
5. **Trust, Then Verify** - Don't micromanage; focus on verifying final results
6. **Keep Verification Simple** - Use file lists, JSON parsing, spot-checks
7. **Conserve Context** - Delegate tool-intensive tasks to keep main session free

## 7. When to Trigger This Skill

This skill should activate when you observe:
- User requests involving "batch", "all", "multiple", "scrape", "generate"
- Tasks requiring 10+ tool calls of the same type
- Data processing workflows with clear inputs/outputs
- Code generation tasks with templates
- Documentation research involving multiple sources

**Examples of trigger phrases**:
- "Scrape all documentation from..."
- "Generate model files for all entities..."
- "Find all references to..."
- "Read these 20 articles and summarize..."
- "Batch process all files in..."

## Reference

For detailed examples, see:
- `~/.claude/skills/glm-delegation/examples/web-scraping.md`
- `~/.claude/skills/glm-delegation/examples/code-generation.md`
- `~/.claude/skills/glm-delegation/examples/code-analysis.md`
- `~/.claude/skills/glm-delegation/examples/visual-inspection.md`
- `~/.claude/skills/glm-delegation/examples/documentation-research.md`
