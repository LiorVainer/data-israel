# Tasks: add-answers-list-dashboard

## Task List

- [x] 1. Add `getAnswersList` query to `convex/analytics.ts` — joins `answers` with `answer_ratings`, filters by `sinceTimestamp`, returns up to 100 records sorted newest-first. Export `AnswerEntry` interface.
- [x] 2. Run `npx convex dev` to regenerate `convex/_generated/api` so the new query is available at `api.analytics.getAnswersList`.
- [x] 3. Create `src/components/admin/AnswersList.tsx` — scrollable list of answer cards with search, expand-on-click for long text, rating badge, and timestamp.
- [x] 4. Add Section F ("תשובות ושאלות") to `AnalyticsDashboard.tsx` — `useQuery(api.analytics.getAnswersList, { sinceTimestamp })` + render `<AnswersList data={...} />`.
- [x] 5. Add skeleton for Section F in `DashboardSkeleton` (matches existing skeleton pattern).
- [x] 6. Run `tsc` — verify zero new type errors.
- [x] 7. Manual smoke test: open admin dashboard, verify Section F renders answers with correct question/answer/rating, try search filter, verify mobile layout.
