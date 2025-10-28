# Example: Function Reference Analysis

## Use Case Category
Code Analysis and Statistics

## Common Tasks
- Finding all references to functions or variables
- Analyzing code complexity and dependencies
- Detecting code patterns and potential issues
- Analyzing PR/commit change impact

## Detailed Example: Function Reference Analysis

### Task Description

```
Find all references to the function calculateTotal throughout the project.
```

### Delegation from Main Claude Session

````
Task Identified: Code analysis + reference search.
Assessment: Clear boundaries ✓, Tool-intensive ✓, Simple verification ✓.

Delegate to GLM-4.6 via /glm command:

"Please find all references to the function calculateTotal.

**Inputs**:
- Target function: calculateTotal
- Search scope: All .ts and .tsx files in the ./src directory

**Analysis Requirements**:
1. Use the Grep tool to find all files containing 'calculateTotal'
2. For each matching file, use Read to get the full content
3. Analyze the specific reference types:
   - Function calls: calculateTotal(...)
   - Function passing: onClick={calculateTotal}
   - Import statements: import { calculateTotal } from ...
   - Type references: typeof calculateTotal
4. Exclude the definition location itself (only count references)

**Output Format**:
Generate a structured analysis report:
```markdown
# calculateTotal Function Reference Analysis

## Summary Statistics
- Total references: X times
- Files involved: Y files
- Reference type distribution:
  - Function calls: A times
  - Function passing: B times
  - Import statements: C times
  - Type references: D times

## Detailed Reference List

### File: src/components/Cart.tsx
- **Line 15**: Function call
  ```typescript
  const total = calculateTotal(items)
  ```

- **Line 32**: Function passing
  ```typescript
  <Button onClick={calculateTotal} />
  ```

### File: src/utils/pricing.ts
...
```

**Acceptance Criteria**:
- Provide a complete reference list
- Spot-check 2-3 reference locations to confirm accuracy
"
````

### GLM-4.6 Execution Flow

1. Use Grep to find all files containing 'calculateTotal'
2. Read each file to analyze specific reference types
3. Exclude the function definition location
4. Categorize references by type
5. Generate a structured report

### GLM-4.6 Report Output

```markdown
# calculateTotal Function Reference Analysis

## Summary Statistics
- Total references: 47 times
- Files involved: 12 files
- Reference type distribution:
  - Function calls: 35 times
  - Function passing: 8 times
  - Import statements: 12 times
  - Type references: 4 times

## Detailed Reference List

### File: src/components/Cart.tsx
- **Line 12**: Import statement
  ```typescript
  import { calculateTotal } from '@/utils/pricing'
  ```

- **Line 45**: Function call
  ```typescript
  const total = calculateTotal(items)
  ```

- **Line 67**: Function passing
  ```typescript
  <Button onClick={() => calculateTotal(cartItems)} />
  ```

### File: src/components/Checkout.tsx
- **Line 8**: Import statement
  ```typescript
  import { calculateTotal } from '@/utils/pricing'
  ```

- **Line 23**: Function call
  ```typescript
  const subtotal = calculateTotal(selectedItems)
  ```

... (10 more files)

## Definition Location
File: src/utils/pricing.ts
Line: 145-160

## Notes
- Most references are direct function calls
- No deprecated usage patterns found
- All imports use named import syntax
```

### Main Claude Verification

```bash
# Spot-check a few reference locations
grep -n "calculateTotal" src/components/Cart.tsx
grep -n "calculateTotal" src/utils/pricing.ts

# Verify statistics
grep -r "calculateTotal" src/ --include="*.ts" --include="*.tsx" | wc -l
```

Verification complete ✓

## Key Takeaways

### Why This Task is Suitable for Delegation

1. **Tool-Intensive**: 1 `Grep` + 12 `Read` calls
2. **Clear Boundaries**:
   - Input: Function name, search scope
   - Output: Categorized reference list
3. **Simple Verification**: Spot-check 2-3 locations with grep
4. **Structured Output**: Easy to parse and review

### Delegation Checklist

✅ **Clear Inputs**: Function name, file patterns, directory scope
✅ **Clear Outputs**: Markdown report with specific sections
✅ **Analysis Requirements**: Reference type categorization specified
✅ **Simple Verification**: Grep spot-checks provided
✅ **Structured Format**: Report template provided

### Verification Strategy

**Quick Checks (30 seconds)**:
- Total count: `grep -r "calculateTotal" src/ | wc -l`
- Spot-check 2-3 files: `grep -n "calculateTotal" [file]`
- Verify categories make sense

**Optional Deep Checks**:
- Use AST parser to verify classification accuracy
- Check for missed edge cases (dynamic calls, etc.)

## Variations

### Dependency Analysis

```
"Please analyze all dependencies of the UserService class.

**Inputs**:
- Target class: UserService
- File location: ./src/services/UserService.ts

**Analysis Requirements**:
1. Read the UserService file
2. Identify all imported dependencies
3. For each dependency, find its imports (recursive, max depth 3)
4. Build dependency tree
5. Identify circular dependencies

**Output Format**:
- Dependency tree (Markdown or JSON)
- Statistics: total deps, depth distribution
- Circular dependency warnings if any

**Acceptance Criteria**:
- All direct dependencies listed
- Spot-check 2-3 dependency chains
"
```

### Code Complexity Analysis

```
"Please analyze code complexity metrics for all service classes.

**Inputs**:
- Directory: ./src/services/
- File pattern: *.service.ts

**Analysis Requirements**:
1. Glob to find all service files
2. Read each file
3. Calculate for each file:
   - Lines of code (total, comment, code-only)
   - Cyclomatic complexity (estimate from if/switch/loop)
   - Number of functions/methods
   - Average function length

**Output Format**:
- Summary table (Markdown)
- Files sorted by complexity
- Top 5 most complex functions

**Acceptance Criteria**:
- Metrics for all files
- Calculations are reasonable
"
```

### Pattern Detection

```
"Please find all React components using deprecated lifecycle methods.

**Inputs**:
- Directory: ./src/components/
- File pattern: *.tsx
- Deprecated patterns:
  - componentWillMount
  - componentWillReceiveProps
  - componentWillUpdate

**Analysis Requirements**:
1. Grep for each deprecated method
2. Read matching files
3. Extract usage context (surrounding lines)
4. Suggest modern alternatives

**Output Format**:
- File-by-file breakdown
- Usage count per pattern
- Migration suggestions

**Acceptance Criteria**:
- All deprecated usages found
- Context is helpful for migration
"
```

### Import Usage Analysis

```
"Please analyze usage of the lodash library across the project.

**Inputs**:
- Search scope: ./src/
- File patterns: *.ts, *.tsx
- Target library: lodash

**Analysis Requirements**:
1. Find all lodash imports
2. Categorize import styles:
   - Full import: import _ from 'lodash'
   - Named import: import { map } from 'lodash'
   - Path import: import map from 'lodash/map'
3. Count usage of each lodash function
4. Identify opportunities for tree-shaking

**Output Format**:
- Import style breakdown
- Most-used functions (top 10)
- Files using full imports (tree-shaking issues)

**Acceptance Criteria**:
- Complete function usage list
- Actionable tree-shaking recommendations
"
```

## Common Pitfalls to Avoid

❌ **Vague Search Scope**
- Bad: "Find references in the project"
- Good: "Search all .ts and .tsx files in ./src/"

❌ **No Categorization**
- Bad: "List all references"
- Good: "Categorize by: calls, imports, type refs, etc."

❌ **Missing Context**
- Bad: Just line numbers
- Good: Line numbers + surrounding code snippet

❌ **No Definition Exclusion**
- Bad: Counting the definition as a reference
- Good: "Exclude the definition location"

## Best Practices

### Provide Clear Search Patterns
- Specify file extensions
- Define directory scope
- List exclusion patterns if any

### Define Reference Categories
- What counts as a "reference"?
- How to classify different usage types
- How to handle edge cases

### Request Structured Output
- Use Markdown tables for statistics
- Include code snippets for context
- Provide file paths with line numbers

### Make Verification Easy
- Provide grep commands for spot-checking
- Suggest statistical comparisons
- Include representative samples in report
