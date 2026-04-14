---
paths:
  - "convex/**/*.ts"
  - "src/**/*.ts"
  - "src/**/*.tsx"
---

# Convex Codegen Regeneration Rule

When adding or modifying Convex functions (queries, mutations, actions) in `convex/`, you **must** run `npx convex dev` to regenerate the `api` object in `convex/_generated/api.ts`.

Without this, TypeScript imports like `api.threads.myNewFunction` will fail at the call site with:

```
Property 'myNewFunction' does not exist on type ...
```

## Workflow

```bash
npx convex dev   # Start Convex dev server + regenerate convex/_generated/api
```

Keep this running in a second terminal while iterating on Convex functions. The generated `api` object updates automatically as you save changes under `convex/`.

## When this matters

- Adding a new query/mutation/action file under `convex/`
- Renaming an exported Convex function
- Adding/removing arguments on a Convex function's validator schema
- Any edit under `convex/` that changes the public surface consumed from `src/`
