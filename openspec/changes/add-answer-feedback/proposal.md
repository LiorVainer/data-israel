# Change: Add answer feedback rating widget

## Why

Users currently have no way to signal whether an AI answer was helpful. Adding a lightweight good/bad rating on each assistant response enables quality tracking and creates a foundation for future prompt tuning and analytics.

## What Changes

- New **feedback widget** rendered below each completed assistant message (after `SourcesPart`), inline with the answer. Two buttons: thumbs-up with "עזר לי" (It helped me) and thumbs-down with "לא עזר" (It didn't), in Hebrew.
- New **Convex `answers` table** to store **every** question/answer pair — created client-side from the last two messages when streaming finishes. One record per assistant response, regardless of whether the user rates it.
- New **Convex `answer_ratings` table** to persist ratings, referencing an `answerId` (foreign key to `answers`). Lightweight — only stores `answerId`, `userId`, `rating`, timestamps.
- New **Convex mutations/queries** for upserting answers and ratings.
- New **"דירוג תשובות" section** in the existing admin `AnalyticsDashboard` (Section E) showing total rated, good count, bad count, and good/bad split percentages. Follows the existing time-range filtering pattern.
- Both **authenticated users and guests** can rate answers (userId = Clerk ID or guest session ID).

## Impact

- Affected specs: new `answer-feedback` capability
- Affected code:
  - `convex/schema.ts` — new `answers` and `answer_ratings` tables
  - `convex/ratings.ts` — new mutations/queries
  - `convex/analytics.ts` — new `getAnswerRatingStats` query
  - `src/components/chat/ChatThread.tsx` — compute and pass `userPrompt`/`assistantResponse` for last two messages
  - `src/components/chat/MessageItem.tsx` — render FeedbackWidget after SourcesPart, accept prompt/response props
  - `src/components/chat/FeedbackWidget.tsx` — new component
  - `src/components/admin/AnalyticsDashboard.tsx` — new Section E with rating stats
  - `src/components/admin/AnswerRatingStats.tsx` — new stats sub-component
