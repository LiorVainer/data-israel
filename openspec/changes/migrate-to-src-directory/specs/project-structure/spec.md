## ADDED Requirements

### Requirement: Source Directory Structure
The project SHALL organize application source code under a `src/` directory, separating it from configuration, documentation, and infrastructure files at the project root.

#### Scenario: Application directories reside in src/
- **WHEN** inspecting the project structure
- **THEN** the following directories SHALL exist under `src/`:
  - `src/app/` — Next.js App Router pages and API routes
  - `src/components/` — React components
  - `src/hooks/` — Custom React hooks
  - `src/lib/` — Shared utilities, tools, API clients
  - `src/agents/` — Mastra agent network
  - `src/services/` — Service layer
  - `src/context/` — React context providers
  - `src/constants/` — Application constants
  - `src/types/` — Shared TypeScript type definitions
  - `src/scripts/` — Data sync and utility scripts
  - `src/proxy.ts` — Next.js 16 proxy (replaces middleware.ts)
  - `src/instrumentation.ts` — Next.js instrumentation (Sentry setup)

#### Scenario: Root-level directories remain at root
- **WHEN** inspecting the project root
- **THEN** the following directories SHALL remain at the project root (not inside `src/`):
  - `convex/` — Convex backend (required by Convex CLI)
  - `public/` — Static assets (required by Next.js)
  - `openspec/` — Specification documents
  - `docs/` — Project documentation
  - `certificates/` — SSL/TLS certificates
  - `.github/` — CI/CD workflows

#### Scenario: Configuration files remain at root
- **WHEN** inspecting the project root
- **THEN** all configuration files SHALL remain at root:
  - `next.config.ts`, `tsconfig.json`, `package.json`
  - `eslint.config.mjs`, `postcss.config.mjs`, `.prettierrc`
  - `vitest.config.ts`, `vitest.eval.config.ts`
  - `sentry.*.config.ts`, `instrumentation.ts`
  - `proxy.ts` (middleware)
  - `.env*` files
  - `components.json` (shadcn)
  - `CLAUDE.md`

### Requirement: Path Alias Resolution
The `@/*` TypeScript path alias SHALL resolve to `./src/*`, enabling all application imports to use `@/` prefix without specifying `src/`.

#### Scenario: Import resolution via alias
- **WHEN** a file imports `@/components/chat/ChatThread`
- **THEN** TypeScript and Next.js SHALL resolve it to `./src/components/chat/ChatThread`

#### Scenario: Test alias resolution
- **WHEN** running vitest tests
- **THEN** the `@` alias SHALL resolve to the `src/` directory
