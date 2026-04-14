# Proposal: Unify Source URL Resolution

## Change ID
`unify-source-url-resolution`

## Summary
Consolidate the 3-path source URL collection system into a single, deterministic resolution layer. Today, source URLs are collected in `MessageItem.tsx` via: (1) native AI SDK `source-url` parts, (2) 8 dedicated `generate*SourceUrl` tools that the agent explicitly calls, and (3) auto-resolvers co-located in 24 tool files. This proposal eliminates the dedicated tools entirely and moves all resolution logic into per-data-source resolver registries — one definition site per data source, one collection site in the UI.

## Motivation

### Current problems
1. **3 separate code paths** in `MessageItem.tsx` (lines 118-214) collect source URLs — each with different logic, different type handling, and different urlType assignment
2. **8 dedicated `generate*SourceUrl` tools** waste agent steps, consume tokens, and appear in `AgentInternalCallsChain` confusing users with "tool calls" that are just URL construction
3. **24 resolver functions** scattered across individual `.tool.ts` files with inconsistent patterns — some check `apiUrl`, some `portalUrl`, some both
4. **Tight coupling**: `MessageItem.tsx` must know about `SOURCE_URL_TOOL_NAMES`, `SOURCE_TOOL_TYPES`, `isAgentDataPart`, and the internal structure of `data-tool-agent` parts to collect sources
5. **No portal URLs from data tools**: The dedicated tools exist because data tools return only `apiUrl` but not `portalUrl`. The fix is to add `portalUrl` to tool outputs, not to create separate tools

### Target state
- **Per data source**: One `sourceResolvers` record (already exists in registry) that deterministically extracts both `apiUrl` and `portalUrl` from tool outputs. No separate tools needed.
- **In UI**: One function call in `MessageItem.tsx` that iterates all tool parts + sub-agent tool results and resolves sources via the registry. No special-casing for dedicated tools.

## Prerequisites
- `merge-drugs-health-datasource` change must be complete (health merger done)

## Scope

### In scope
1. Add `portalUrl` to all data tool outputs that currently lack it (knesset, govmap, shufersal, rami-levy tools)
2. Update all 24 auto-resolvers to return BOTH api and portal source URLs (instead of one or the other)
3. Enhance `ToolSourceResolver` type to return `ToolSource[]` (array) instead of `ToolSource | null` — a single tool can produce both an API link and a portal link
4. Delete all 8 `generate*SourceUrl` tool files
5. Remove `SOURCE_URL_TOOL_NAMES` from registry
6. Simplify `MessageItem.tsx` source collection to 2 paths: native AI SDK parts + unified auto-resolution
7. Filter `generate*SourceUrl` tools from `AgentInternalCallsChain` (immediate fix while the dedicated tools still exist on old conversations)
8. Remove dedicated tool entries from agent instructions (agents no longer need to "call generateSourceUrl")

### Out of scope
- Changing the `SourcesPart.tsx` rendering UI (portal vs api grouping stays)
- Changing how native AI SDK `source-url` parts work
- Adding new source URL types beyond 'api' and 'portal'

## Impact Analysis

### Files deleted (8 generate-source-url tools)
- `src/data-sources/cbs/tools/source/generate-source-url.tool.ts`
- `src/data-sources/datagov/tools/generate-source-url.tool.ts`
- `src/data-sources/govmap/tools/nadlan/generate-source-url.tool.ts`
- `src/data-sources/health/tools/drugs/generate-source-url.tool.ts`
- `src/data-sources/health/tools/overview-data/generate-source-url.tool.ts`
- `src/data-sources/knesset/tools/generate-source-url.tool.ts`
- `src/data-sources/shufersal/tools/generate-source-url.tool.ts`
- `src/data-sources/rami-levy/tools/generate-source-url.tool.ts`

### Files modified
- `src/data-sources/types/tool.types.ts` — `ToolSourceResolver` returns `ToolSource[]`
- All 24 `.tool.ts` files with `resolveSourceUrl` — return array, add portal URLs where missing
- All `tools/index.ts` barrels — remove generate-source-url exports and tool entries
- `src/data-sources/registry.ts` — remove `SOURCE_URL_TOOL_NAMES`
- `src/components/chat/MessageItem.tsx` — simplify to 2-path collection
- `src/components/chat/ToolCallParts.tsx` — remove source tool filtering logic (no longer needed)
- Agent instruction files — remove "call generateSourceUrl" instructions
- `src/data-sources/CLAUDE.md` — update documentation

### Files unchanged
- `src/components/chat/SourcesPart.tsx` — rendering stays the same
- `src/components/chat/types.ts` — `EnrichedSourceUrl` stays the same

## Risks
- **Old conversations**: Persisted `data-tool-agent` parts may contain `generate*SourceUrl` tool results. The simplified `MessageItem.tsx` won't have special handling for them, so those old source URLs would be lost on reload. Mitigation: Keep the `SOURCE_TOOL_NAMES_SET` check in the sub-agent scanning path as a backward-compat fallback, but mark it deprecated.
- **Agent behavior change**: Agents currently call dedicated source URL tools. After removal, they won't — but the auto-resolvers will extract the same URLs deterministically. No user-visible difference.
- **Portal URL construction**: Some portal URLs require parameters not present in tool outputs (e.g., GovMap coordinates for map links). The tool output schemas may need to include these fields.

## Success Criteria
1. `tsc --noEmit` passes
2. `npm run build` succeeds
3. All contract tests pass
4. Source URLs appear identically in the UI (same portal and API links)
5. `generate*SourceUrl` tools no longer appear in `AgentInternalCallsChain`
6. `MessageItem.tsx` source collection is under 30 lines (down from ~100)
7. No dedicated source URL tools exist in any data source
8. Adding source URL support for a new tool requires only adding a resolver to the tool file and registering it in `tools/index.ts`
