## Context

The repository has been built largely with AI-assisted edits, which produces predictable shapes of debt: utility functions duplicated across files, exports left in place after callers were removed, components left orphan after features were ripped out, and dependencies retained in `package.json` long after the last import was deleted. A baseline Fallow scan quantifies this: 12.4% of source files unreachable, 35.5% of exports never imported, four duplicate exports including one (`resolveSourceUrl`) redefined in six different files.

The project already enforces ESLint, TypeScript strict mode, and a `vibecheck` quality gate, but none of those tools answer the question "is this used?". Fallow is purpose-built for that question, runs in sub-second time, produces JSON output suitable for both humans and agents, and ships 90 framework plugins with zero configuration. CLAUDE.md is the only existing mechanism asking the AI to "not create utilities that should be global" — but that is advisory text and AI ignores it routinely. Replacing advisory text with a deterministic gate is the central motivation for this proposal.

Two project-specific constraints shape the design:

1. CLAUDE.md explicitly says `src/components/ai-elements/**` and `src/components/ui/**` are vendored from external libraries and "DO NOT modify unless instructed". Any tool that flags issues there will produce noise the developer must learn to ignore — which defeats the gate. Both directories must be excluded from Fallow's scope.
2. The project mixes runtime code (`src/`, `convex/`) with build artifacts (`convex/_generated/`), test fixtures (`**/*.test.ts`, `**/*.typecheck.ts`), and a service-worker entry (`public/sw.js`) that has no static caller. These all surface as false positives unless explicitly excluded.

## Goals / Non-Goals

**Goals**
- Get the repository to a state where `npx fallow dead-code` reports only findings the team intends to act on, so future Fallow runs are signal not noise.
- Establish `code-quality` as a first-class capability in OpenSpec so future tooling additions (e.g., wiring Fallow into pre-commit, adding `knip`, swapping ESLint for Biome) attach to a coherent spec rather than appearing as one-off CLAUDE.md edits.
- Eliminate the four duplicate exports and the duplicated `requireAdmin` block — these are concrete maintainability hazards (a future bug fix to `resolveSourceUrl` would need to be applied six times today).
- Reclaim the four chart files and the free-text component that were orphaned by recent feature removals — they are inert weight on bundle analysis, search results, and AI context.

**Non-Goals**
- Refactoring complexity hotspots (`convex/analytics.ts`, `src/app/api/chat/route.ts`). Each is a multi-day effort and should land in its own proposal once the baseline cleanup makes Fallow output legible.
- Reviewing the ~620 unused exports inside data-source modules. Many are generated alongside Zod schemas and may be intentionally re-exported for tool authors; that audit needs a per-source review and is deferred.
- Wiring Fallow into pre-commit or CI. The gate stays advisory in this proposal — first we must reach a clean baseline, otherwise CI would fail on day one.

## Decisions

### Decision: Use `.fallowrc.json` (JSON) rather than `fallow.toml`
- **Rationale**: Project tooling is JS-first; developers already maintain `tsconfig.json`, `package.json`, `eslint.config.mjs`. JSON keeps the cognitive load on one format, plays nicely with the `$schema` field for editor autocomplete, and matches Fallow's documented "most common" config form.
- **Alternatives considered**: `fallow.toml` (chosen by Rust shops, but adds a parser-context switch); embedding inside `package.json` (Fallow does not support this; even if it did, growing `package.json` with another tool's config is a known pain point).

### Decision: Exclude `ai-elements/`, `ui/`, `public/`, and test files via `ignorePatterns`
- **Rationale**: These are either vendored, runtime entry points without static callers, or test fixtures. Including them generates noise; excluding them brings reported issues down to actionable code. CLAUDE.md already treats `ai-elements/` and `ui/` as off-limits; the Fallow config is the deterministic encoding of that policy.
- **Alternatives considered**: Inline `// fallow-ignore-file` comments in each file (high overhead, easy to forget on new files); leaving them in scope and filtering manually (defeats the gate's value).

### Decision: Keep `@nivo/core` despite no direct import

- **Rationale**: `pnpm-lock.yaml` shows `@nivo/core@0.99.0` resolved as a peer dependency of `@nivo/bar`, `@nivo/line`, and `@nivo/pie`, all of which are imported directly by `src/components/chat/ChartRenderer.tsx` and `src/components/admin/charts/*`. Fallow's static analysis flags `@nivo/core` as unused because no source file does `import … from '@nivo/core'`, but the package is required at runtime for the chart components to render. Removing it would break the chart pipeline. We keep it in `package.json` and add it to `.fallowrc.json` `ignoreDependencies` — the deterministic encoding of "this is a known peer-dep false positive".
- **Alternatives considered**: Drop the dep and rely on automatic peer-dep installation by pnpm (fragile across package-manager versions and CI environments); add a fake `import` somewhere to satisfy Fallow (anti-pattern; introduces mystery code).

### Decision: Remove `@mastra/deployer-vercel` (verified unused); defer `recharts` until manual admin-panel check
- **Rationale**: `@mastra/deployer-vercel` is consumed by importing `VercelDeployer` and passing it to the `Mastra` constructor's `deployer` field, which produces a `.vercel/output` directory conforming to Vercel's Build Output API for standalone Mastra server deployment. This project does not deploy Mastra standalone — `src/agents/mastra.ts` line 65 constructs `Mastra` with only `agents`, `storage`, `observability`, and `scorers` fields, and Mastra is invoked from `src/app/api/chat/route.ts` as embedded library code that ships inside the Next.js Vercel deployment. No source file imports `VercelDeployer`. The package is therefore safe to remove. `recharts` remains held because the user explicitly asked for an admin-panel manual check before removal, and a charting library could be referenced via a string-keyed dynamic import that static analysis would miss.
- **Alternatives considered**: Remove `recharts` immediately based on the negative `rg recharts src/` result — rejected to honor the user's explicit request and because dynamic chart-component selection is a known charting-library pattern.

### Decision: Extract `resolveSourceUrl` to `src/data-sources/_shared/resolve-source-url.ts` rather than each data source's own folder
- **Rationale**: The function is duplicated across two data sources (`datagov` and `health/drugs`). Putting the canonical version under either source biases ownership; a `_shared/` folder under `data-sources/` matches the existing convention (`data-sources/types/`) and signals that the util is cross-source.
- **Alternatives considered**: Keep one copy in `datagov/` and import from there (creates an awkward cross-source import in `health/`); promote to `src/lib/utils/` (overly generic — the function is data-source-specific).

### Decision: Create `convex/_shared/auth.ts` for `requireAdmin` rather than `convex/lib/`
- **Rationale**: Convex's file-routing model treats every file under `convex/` as a potential function entry. A `_shared/` (or any underscore-prefixed) folder is a documented Convex convention for non-route helpers. Naming it `auth.ts` makes it discoverable when a future admin-only mutation needs the same check.
- **Alternatives considered**: Inline as a private function inside `aiModels.ts` (fails to remove the duplication once a second admin-only file is added — and `aiModels.ts` already contains the duplication twice within itself); place under `convex/utils.ts` (mixes auth with unrelated helpers).

## Risks / Trade-offs

- **Risk**: Deleting an admin chart file reintroduces import errors elsewhere if the component is referenced from a non-obvious place (e.g., a string-keyed dynamic import). **Mitigation**: Step 4.6 grep for the component name across the repo before each delete; `tsc --noEmit && npm run build` after the batch.
- **Risk**: `requireAdmin` extraction subtly changes auth semantics (e.g., timing of `Date.now()` capture). **Mitigation**: Extracted helper returns `{ user, identity, updatedBy, updatedAt }` — same shape as the inline code — so call sites only swap the block for a destructure. Manual smoke test in step 6.4.
- **Risk**: Excluding `public/` hides a future regression (e.g., a new file added to `public/` that should have been imported by some entry). **Mitigation**: Acceptable. `public/` is by design a static asset directory and Next.js does not statically import from it.
- **Trade-off**: We do not gate CI on `fallow --fail-on-issues` in this proposal. That means a regression could slip in. The reasoning is that gating CI on a tool with 780 baseline findings would either need a giant initial cleanup PR (high blast radius) or a baseline-with-tolerance config (effort outpaces value). After the baseline is clean and a few weeks of advisory use establish team trust, a follow-up proposal can flip the gate to enforcing.

## Migration Plan

The change is forward-only — no deprecation period and no need for a rollback path beyond standard `git revert`. Sequence:

1. Land tooling foundation (section 1) and verification (section 2) in the same PR. This is non-destructive: just a config file and grep results.
2. Land dependency removal (section 3) in a separate PR so `package.json` / lockfile changes are reviewable in isolation.
3. Land file deletions (section 4), duplicate-export refactors (section 5), and `requireAdmin` extraction (section 6) in one PR. They share the same risk profile (mechanical, type-checked) and reviewing them together makes the diff narrative coherent ("we removed dead code and consolidated duplication").
4. Land documentation (section 7) and final verification (section 8) in the same PR, alongside the OpenSpec archive once the change is deployed.

If any step regresses, `git revert` restores the prior state with no data-migration concern (Convex schema is unchanged).

## Open Questions

- Should `npm run vibecheck` be replaced or augmented by `npm run fallow`? They overlap on "code health" but Fallow has stronger dead-code coverage. **Working assumption**: keep both for now; revisit when adding the CI gate in a follow-up.
- Is there value in adding `fallow flags` (feature-flag detection) given that this project uses environment-variable-driven flags (`AI_DEFAULT_MODEL_ID`, `OPENROUTER_API_KEY`)? **Working assumption**: not in this proposal; the dead-code/duplication signal is the priority.
