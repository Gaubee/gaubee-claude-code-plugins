# Example: Batch Code Generation

## Use Case Category

Batch Code Operations

## Common Tasks

- Generating code files from templates
- Batch renaming of variables or functions
- Standardizing code formatting and style
- Batch adding or removing comments or documentation

## Detailed Example: TypeScript Data Model Generation

### Task Description

```
Generate 15 TypeScript data model files based on a schema definition.
```

### Delegation from Main Claude Session

````
Task Identified: Batch file generation + requires technical documentation.
Assessment: Clear boundaries ✓, Tool-intensive ✓, Simple verification ✓.

Delegate to GLM-4.6 via /glm command:

"Please generate data model files based on the provided schema definition.

**Inputs**:
- Schema file: ./schemas/entities.json
- This file contains definitions for 15 entities.

**Technical Documentation** (Crucial!):
- Zod v4 Docs: https://zod.dev/v4/docs
  Please use `chrome-devtools-mcp` (navigate + snapshot) to retrieve the API reference, focusing on:
  - Basic type definitions (`string`, `number`, `object`, `array`)
  - Type inference (`z.infer`, `z.input`, `z.output`)
  - Validation methods (`min`, `max`, `email`, `uuid`)
- Alternatively, use the local documentation: `Read` ~/.claude/skills/zod-v4-docs.md

**Output Requirements**:
- Generate a separate TypeScript file for each entity.
- Save files to the `./src/models/` directory.
- File naming convention: `<entity-name>.model.ts` (kebab-case).
- Each file must include:
  1. The Zod v4 schema definition.
  2. Exported TypeScript types (`Type`, `Input`, `Output`).
  3. Complete JSDoc comments for all exports.

**Code Template**:
```typescript
// user.model.ts example
import { z } from 'zod/mini'

/**
 * User entity schema
 * @description Data validation schema for the User entity.
 */
export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  createdAt: z.date(),
})

/** User entity type */
export type UserType = z.infer<typeof UserSchema>

/** User input type (before validation) */
export type UserInput = z.input<typeof UserSchema>

/** User output type (after validation) */
export type UserOutput = z.output<typeof UserSchema>
```

**Coding Standards**:
- Enforce strict type safety. Do not use `any` or `as any`.
- Use Zod v4 syntax, importing from `zod/mini`.
- Naming convention for exports: `<Entity>Schema`, `<Entity>Type`, `<Entity>Input`, `<Entity>Output`.
- All exports must have JSDoc comments.

**Acceptance Criteria**:
- List all generated files and their sizes.
- Provide the full content of 1-2 files as samples.
"
````

### GLM-4.6 Execution Flow

1. Use `chrome-devtools-mcp` (navigate + snapshot) to retrieve the Zod v4 documentation and understand the API
2. `Read` the `./schemas/entities.json` file
3. Parse the 15 entity definitions
4. Iterate through each entity, generating code based on the template and Zod docs
5. `Write` the generated code to files in `./src/models/`
6. Generate a final report

### GLM-4.6 Report Output

````
✅ Code generation complete.

Generated File List:
./src/models/user.model.ts 1.2KB
./src/models/product.model.ts 1.5KB
./src/models/order.model.ts 2.1KB
./src/models/category.model.ts 0.9KB
... (15 files total)

Sample File (user.model.ts):

```typescript
import { z } from 'zod/mini'

/**
 * User entity schema
 * @description Data validation schema for the User entity.
 */
export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  createdAt: z.date(),
})

/** User entity type */
export type UserType = z.infer<typeof UserSchema>

/** User input type (before validation) */
export type UserInput = z.input<typeof UserSchema>

/** User output type (after validation) */
export type UserOutput = z.output<typeof UserSchema>
```
````

### Main Claude Verification

```bash
# Check file generation
ls -lh ./src/models/*.model.ts

# Spot-check 2-3 files
cat ./src/models/user.model.ts
cat ./src/models/product.model.ts

# Run type checking
pnpm tsc
```

Verification complete ✓

## Key Takeaways

### Why This Task is Suitable for Delegation

1. **Tool-Intensive**: 1-2 `navigate`+`snapshot` + 1 `Read` + 15 `Write` calls
2. **Clear Boundaries**:
   - Input: Schema file, documentation, template
   - Output: 15 TypeScript files following strict format
3. **Simple Verification**: File count, spot-check 2-3 files, run `pnpm tsc`
4. **Template-Based**: Clear code template provided

### Delegation Checklist

✅ **Clear Inputs**: Schema file path specified
✅ **Clear Outputs**: File format, naming, structure detailed
✅ **Technical Documentation**: Zod v4 docs provided via URL
✅ **Code Template**: Complete example provided
✅ **Coding Standards**: Type safety, naming conventions specified
✅ **Simple Verification**: File list + samples + type checking

### Verification Strategy

**Quick Checks (1 minute)**:

- File count: `ls ./src/models/*.model.ts | wc -l`
- Spot-check 2 files: `cat ./src/models/user.model.ts`
- Type checking: `pnpm tsc --noEmit`

**Optional Deep Checks**:

- Lint all files: `pnpm eslint ./src/models/`
- Test schema validation: Create simple test file

## Variations

### React Component Generation

```
"Please generate React components from design tokens.

**Inputs**:
- Design tokens: ./design/tokens.json
- Contains: colors, spacing, typography definitions

**Technical Documentation**:
- React 19 Docs: https://react.dev/reference/react
- Tailwind CSS v4: https://tailwindcss.com/docs/v4
- shadcn/ui components: https://ui.shadcn.com/docs

**Output Requirements**:
- Generate component file for each token category
- Use shadcn/ui patterns
- TypeScript with strict types
- Include Storybook stories

**Code Template**:
[Provide complete template]

**Acceptance Criteria**:
- All files type-check
- Storybook builds successfully
"
```

### API Route Generation

```
"Please generate tRPC router files from API specifications.

**Inputs**:
- OpenAPI spec: ./api/spec.yaml
- Contains: 20 endpoint definitions

**Technical Documentation**:
- tRPC v11 Docs: https://trpc.io/docs/v11
- Zod v4: (embed key examples)

**Output Requirements**:
- Generate router file per resource
- Input/output validation with Zod
- JSDoc from OpenAPI descriptions

**Acceptance Criteria**:
- Type-safe routes
- All endpoints covered
"
```

### Database Migration Generation

```
"Please generate Drizzle schema migrations from entity definitions.

**Inputs**:
- Entity definitions: ./db/entities/
- 12 TypeScript files with entity classes

**Technical Documentation**:
- Drizzle ORM: https://orm.drizzle.team/docs
- PostgreSQL types: (embed reference)

**Output Requirements**:
- Schema file per entity
- Migration file for all changes
- Relations and indexes defined

**Acceptance Criteria**:
- Schema validates
- Migration runs successfully
"
```

## Common Pitfalls to Avoid

❌ **Missing Technical Documentation**

- Bad: "Generate Zod schemas" (assumes GLM knows Zod)
- Good: "Use chrome-devtools-mcp to navigate to https://zod.dev/docs and snapshot the API reference"

❌ **Incomplete Code Template**

- Bad: Vague description of desired output
- Good: Complete, runnable code example

❌ **No Coding Standards**

- Bad: "Generate TypeScript files"
- Good: "No `any`, strict types, JSDoc on all exports"

❌ **Weak Verification**

- Bad: "Make sure the code is correct"
- Good: "Run `pnpm tsc` to verify type safety"

## Best Practices

### Provide Complete Templates

Include a full, working example file that GLM can use as a reference.

### Specify All Conventions

- File naming (kebab-case, PascalCase, etc.)
- Export naming patterns
- Import organization
- Comment styles

### Include Type Safety Requirements

- Explicitly forbid `any`, `as any`
- Require strict TypeScript configuration
- Specify type inference patterns

### Make Verification Executable

- Provide exact commands to run
- Specify expected outputs
- Define pass/fail criteria
