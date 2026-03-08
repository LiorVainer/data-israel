## Context

The project has grown to 10+ top-level application directories mixed with config files, docs, and infrastructure. This makes the root noisy. Moving to `src/` is a standard Next.js pattern that cleanly separates "application code" from "project config".

## Goals / Non-Goals

- **Goals:**
  - Move all application source code under `src/`
  - Keep `@/*` path alias working seamlessly
  - Zero import changes in application code
  - Update all config files and documentation

- **Non-Goals:**
  - Restructuring code within moved directories (no internal refactoring)
  - Changing any application behavior
  - Moving Convex backend code (it has its own conventions)

## Decisions

### Decision: Use `git mv` for all directory moves
- **Why:** Preserves git history (renames tracked), avoids accidental deletions
- **Alternatives:** Copy + delete (loses history), IDE refactor (inconsistent across tools)

### Decision: Move `proxy.ts` and `instrumentation.ts` to `src/`
- **Why:** Both are application-level files. Next.js 16 auto-detects `proxy.ts` and `instrumentation.ts` at root or `src/`. `proxy.ts` is the Next.js 16 replacement for `middleware.ts` (renamed convention, uses `nodejs` runtime). Moving them into `src/` keeps all application code together.
- **Note:** `instrumentation.ts` imports `./sentry.server.config` and `./sentry.edge.config` via relative paths. After moving to `src/`, these imports must be updated to `../sentry.server.config` and `../sentry.edge.config`.

### Decision: Keep `scripts/` in `src/`
- **Why:** Scripts reference `@/` imports (e.g., `@/lib/api/`, `@/agents/`). Keeping them in `src/` means the alias resolves correctly. They are application-level data utilities, not devops scripts.

### Decision: `public/` stays at root
- **Why:** Next.js hard-codes static file serving from `<root>/public`. Not configurable.

## Migration Strategy

The migration is purely mechanical and can be done in a single atomic commit:

1. Create `src/` directory
2. `git mv` each application directory into `src/`
3. Update `tsconfig.json` path alias
4. Update vitest configs
5. Update `components.json` (shadcn)
6. Update `package.json` script paths
7. Update documentation (`CLAUDE.md`, `openspec/project.md`)
8. Run `npm run build && npm run lint && tsc` to verify

## Risks / Trade-offs

- **Risk:** Merge conflicts with any in-flight branches that modify moved files
  - **Mitigation:** Communicate to merge/rebase feature branches before or right after this change
- **Risk:** IDE caches may get confused after mass renames
  - **Mitigation:** Restart IDE / clear `.next` cache after migration

## Open Questions

None — the migration path is well-established in the Next.js ecosystem.
