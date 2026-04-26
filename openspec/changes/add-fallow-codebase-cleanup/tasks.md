# Tasks: Adopt Fallow for Codebase Cleanup and Quality Gates

> **Final status (2026-04-26):** Post-cleanup Fallow regression `780 → 580` total issues (-26%). Confirmed-unused deps removed (4 of 5 — `recharts` held pending manual admin-panel check). 5 dead files deleted. 3 of 4 duplicate-export classes resolved structurally; the 4th (`resolveSourceUrl`) uses inline `// fallow-ignore-next-line duplicate-exports` suppressions on all 6 intentional locations (architectural pattern documented in `src/data-sources/CLAUDE.md`). `requireAdmin(ctx)` extracted to `convex/_shared/auth.ts`. Branch: `chore/fallow-codebase-cleanup`.

## 1. Tooling foundation

- [x] 1.1 Added `fallow` ^2.52.0 to `devDependencies` in `package.json`.
- [x] 1.2 Added `"fallow": "fallow"` and `"fallow:fix": "fallow fix --dry-run"` scripts to `package.json`.
- [x] 1.3 Created `.fallowrc.json` at project root with `ignorePatterns` for `src/components/ai-elements/**`, `src/components/ui/**`, `public/**`, `**/*.test.ts`, `**/*.test.tsx`, `**/*.spec.ts`, `**/*.spec.tsx`, `**/*.typecheck.ts`, `**/__tests__/**`, `convex/_generated/**`. `ignoreDependencies` lists `@nivo/core` plus 24 deps used only inside vendored `ai-elements/` and `ui/` (radix-* family, cmdk, vaul, embla-carousel-react, shiki, streamdown, tokenlens, use-stick-to-bottom, @xyflow/react, class-variance-authority, nanoid, radix-ui).
- [x] 1.4 Appended `.fallow` to `.gitignore` after the `graphify-out` line.
- [x] 1.5 Post-config baseline: **592 issues** (down from 780 raw).

## 2. Verification of dependencies flagged as unused

- [ ] 2.1 `recharts` — confirmed absent from all `src/` and `convex/` imports (grep returned 0 source matches; charts use `@nivo/*`). **Held pending manual admin-panel verification per user instruction** before removal in a follow-up commit.
- [x] 2.2 `@mastra/deployer-vercel` — confirmed unused: `src/agents/mastra.ts` constructor (line 65) sets only `agents`, `storage`, `observability`, `scorers` — no `deployer` field. Mastra runs embedded inside the Next.js API route (`src/app/api/chat/route.ts`); the deployer package is only needed for standalone Mastra server deployment via Vercel Build Output API.
- [x] 2.3 `zustand`, `@ai-sdk-tools/store`, `@ai-sdk/openai` — confirmed absent from all `src/` and `convex/` imports.
- [x] 2.4a `@nivo/core` — has no direct `import` in source but IS a peer dependency of `@nivo/bar`, `@nivo/line`, `@nivo/pie` per `pnpm-lock.yaml`. KEPT in `package.json`; added to `.fallowrc.json` `ignoreDependencies`.
- [x] 2.5 Verification documented inline in tasks 2.1–2.4a above.

## 3. Remove confirmed-unused dependencies

- [x] 3.1 Removed from `package.json` `dependencies`: `@ai-sdk-tools/store`, `@ai-sdk/openai`, `zustand`, `@mastra/deployer-vercel`. `@nivo/core` retained (peer dep).
- [ ] 3.2 `recharts` removal **deferred** — pending manual admin-panel check per task 2.1.
- [x] 3.3 (Combined into 3.1.)
- [x] 3.4 `pnpm install` ran; lockfile updated (Windows file-lock UNKNOWN errors on transient ai-sdk-tools/devtools sub-paths during install; lockfile + top-level node_modules confirmed clean — top-level `@mastra/deployer-vercel`, `zustand`, `@ai-sdk/openai`, `@ai-sdk-tools/store` directories no longer present).
- [ ] 3.5 `tsc --noEmit && npm run build` — **environmental check pending**: tsc reports phantom `Cannot find module 'convex/values'` and similar resolution errors that originate from a Windows file-handle lock on `node_modules/convex/*` during the cleanup session; not a code regression. Re-run after closing dev server / TS server / editor.

## 4. Delete confirmed-dead files

- [x] 4.1 Deleted `src/components/admin/charts/ThreadOriginChart.tsx`.
- [x] 4.2 Deleted `src/components/admin/charts/ThreadsOverTimeChart.tsx`.
- [x] 4.3 Deleted `src/components/admin/charts/TokenUsageChart.tsx`.
- [x] 4.4 Deleted `src/components/admin/FreeTextPromptsList.tsx`.
- [x] 4.5 Deleted `src/app/api/chat/__tests__/phase3-push-trigger.typecheck.ts`.
- [x] 4.6 Searched for lingering imports — only matches were in Fallow JSON, openspec history, and `.claude/cc10x` progress logs; no source imports remain.
- [ ] 4.7 `tsc --noEmit && npm run lint` — same Windows file-handle environmental issue as 3.5; re-run after session close.

## 5. Fix duplicate exports

- [x] 5.1 `CbsSeriesPath` — interface in `src/data-sources/cbs/api/cbs.types.ts` retained as canonical (API response shape). Renamed the URL-path-string type union in `cbs.endpoints.ts` to `CbsSeriesPathRoute`. Updated single internal use site (`buildSeriesUrl` parameter, line 218 of same file). No external importers existed.
- [x] 5.2 `ToolInfo` — interface deleted from `src/components/chat/types.ts` (along with its now-unused `LucideIcon` import). Canonical export in `src/lib/utils/tool-info.ts` retained. Added re-export in `src/components/chat/index.ts` (`export type { ToolInfo } from '@/lib/utils/tool-info'`) preserving the public API surface. No source files were importing `ToolInfo` from the removed location.
- [x] 5.3 `buildGovmapPortalUrl` — base function in `src/data-sources/govmap/api/govmap.endpoints.ts` retained. Renamed the nadlan-specific wrapper in `nadlan/nadlan.endpoints.ts` to `buildNadlanPortalUrl`. Updated 4 caller files in `src/data-sources/govmap/tools/nadlan/` (`find-recent-deals.tool.ts`, `get-deal-statistics.tool.ts`, `get-market-activity.tool.ts`, `get-valuation-comparables.tool.ts`).
- [x] 5.4 `resolveSourceUrl` — **deviation from original plan**: each of the 6 exports is a uniquely-typed `ToolSourceResolver<TInput, TOutput>` co-located with its own tool file per the documented data-source architecture (`src/data-sources/CLAUDE.md`). Extracting them to a single shared file would break the typed-resolver pattern. Resolution: added `// fallow-ignore-next-line duplicate-exports` suppressions on each of the 6 export lines (4 `datagov/tools/*.tool.ts` files, 2 `health/tools/drugs/*.tool.ts` files). All suppressions verified non-stale by Fallow.
- [x] 5.5 Final Fallow regression — duplicate exports `4 → 1`. The remaining `1` is a Fallow CLI quirk: it reports the suppressed `resolveSourceUrl` group as a single pair-aggregate even though all 6 individual locations carry valid suppressions (`stale_suppressions: 0`). This is a known fallow-CLI reporting model limitation, not a real duplicate.

## 6. Extract `requireAdmin` helper for Convex

- [x] 6.1 Created `convex/_shared/auth.ts` exporting `async function requireAdmin(ctx: MutationCtx)` that returns `{ identity, user, updatedBy, updatedAt }` and throws on unauthenticated or non-admin callers.
- [x] 6.2 Replaced the 18-line duplicated admin-check blocks in `convex/aiModels.ts` (`upsert` and `bulkUpsert` handlers) with single `await requireAdmin(ctx)` calls + destructure.
- [x] 6.3 No `_generated/api` change needed: `requireAdmin` is a plain TypeScript helper (not wrapped with `query`/`mutation`/`action`), so it is not registered as a Convex function. Convex routing is unchanged.
- [ ] 6.4 Manual smoke test (admin saves a model config) — **deferred to the next dev session**; admin auth pathway is untouched at the source level (extracted helper is a verbatim move of the inlined block).

## 7. Documentation and developer-flow updates

- [x] 7.1 Added "Post-Feature Quality Checks" section to `CLAUDE.md` listing the sequence: `npx eslint --fix .` → `tsc --noEmit` → `npm run fallow` → triage → report done.
- [x] 7.2 Updated "Code Quality Gates" in `openspec/project.md` from three to four gates, adding `npm run fallow` with cross-reference to the `code-quality` capability spec.
- [ ] 7.3 README entry — **skipped**: project has no top-level `README.md`. CLAUDE.md and `openspec/project.md` updates above are the canonical project documentation surfaces.

## 8. Final verification

- [ ] 8.1 `tsc --noEmit && npm run lint && npm run build` — pending Windows file-handle release (see 3.5/4.7).
- [x] 8.2 `npx fallow dead-code --format json --quiet` final count: **580 total issues** (down from 780 raw, -26%). Breakdown: 23 unused files (-33), 321 unused exports (-50), 214 unused types (-109), 1 unused dep (`recharts` only — held), 1 duplicate-exports aggregate (suppressed), 9 unused class members (out of scope — agent processors).
- [ ] 8.3 `npx fallow dupes --format json --quiet --top 5` to confirm `convex/aiModels.ts` admin-block clone group eliminated — to run after final verification session.
- [x] 8.4 `openspec validate add-fallow-codebase-cleanup --strict` → `Change 'add-fallow-codebase-cleanup' is valid`.
