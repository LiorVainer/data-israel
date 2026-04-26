# Change: Adopt Fallow for Codebase Cleanup and Quality Gates

## Why

A baseline Fallow scan reports **780 dead-code issues** across the project: 56 unused files (12.4% of source), 694 unused exports (35.5%), 6 unused production dependencies, 4 duplicate exports, and 181 functions above the cyclomatic/cognitive complexity thresholds. Several of these are recent residue (e.g., chart files for features removed in commit `13926b1`) and others are accidental (e.g., `resolveSourceUrl` redefined in 6 datagov/health tool files). Without an automated, deterministic gate, AI-assisted edits will keep adding to this debt — duplicating utilities, leaving orphan exports, and growing god-functions instead of refactoring.

Fallow gives us a zero-config, sub-second static analyzer that produces JSON output AI agents can consume directly. Adopting it as a project-level gate (with project-aware `ignorePatterns`) replaces vibes-based reasoning about "is this code used?" with deterministic facts.

## What Changes

- **ADD** `.fallowrc.json` config with `ignorePatterns` for protected directories (`src/components/ai-elements/**`, `src/components/ui/**`, `public/**`, `**/*.test.ts`, `**/*.typecheck.ts`, `**/__tests__/**`) so Fallow ignores library code we vendor and test fixtures.
- **REMOVE** four confirmed-dead admin chart files that match recent feature-removal commits (`ThreadOriginChart.tsx`, `ThreadsOverTimeChart.tsx`, `TokenUsageChart.tsx`, `FreeTextPromptsList.tsx`).
- **REMOVE** confirmed-unused production dependencies: `@ai-sdk-tools/store`, `@ai-sdk/openai`, `zustand`, `@mastra/deployer-vercel` (verified absent from `src/` and not registered in the `Mastra` constructor's `deployer` field — Mastra runs embedded inside the Next.js API route, so the Vercel deployer for standalone Mastra Build Output API deployment is not used). Hold `recharts` pending manual admin-panel verification. **KEEP** `@nivo/core` — it has no direct import in `src/` but is a required peer dependency of `@nivo/bar`, `@nivo/line`, and `@nivo/pie` (used in `ChartRenderer.tsx` and admin charts); add to `.fallowrc.json` `ignoreDependencies` so Fallow stops flagging it.
- **REFACTOR** four duplicate exports to single canonical sources:
  - `CbsSeriesPath` (canonical: `cbs.types.ts`)
  - `ToolInfo` (canonical: `lib/utils/tool-info.ts`)
  - `buildGovmapPortalUrl` (canonical: `govmap.endpoints.ts`)
  - `resolveSourceUrl` (extract to `src/data-sources/_shared/resolve-source-url.ts`, used by 6 tool files)
- **EXTRACT** `requireAdmin(ctx)` helper in `convex/_shared/auth.ts` to remove the 18-line duplicated admin-check block in `convex/aiModels.ts` (and reuse-ready for future admin-only mutations).
- **ADD** new capability spec `code-quality` defining the Fallow gate, ignore-pattern policy, and post-feature quality-check sequence.
- **ADD** an `npm run fallow` script and document the post-feature sequence in `CLAUDE.md`: `eslint --fix → tsc → fallow → fix → report done`.

Out of scope (deferred to follow-up changes):
- Refactoring complexity hotspots (`convex/analytics.ts`, `src/app/api/chat/route.ts`).
- Removing the remaining ~620 unused exports inside data-source modules (large per-source review needed).
- Wiring `fallow --fail-on-issues` into pre-commit / CI (gate in this proposal is advisory until baseline is clean).

## Impact

- **Affected specs**: new `code-quality` capability (no existing capability modified).
- **Affected code**:
  - `package.json` — remove 4 deps, add `fallow` dev dep + `fallow` script.
  - `.fallowrc.json` — new file.
  - `CLAUDE.md` — add post-feature quality-check section.
  - `convex/aiModels.ts`, `convex/_shared/auth.ts` — admin-helper extraction.
  - `src/data-sources/cbs/api/cbs.endpoints.ts`, `src/data-sources/cbs/api/cbs.types.ts` — dedupe `CbsSeriesPath`.
  - `src/components/chat/types.ts`, `src/lib/utils/tool-info.ts` — dedupe `ToolInfo`.
  - `src/data-sources/govmap/api/govmap.endpoints.ts`, `src/data-sources/govmap/api/nadlan/nadlan.endpoints.ts` — dedupe `buildGovmapPortalUrl`.
  - `src/data-sources/_shared/resolve-source-url.ts` — new shared util; 6 tool files updated to import it.
  - `src/components/admin/charts/{ThreadOriginChart,ThreadsOverTimeChart,TokenUsageChart}.tsx`, `src/components/admin/FreeTextPromptsList.tsx`, `src/app/api/chat/__tests__/phase3-push-trigger.typecheck.ts` — deleted.
- **Risk**: low. All deletions match recent feature-removal commits; all dedup refactors are mechanical with type-checked import rewrites.
- **Verification**: `tsc --noEmit && npm run lint && npx fallow dead-code --format json --quiet` must show drop from 780 → expected ≤ ~620 issues (cleanup of files/dups/deps; remaining are out-of-scope per-source export review).
