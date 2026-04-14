---
paths:
  - "src/components/chat/**"
  - "src/app/(main)/chat/**"
  - "src/components/navigation/AppSidebar.tsx"
  - "src/components/navigation/SidebarToolbar.tsx"
---

# Chat UI Rendering & Navigation Rules

Rules for the chat rendering pipeline, message segmentation, source URL collection, and chat navigation (including sidebar button visibility and `?new` query param handling).

## UI Rendering Pipeline (MessageItem)

`MessageItem` orchestrates all message rendering via `segmentMessageParts()`, which groups consecutive server-side tool parts into `tool-group` segments (absorbing step-boundary parts like reasoning and empty text between tools). Client tools (charts, source URLs) are excluded from tool groups and rendered separately.

### Render branches by segment type

- **tool-group** → `ToolCallParts` → `ChainOfThought` timeline with grouped steps and progress stats.
- **text** → `TextMessagePart` (markdown with regenerate action on last message).
- **reasoning** → `ReasoningPart` (thinking indicator).
- **chart tools** (`displayBarChart`/`displayLineChart`/`displayPieChart`) → `ChartRenderer` / `ChartLoadingState` / `ChartError`.

### Sub-agent tool calls

`ToolCallParts` uses `buildAgentInternalCallsMap()` to scan `data-tool-agent` parts and extract internal tool calls, then `groupToolCalls()` merges them with agent-level parts for the timeline UI.

### Source URL collection (3 sources, deduplicated by URL + title)

1. Native `source-url` parts from the AI SDK stream.
2. Dedicated source URL tools (`generateDataGovSourceUrl`, `generateCbsSourceUrl`).
3. Auto-resolved from data tool outputs via `resolveToolSourceUrl()` (scans both direct tools and sub-agent results inside `data-tool-agent` parts).

Deduplication uses **both URL and title** to prevent duplicate chips when the same URL appears with different titles or vice versa.

### Key types in `src/components/chat/types.ts`

- `AgentDataPart` / `isAgentDataPart()` — typed shape and guard for `data-tool-agent` parts.
- `ToolCallPart` / `getToolStatus()` — tool state handling (active/complete).
- `SourceUrlUIPart` — unified source URL shape.

## Navigation & Chat Loading

- **New conversations**: Created via `crypto.randomUUID()` + `router.push(/chat/${id}?new)`. The `?new` query param tells `ChatThread` to **skip message fetching** (no loading skeleton flash on empty threads). On first message send, `?new` is removed from URL via `replaceState`.
- **Existing conversations**: `ChatThread` fetches saved messages via `useQuery` → shows `MessageListSkeleton` while loading → then renders messages. `EmptyConversation` only shows when the query is not fetching AND messages are empty.
- **Chat page**: Client component (`'use client'`) using `useParams()` to avoid Suspense boundary flash from async server components.
- **Sidebar inset buttons**: `HomeLogoButton` (logo → landing page) and `NewThreadButton` (new chat) sit next to `SidebarTrigger`. Visibility rules:
  - All three hidden when sidebar is **open**.
  - `HomeLogoButton` also hidden on the **landing page**.
  - Buttons have a shadow on mobile for visibility against chat content.
