# Change: Redesign source URL display with provider grouping, URL type hierarchy, and editorial styling

## Why

Source URL chips at the bottom of messages are flat and indistinguishable — all use the same gray styling. When a response uses 12+ sources from both CBS and DataGov, the user can't tell:
- Which source came from which data provider (CBS vs DataGov)
- Whether a link opens a human-readable portal page or a raw JSON API endpoint
- Generic titles like "דרום" or "מרכז" are meaningless without context

Research into Perplexity, ChatGPT, and Google AI Overview shows that effective source displays:
1. Group by provider with visual identity
2. Prioritize user-actionable links (portal pages) over technical links (APIs)
3. Use collapsible sections to avoid overwhelming the user

## Design Direction: Editorial Reference

An "editorial reference" aesthetic — structured like a bibliography. Authoritative, clean, and scannable.

### Layout

```
┌─────────────────────────────────────────────┐
│  ▾ 12 מקורות: למ"ס 7 · data.gov.il 5       │  ← trigger pill with provider breakdown
├─────────────────────────────────────────────┤
│                                             │
│  ┃ מידע ממשלתי (data.gov.il)               │  ← blue-green right-border accent
│  ┃                                          │
│  ┃  🌐 רכבת תכנון מול ביצוע — data.gov.il  │  ← portal links (primary)
│  ┃  🌐 פרטי משאב — data.gov.il             │
│  ┃                                          │
│  ┃  ▸ קישורים טכניים (3)                    │  ← API links collapsed
│  ┃    📡 שאילתת נתונים — shana=2026         │     (expand to see)
│  ┃    📡 שאילתת נתונים — shana=2025         │
│  ┃                                          │
│  ┃ למ"ס (CBS)                               │  ← orange right-border accent
│  ┃                                          │
│  ┃  📡 מדד מחירי דירות — דרום              │  ← CBS only has API links
│  ┃  📡 מדד מחירי דירות — מרכז             │
│  ┃  📡 מדד המחירים לצרכן                   │
│                                             │
└─────────────────────────────────────────────┘
```

### Design Principles
- **Trigger pill**: Shows total count + provider breakdown — user sees at a glance without expanding
- **Provider sections**: Subtle colored right-border (RTL) using existing `--badge-cbs`/`--badge-datagov` CSS vars — not full badge backgrounds
- **Portal links first**: User-actionable pages shown prominently with 🌐 icon
- **API links collapsed**: Under "קישורים טכניים" toggle — for power users and transparency
- **No favicons**: Only 2 providers, color stripe identifies them
- **Full-width rows**: Not cramped chips — each source gets a proper row with title + domain

## What Changes

### 1. Extend source type with metadata
Add `dataSource` and `urlType` to source URL type.

### 2. Update resolveToolSourceUrl
Return `urlType: 'portal' | 'api'` based on whether `portalUrl` or `apiUrl` was used.

### 3. Populate metadata during collection
In `MessageItem.tsx`, derive `dataSource` from agent name or tool name, and pass `urlType`.

### 4. Redesign SourcesPart component
Replace flat chip list with editorial reference layout using shadcn Collapsible.

## Impact
- Affected specs: `agent-tools`
- Affected code:
  - `components/chat/types.ts` — extend source URL type
  - `lib/tools/source-url-resolvers.ts` — return `urlType`
  - `components/chat/MessageItem.tsx` — populate `dataSource` and `urlType`
  - `components/chat/SourcesPart.tsx` — full redesign with grouped collapsible layout
  - Reuses: `constants/tool-data-sources.ts`, `constants/agents-display.ts`, shadcn Collapsible
