# Change: Add Admin Dashboard Analytics

## Why
The admin page currently only has model configuration. There's no visibility into how users interact with the platform — no user counts, message volumes, thread patterns, or engagement metrics. Admins need a data-driven dashboard to understand usage and make informed decisions.

## What Changes
- Add Convex query functions for aggregating analytics data from `mastra_threads`, `mastra_messages`, `thread_usage`, `thread_billing`, `users`, and `guests` tables
- Extend the admin page with a tabbed layout: "Models" tab (existing) + "Analytics" tab (new)
- Build analytics dashboard with Recharts charts and stat cards, mobile responsive via `useIsMobile()`
- Add time-range filtering (last hour, last 24h, last 7d, last 30d, all time)
- Track prompt card usage by matching first user message against `PROMPT_CARDS` prompts

## Impact
- Affected specs: new `admin-dashboard` capability
- Affected code:
  - `convex/analytics.ts` (new) — aggregation queries
  - `src/app/admin/page.tsx` — tabbed layout, analytics tab
  - `src/components/admin/AnalyticsDashboard.tsx` (new) — dashboard component
  - `src/components/admin/charts/` (new) — Recharts chart wrappers
  - `package.json` — add `recharts` dependency
