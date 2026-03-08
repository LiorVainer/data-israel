# Change: Migrate application code to `src/` directory

## Why

The project currently uses a flat root directory structure where application directories (`app/`, `components/`, `hooks/`, `lib/`, etc.) sit alongside config files, documentation, and infrastructure folders. This makes the root cluttered and deviates from the common Next.js convention of using a `src/` directory to separate application code from project configuration. Moving to `src/` improves project organization, aligns with the broader Next.js ecosystem, and makes the root directory scannable at a glance.

## What Changes

- **Move application directories** into `src/`:
  - `app/` → `src/app/`
  - `components/` → `src/components/`
  - `hooks/` → `src/hooks/`
  - `lib/` → `src/lib/`
  - `agents/` → `src/agents/`
  - `services/` → `src/services/`
  - `context/` → `src/context/`
  - `constants/` → `src/constants/`
  - `types/` → `src/types/`
  - `scripts/` → `src/scripts/`
  - `proxy.ts` → `src/proxy.ts` (Next.js 16 proxy file convention — auto-detected at root or `src/`)
  - `instrumentation.ts` → `src/instrumentation.ts` (Next.js auto-detects at root or `src/`)
- **Keep at project root** (unchanged):
  - `convex/` — Convex requires this at root
  - `openspec/` — specification docs
  - `docs/` — documentation
  - `public/` — Next.js requires static assets at root
  - `certificates/` — infrastructure/devops
  - `.github/` — CI/CD workflows
  - All config files (`next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `package.json`, etc.)
  - `sentry.*.config.ts` — Sentry convention expects root (referenced by `withSentryConfig` in `next.config.ts`)
- **Update configuration files**:
  - `tsconfig.json` — path alias `@/*` → `./src/*`
  - `vitest.config.ts` / `vitest.eval.config.ts` — alias `@` → `src`
  - `components.json` — shadcn CSS path update
  - `package.json` — script paths referencing `agents/evals/`
  - `CLAUDE.md` — update all directory references
  - `openspec/project.md` — update project structure references
- **No import changes needed**: Because `@/*` resolves to `./src/*` after tsconfig update, all existing `@/...` imports remain valid without modification

## Impact

- Affected specs: `project-structure` (new capability)
- Affected code: Every application directory, all config files with path references
- **BREAKING**: None — this is a purely structural refactor; all imports use `@/*` alias which will be remapped
- **Risk**: Low — git will track moves as renames; `@/*` alias abstracts the physical location

## Research: Next.js `src/` Convention

### Official Next.js Support
Next.js has first-class support for `src/` directory. When `src/app/` exists, Next.js automatically uses it instead of root `app/`. No `next.config.ts` changes needed — Next.js auto-detects.

### What Must Stay at Root
Per Next.js documentation and ecosystem conventions:
- `public/` — Next.js serves static files from `<root>/public` only
- `convex/` — Convex CLI expects `<root>/convex/`
- Config files — `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `.env*`, etc.
- Sentry configs — `sentry.*.config.ts` must be at root for `@sentry/nextjs` withSentryConfig

### `proxy.ts` (Next.js 16 Proxy Convention)
In Next.js 16, `middleware.ts` was **renamed to `proxy.ts`** as a file convention. The exported function is `proxy()` instead of `middleware()`. It uses the `nodejs` runtime. Next.js auto-detects `proxy.ts` at root **or** inside `src/`. Since it's application code, it moves to `src/proxy.ts`.

### `instrumentation.ts`
Next.js auto-detects `instrumentation.ts` at root or `src/`. It imports `./sentry.server.config` and `./sentry.edge.config` using relative paths. After moving to `src/`, these imports need updating to `../sentry.server.config` and `../sentry.edge.config` to reference the root-level Sentry configs.

### `public/` Decision
**Stays at root.** Next.js only serves static files from `<root>/public`. Moving it would break static asset serving. This is not configurable.
