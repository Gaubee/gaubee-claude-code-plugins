---
name: ccai-task-delegation
description: Delegate tool-intensive tasks to cost-efficient AI providers. Use when tasks involve 10+ tool calls, have clear boundaries, and simple verification. Ideal for batch operations, web scraping, code generation, and data processing. Suggest running delegated tasks in background.
---

# CCAI Task Delegation

## Overview

This skill helps you delegate tool-intensive tasks to cost-efficient AI providers for efficient execution in the background.

## When to Delegate

**Delegate when**:

- Task involves 10+ tool calls (Read, Write, WebFetch, Grep, etc.)
- Task has clear boundaries and well-defined inputs/outputs
- Verification is straightforward (file count, spot-check, statistics)
- Cost(Delegation + Verification) < Cost(Direct Execution)

**Do NOT delegate when**:

- Task requires deep reasoning or creative problem-solving
- Task needs frequent user interaction or clarification
- Verification is complex or time-consuming
- Task is exploratory with unclear scope

## Decision Framework

### High-Value Delegation Scenarios

1. **Web Scraping** (90% delegation value)
   - Fetching multiple web pages
   - Extracting structured data
   - Downloading documentation

2. **Batch File Processing** (85% delegation value)
   - Processing 10+ files with similar operations
   - Data transformation and formatting
   - File organization and cleanup

3. **Code Generation** (80% delegation value)
   - Generating boilerplate code
   - Creating multiple similar components
   - Writing repetitive test cases

4. **Data Analysis** (75% delegation value)
   - Log file analysis
   - Statistics extraction
   - Report generation

### Low-Value Delegation Scenarios

1. **Architectural Decisions** (20% delegation value)
   - Design pattern selection
   - API design
   - System architecture planning

2. **Complex Debugging** (30% delegation value)
   - Root cause analysis
   - Performance optimization
   - Race condition investigation

3. **Creative Writing** (25% delegation value)
   - Documentation narrative
   - User-facing content
   - Marketing materials

## Task Types and Examples

For task-specific guidance, refer to examples in `~/.claude/skills/ai-delegation/examples/`:

- `web-scraping.md` - Web scraping and data extraction
- `code-generation.md` - Code generation patterns
- `data-processing.md` - Data transformation and analysis
- `code-analysis.md` - Code search and analysis
- `documentation-research.md` - Technical research
- `visual-inspection.md` - UI testing and verification

## Execution Pattern

When delegating a task, suggest running it in the background:

1. **Prepare**: Write clear task description with:
   - Clear inputs and outputs
   - Acceptance criteria
   - Error handling strategy
2. **Delegate**: Call provider-specific command (`/ccai-{provider}`)
   - **Suggest running in background**: "I'll delegate this to {provider} in the background"
   - This allows you to continue with other work
3. **Verify**: Quick sanity check (file count, sample output)
4. **Iterate**: If issues found, provide feedback and re-delegate

## Verification Strategies

### Quick Verification (Recommended)

- Count files/records
- Spot-check 2-3 samples
- Run basic tests

### Deep Verification (If needed)

- Comprehensive review
- Edge case testing
- Manual inspection

## Provider Selection

Use `/ccai` for intelligent routing or `/ccai-{provider}` for direct control.

Consider:

- **Cost**: Token consumption and pricing
- **Speed**: Execution time requirements
- **Capability**: Task-specific strengths
