## Context
The routing agent delegates to 9 sub-agents via Mastra's `agents` property. The user has no way to constrain which sub-agents are available. This change adds a UI picker that filters the `agents` record at Mastra instance construction time.

## Goals / Non-Goals
- **Goal**: Let users toggle data sources on/off per conversation turn
- **Goal**: Filter at Mastra agent-construction level (not prompt-level) for hard enforcement
- **Non-goal**: Per-thread persistent source preferences (future work)
- **Non-goal**: Admin-level source disabling (separate concern)

## Decisions

### 1. Filter at agent construction, not prompt
**Decision**: Exclude disabled agents from the `agents: {}` record passed to `createRoutingAgent()`.
**Why**: The routing agent literally cannot call an agent it doesn't have. Prompt-level hints could be ignored by the LLM.

### 2. Cache key includes enabled sources
**Decision**: Include sorted `enabledSources` in `getMastraWithModels` cache key.
**Why**: Different source selections need different Mastra instances. Sorting ensures `[cbs, datagov]` and `[datagov, cbs]` hit the same cache.

### 3. Picker trigger in PromptInput footer
**Decision**: Place the trigger button in `PromptInputFooter` alongside the submit button, styled as a compact pill.
**Why**: Matches the ChatGPT pattern where model selector sits in the input toolbar. Doesn't add vertical space.
**Trigger label**:
- All selected (default): "בחר מקורות מידע" with `DatabaseIcon`
- Subset selected: "X מקורות מידע נבחרו" with `DatabaseIcon`

### 4. Popover grouped by LANDING_CATEGORIES
**Decision**: Reuse `LANDING_CATEGORIES` (ממשל ותקציב, כלכלה ונדל"ן, בריאות) as CommandGroups.
**Why**: Consistent with landing page and EmptyConversation grouping. Already the single source of truth for categories.

### 5. Source logo with icon fallback
**Decision**: Show `<img src={logo} />` when SVG exists in `/public`, fall back to LucideIcon from display config.
**Why**: Only 2 of 9 logos currently exist. Icon fallback prevents broken images.

## Risks / Trade-offs
- **Cache proliferation**: Many unique source combos = many cached Mastra instances. Mitigated by single-entry cache (only last combo is kept).
- **MCP agent startup latency**: BudgetKey MCP agent takes time to initialize. If frequently toggled on/off, users pay the init cost each time. Acceptable tradeoff.

## Open Questions
- None — design is straightforward.
