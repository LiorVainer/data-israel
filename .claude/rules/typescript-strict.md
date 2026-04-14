---
paths:
  - "src/**/*.{ts,tsx}"
  - "convex/**/*.ts"
---

# TypeScript Strictness Rules

Strict mode is enabled across the project. All strict TypeScript checks are active.

## Type Safety Rules

1. **Minimize `as` type assertions** — use proper type guards and inference instead. Prefer narrowing via `in`, `typeof`, `instanceof`, or discriminated unions. Reserve `as` for cases the compiler genuinely cannot prove.
2. **Avoid `any`** — use `unknown` and narrow, or declare a precise type. Never introduce `any` as a shortcut.
3. **Always run `tsc` after changes** — verify no new errors were introduced. A Stop-hook quality gate enforces this on session stop, but run it manually for major changes too.
4. **No `any`/`as` abuses were introduced** — the repo's quality bar. Existing abuses stay; new ones are blocked.

## Common Patterns

- Use type inference where possible — don't annotate what TypeScript can deduce.
- Prefer `interface` for object shapes, `type` for unions and mapped types.
- Use `Readonly<>` / `readonly` for immutable props.
- Leverage utility types: `Pick`, `Omit`, `Partial`, `Required`, `Record`, `ReturnType`, `Parameters`.
- Narrow at system boundaries (user input, external APIs) — trust internal code and framework guarantees.

## Zod Best Practices

- Always extract `z.infer<typeof schema>` to a **named type alias** — never use inline
- Invoke the `/zod` skill when writing Zod schemas for validation, coercion, or transforms
- Use `z.coerce.string()` / `z.coerce.number()` at API boundaries where values may arrive as either type
- Define Zod output schemas at module level with **named exports**
- Use `.transform()` to map external field names to internal property names at the parsing boundary
- Use `safeParse()` for external data, `parse()` only when failure should throw

## Import Conventions

- Prefer `@/` absolute imports over deep relative paths (`../../..`)
- Use `@/lib/typescript/typed-object` for `typedKeys`, `typedValues`, `typedEntries`
