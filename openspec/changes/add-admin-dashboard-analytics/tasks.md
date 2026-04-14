## 1. Setup & Dependencies
- [x] 1.1 Install `recharts` package via pnpm
- [x] 1.2 Install shadcn `tabs` component: `npx shadcn@latest add tabs`
- [x] 1.3 Extract `PROMPT_CARDS` array from `EmptyConversation.tsx` into `src/constants/prompt-cards.ts` (shared between UI and analytics)
- [x] 1.4 Update `EmptyConversation.tsx` to import from the new shared constant

## 2. Convex Analytics Backend
- [x] 2.1 Create `convex/analytics.ts` with analytics query functions:
  - `getOverviewStats(sinceTimestamp)` — returns unique users (total, registered, guests), total registered users, total guests, registered/guest conversion rates (who opened threads vs total), total threads, total messages, avg threads/user, avg threads/guest, avg messages/user, avg messages/guest, avg messages/thread
  - `getThreadOrigins(sinceTimestamp)` — returns thread counts by prompt card label vs free-text, using first user message matching against PROMPT_CARDS
  - `getThreadsOverTime(sinceTimestamp, bucketSize)` — returns thread creation counts bucketed by hour or day
  - `getTokenUsageByModel(sinceTimestamp)` — returns prompt/completion token totals grouped by model from `thread_billing`
  - `getAgentDelegationBreakdown(sinceTimestamp)` — returns delegation counts for datagovAgent, cbsAgent, direct responses from `mastra_messages`
- [x] 2.2 Add necessary indexes to schema if needed (verify existing indexes cover time-range queries) — all required indexes already exist
- [x] 2.3 Verify queries work with `npx tsc --noEmit` (type-check passes — exit 0)

## 3. Admin Page Layout Refactor
- [x] 3.1 Add shadcn `Tabs` to admin page with "מודלים" and "אנליטקות" tabs
- [x] 3.2 Move existing model config UI into "מודלים" tab content (no behavior changes)
- [x] 3.3 Create `src/components/admin/AnalyticsDashboard.tsx` as the "אנליטיקס" tab content
- [x] 3.4 Add time-range selector component (dropdown/segmented control with: שעה אחרונה, 24 שעות, 7 ימים, 30 ימים, הכל)

## 4. Dashboard Sections
- [x] 4.1 Create `src/components/admin/StatCard.tsx` — reusable stat card (label, value, optional subtitle)
- [x] 4.2 Section A: Top-level KPI row (4 StatCards — סה״כ שיחות, סה״כ הודעות, משתמשים פעילים, ממוצע הודעות לשיחה). 4 cols desktop, 2x2 mobile.
- [x] 4.3 Create `src/components/admin/UserGuestBreakdownCard.tsx` — mini-table card showing total, active (with %), avg threads, avg messages
- [x] 4.4 Section B: Two side-by-side UserGuestBreakdownCards ("משתמשים רשומים" + "אורחים"). 2 cols desktop, stacked mobile.
- [x] 4.5 Wire sections A+B to `getOverviewStats` Convex query with selected time range

## 5. Charts Implementation (Recharts)
- [x] 5.1 Create `src/components/admin/charts/ThreadOriginChart.tsx` — Donut/Pie chart showing prompt card vs free-text thread distribution
- [x] 5.2 Create `src/components/admin/charts/ThreadsOverTimeChart.tsx` — Area chart showing thread creation trend over time
- [x] 5.3 Create `src/components/admin/charts/TokenUsageChart.tsx` — Stacked bar chart showing prompt vs completion tokens by model
- [x] 5.4 Create `src/components/admin/charts/AgentDelegationChart.tsx` — Pie chart showing routing agent delegation distribution
- [x] 5.5 Wire all charts to their respective Convex queries with time-range parameter
- [x] 5.6 Apply theme-aware colors using CSS variables (--chart-1 through --chart-5) for dark/light mode
- [x] 5.7 All chart titles, axis labels, legends, and tooltips in Hebrew (RTL)

## 6. Mobile Responsiveness
- [x] 6.1 Use `useIsMobile()` hook for layout switching (grid columns, chart heights, margins)
- [x] 6.2 Recharts `ResponsiveContainer` for all charts with adaptive heights (300px mobile, 400px desktop)
- [x] 6.3 Adjust chart margins, font sizes, and legend placement for mobile

## 7. Verification
- [x] 7.1 Run `tsc` — zero type errors ✓
- [x] 7.2 Run `npm run build` — build succeeds ✓
- [x] 7.3 Run `npm run lint` — no new lint errors (0 errors, pre-existing warnings only) ✓
- [x] 7.4 Run `npm run vibecheck` — code quality passes ✓
- [ ] 7.5 Manual test: verify admin page loads both tabs correctly
- [ ] 7.6 Manual test: verify charts render with mock/real data
- [ ] 7.7 Manual test: verify mobile responsiveness (resize browser below 768px)
