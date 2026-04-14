---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# TypeScript Helpers & Conventions

## Typed Object Utilities

Use `typedKeys`, `typedValues`, `typedEntries` from `@/lib/typescript/typed-object` instead of native `Object.keys()`, `Object.values()`, `Object.entries()` when type preservation is needed. Native Object methods widen keys to `string[]` and lose value types.

## Import Conventions

Prefer `@/` absolute imports over deep relative paths (`../../..`). The project uses `@/*` → `./src/*`.

## Zod Conventions

Invoke the `/zod` skill when writing new Zod schemas. Key rules:
- Extract `z.infer<typeof schema>` to named type aliases — never inline
- Export output schemas with named exports at module level
- Use `safeParse()` for external data, `parse()` only when failure should throw
- Use `z.coerce.string()` at API boundaries for values that may be number or string
- Use `.transform()` to map external field names to internal property names

## Shared TS Utilities

`@/lib/typescript/` is the home for project-wide TypeScript utilities. Add new utilities here rather than in individual modules.
