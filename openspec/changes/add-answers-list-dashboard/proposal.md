# Change: Add Answers List to Admin Dashboard

## Why

Section E of the analytics dashboard currently shows only **aggregate rating stats** (total answers, rated count, good/bad counts). Admins have no way to see the actual Q&A pairs stored in the `answers` table — the question a user asked, the assistant's response, and whether it was rated good/bad. Browsing individual answers is essential for qualitative review, prompt improvement, and spotting failure patterns.

## What Changes

- New **Convex query `getAnswersList`** in `convex/analytics.ts` — returns paginated/limited answer rows joined with their rating (if any), filtered by `sinceTimestamp`. Returns: `answerId`, `userPrompt`, `assistantResponse` (truncated for display), `createdAt`, `rating` (`'good' | 'bad' | null`).
- New **`AnswersList` component** (`src/components/admin/AnswersList.tsx`) — renders answers as a scrollable card list. Each card shows:
  - User prompt (truncated to ~2 lines, expandable on click)
  - Assistant response (truncated to ~3 lines, expandable on click)
  - Rating badge (👍 / 👎 / no badge if unrated)
  - Timestamp (Hebrew locale)
  - Search/filter input (same pattern as `FreeTextPromptsList`)
- New **Section F** added to `AnalyticsDashboard.tsx` below Section E, titled "תשובות ושאלות", uses the existing `sinceTimestamp` time-range filter.

## Impact

- Affected specs: no existing spec — new capability under `admin-dashboard`
- Affected code:
  - `convex/analytics.ts` — add `getAnswersList` query + `AnswerEntry` export type
  - `src/components/admin/AnswersList.tsx` (new)
  - `src/components/admin/AnalyticsDashboard.tsx` — add Section F with `AnswersList`
