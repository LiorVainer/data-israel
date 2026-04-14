# Tasks: Unify Source URL Resolution

## Phase 1: Type system & generic resolver

- [x] **1.1** Update types in `src/data-sources/types/`:
  - Add `CommonToolInput` type to `tool-schemas.ts` (inferred from `commonToolInput` fragment)
  - Add `ToolSourceConfig` type to `tool.types.ts`: `{ title: string }`
  - Make `ToolSourceResolver` generic: `ToolSourceResolver<TInput = CommonToolInput, TOutput = ToolOutputSchemaType<{}>>` returning `ToolSource[]`
  - Custom resolvers specify tool-specific types: `ToolSourceResolver<z.infer<typeof myInputSchema>, z.infer<typeof myOutputSchema>>`

- [x] **1.2** Add `sourceConfigs` field to `DataSourceMeta` in `src/data-sources/registry.ts`:
  - `sourceConfigs: Partial<Record<string, ToolSourceConfig>>`
  - Keep `sourceResolvers` as optional override for custom cases

- [x] **1.3** Add generic `buildSourceResolver()` function in registry:
  - Uses `ToolOutputSchemaType<{}>` for type-safe output access (no `unknown`/`getString`)
  - Extracts both `apiUrl` and `portalUrl` from discriminated union
  - Builds title from `config.title` + `input.searchedResourceName`

- [x] **1.4** Update `resolveToolSourceUrl` → `resolveToolSourceUrls` (returns `ToolSource[]`):
  - Check custom `sourceResolvers` first (override), fall back to `sourceConfigs` (generic)

## Phase 2: Migrate data sources to declarative configs (parallel)

For each data source: replace `resolveSourceUrl` function exports with `sourceConfigs` objects. Add `portalUrl` to tool outputs that lack it. Keep custom resolvers only for exceptions.

- [x] **2.1** **CBS**: Replace 4 resolver functions with `cbsSourceConfigs`. No custom overrides.
- [x] **2.2** **DataGov**: Replace with `datagovSourceConfigs`. Keep custom resolver for `getDatasetDetails` (extracts `dataset.title`).
- [x] **2.3** **GovMap (nadlan)**: Replace 6 resolvers with `govmapSourceConfigs`. Add `portalUrl` to tool outputs.
- [x] **2.4** **Knesset**: Replace 5 resolvers with `knessetSourceConfigs`. Add `portalUrl` to tool outputs.
- [x] **2.5** **Shufersal**: Replace 1 resolver with config. Add `portalUrl` to search-products output.
- [x] **2.6** **Rami Levy**: Replace 1 resolver with config. Add `portalUrl` to search-products output.
- [x] **2.7** **Health (drugs)**: Replace with configs. Keep typed custom resolver for `getDrugDetails`:
  - Export `type GetDrugDetailsInput` and `type GetDrugDetailsOutput` as `z.infer` of schemas
  - Resolver typed as `ToolSourceResolver<GetDrugDetailsInput, GetDrugDetailsOutput>` — accesses `output.hebrewName` with full type safety
- [x] **2.8** **Health (overview-data)**: Replace 1 resolver with config. Add `portalUrl` to health data output.
- [x] **2.9** Delete all `isRecord()`/`getString()` helper duplicates from tool files (no longer needed).

## Phase 3: Delete dedicated source URL tools (parallel)

- [x] **3.1** Delete all 8 `generate-source-url.tool.ts` files
- [x] **3.2** Update all `tools/index.ts` barrels — remove generate-source-url imports/exports/entries
- [x] **3.3** Remove `SOURCE_URL_TOOL_NAMES` from `src/data-sources/registry.ts`
- [x] **3.4** Remove generate-source-url entries from all translation files
- [x] **3.5** Remove "call generateSourceUrl" from agent instructions in all `*.agent.ts` files

## Phase 4: Simplify UI collection

- [x] **4.1** Simplify `src/components/chat/MessageItem.tsx`:
  - 2 paths only: native AI SDK parts + unified `resolveAllToolSources()`
  - Remove `SOURCE_TOOL_TYPES`, `SOURCE_TOOL_NAMES_SET`, dedicated tool handling
  - Add backward-compat fallback for old persisted generate*SourceUrl results (marked DEPRECATED)

- [x] **4.2** Clean up `src/components/chat/ToolCallParts.tsx`:
  - Remove source URL tool filtering (no longer needed)

## Phase 5: Verification

- [x] **5.1** `tsc --noEmit` — zero errors
- [x] **5.2** `npm run build` — succeeds
- [x] **5.3** `vitest run` — all tests pass (update contract tests for new resolver signature)
- [x] **5.4** Manual: verify source URLs appear correctly for each data source
- [x] **5.5** Manual: verify generate*SourceUrl no longer in AgentInternalCallsChain
- [x] **5.6** Update `src/data-sources/CLAUDE.md` with new pattern:
  - Replace `resolveSourceUrl` function examples with `ToolSourceConfig` declarative pattern
  - Document `ToolSourceResolver<TInput, TOutput>` generic for custom resolvers
  - Update "Step 3" guide to show `sourceConfigs` instead of hand-written resolvers
  - Remove references to `generate-source-url.tool.ts` and `isRecord()`/`getString()` helpers
- [x] **5.7** Update `.claude/skills/add-data-source/` skill:
  - Update SKILL.md and references to reflect `sourceConfigs` pattern instead of `sourceResolvers`
  - Update implementation-pattern.md with declarative config example
  - Remove generate-source-url tool from the skill's tool creation templates

## Dependencies
- Phase 2 depends on Phase 1 (types + generic resolver must exist)
- Phase 3 depends on Phase 2 (configs must cover portal URLs before deleting dedicated tools)
- Phase 4 depends on Phase 3 (UI simplification after tools are gone)
- Phase 5 depends on Phase 4
- Within Phase 2: all tasks can run in parallel
- Within Phase 3: all tasks can run in parallel
