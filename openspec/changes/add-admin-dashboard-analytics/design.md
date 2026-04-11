## Context
The admin page (`/admin`) currently only manages per-agent model selection. We need analytics visibility into platform usage. Data lives across multiple Convex tables (mastra_threads, mastra_messages, thread_usage, thread_billing, users, guests).

## Goals / Non-Goals
- **Goals:**
  - Surface key engagement metrics (unique users, message volumes, thread counts)
  - Provide time-range filtering for all metrics
  - Detect prompt card vs. free-text thread origins via first-message matching
  - Show token usage and cost breakdown by model/agent
  - Mobile-responsive dashboard using `useIsMobile()` hook
  - Use Recharts for all chart visualizations

- **Non-Goals:**
  - Real-time live-updating charts (Convex reactivity is fine, no WebSocket push)
  - Export/download functionality
  - User-level drill-down (no individual user tracking)
  - Historical data backfill

## Decisions

### Charting Library: Recharts
- Already a React-first library with composable components
- `ResponsiveContainer` handles responsive sizing natively
- Supports PieChart, BarChart, LineChart, AreaChart out of the box
- Lightweight compared to D3-based alternatives

### Data Aggregation: Server-side Convex queries
- All aggregation happens in Convex query functions (not client-side)
- Queries scan indexed tables with time-range filters
- Use `mastra_threads.by_created` and `mastra_messages.by_thread_created` indexes
- Return pre-computed stats objects to minimize client processing

### Prompt Card Detection
- Match first user message (role='user', earliest in thread) against `PROMPT_CARDS[].prompt` strings
- Exact string match (cards send exact prompt text)
- Threads where first message doesn't match any card = "free text"
- Export `PROMPT_CARDS` from a shared constant (already in EmptyConversation.tsx, extract to constants)

### Tab Layout
- Add tabs to admin page: "מודלים" (Models) and "אנליטקות" (Analytics)
- Use existing shadcn Tabs component
- Preserve current model config UI in Models tab unchanged

### Mobile Responsive Strategy
- Use `useIsMobile()` from `src/hooks/use-mobile.ts`
- Desktop: 2-column grid for stat cards, side-by-side charts
- Mobile: single column, stacked layout, smaller chart heights
- Recharts `ResponsiveContainer` handles chart width automatically
- Adjust chart margins and font sizes based on `isMobile`

## Dashboard Sections & Metrics

### 1. Dashboard Layout — 3 Sections

All labels and tooltips in Hebrew. Organized into sections to avoid visual overload.

#### Section A: Top-Level KPIs (4 stat cards in a row)
Primary numbers at a glance. Desktop: 4 columns. Mobile: 2x2 grid.

| Hebrew Label | Source | Description |
|-------------|--------|-------------|
| סה״כ שיחות | `mastra_threads` count | Threads created in time range |
| סה״כ הודעות | `mastra_messages` count (role='user') | User messages sent in time range |
| משתמשים פעילים | `mastra_threads.resourceId` distinct count | All unique users (registered + guests) who opened threads |
| ממוצע הודעות לשיחה | total messages / total threads | Average engagement depth |

#### Section B: Users vs Guests Breakdown (2 side-by-side cards)
Each card is a mini-table with 4 rows. Desktop: 2 columns. Mobile: stacked.

**Card: "משתמשים רשומים"**

| Row | Source |
|-----|--------|
| סה״כ רשומים: {n} | `users` table count |
| פתחו שיחה: {n} ({x}%) | `mastra_threads.resourceId` cross-ref `users` |
| ממוצע שיחות: {n} | threads by registered / unique registered active |
| ממוצע הודעות: {n} | messages by registered / unique registered active |

**Card: "אורחים"**

| Row | Source |
|-----|--------|
| סה״כ אורחים: {n} | `guests` table count |
| פתחו שיחה: {n} ({x}%) | `mastra_threads.resourceId` cross-ref `guests` |
| ממוצע שיחות: {n} | threads by guests / unique guest active |
| ממוצע הודעות: {n} | messages by guests / unique guest active |

#### Section C: Charts (2x2 grid)
Desktop: 2 columns. Mobile: single column stacked.

### 2. Thread Origin Chart (Pie/Donut) — "מקור שיחות"
- Segments: one per prompt card label + "שאילתה חופשית" (free text)
- Data: count threads where first user message matches each PROMPT_CARDS prompt
- Donut style with labels showing percentages
- Tooltip in Hebrew: "{label}: {count} שיחות ({percent}%)"

### 3. Threads Over Time (Area Chart) — "שיחות לאורך זמן"
- X-axis: time buckets (hourly for last 24h, daily for 7d/30d), Hebrew date format
- Y-axis: "מספר שיחות" (thread count per bucket)
- Shows thread creation trend
- Tooltip: "תאריך: {date}, שיחות: {count}"

### 4. Token Usage by Model (Bar Chart) — "צריכת טוקנים לפי מודל"
- X-axis: model names
- Y-axis: "טוקנים" (total tokens consumed)
- Stacked bars: "טוקני קלט" (prompt tokens) vs "טוקני פלט" (completion tokens)
- Source: `thread_billing` table
- Tooltip: "{model}: קלט {input}, פלט {output}"

### 5. Agent Delegation Breakdown (Pie Chart) — "חלוקת משימות לסוכנים"
- Segments: "סוכן data.gov.il" (datagovAgent), "סוכן הלמ״ס" (cbsAgent), "תשובה ישירה" (direct)
- Source: count tool-agent-* parts in `mastra_messages`
- Tooltip: "{agent}: {count} פניות ({percent}%)"

### 6. Top Active Users (Bar Chart) — "משתמשים פעילים" — optional, if time permits
- X-axis: anonymized user IDs (first 8 chars)
- Y-axis: "מספר שיחות" (thread count)
- Top 10 most active users

## Risks / Trade-offs
- **Performance**: Full table scans on `mastra_messages` could be slow with many records. Mitigation: use indexed queries with time-range bounds, consider pagination for large datasets.
- **Prompt card matching**: If prompt text changes, historical matches break. Mitigation: match by substring or add explicit tracking in future.
- **No caching**: Queries re-run on each load. Mitigation: Convex query caching handles this naturally for unchanged data.

## Open Questions
- Should we add a "refresh" button or rely on Convex reactivity?
  → Decision: Convex queries are reactive, auto-update when data changes. No manual refresh needed.
