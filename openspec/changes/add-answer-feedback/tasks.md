## 1. Convex Schema & Backend

- [x] 1.1 Add `answers` table to `convex/schema.ts` with fields: `threadId`, `messageId`, `userId`, `userPrompt`, `assistantResponse`, `createdAt`; indexes: `by_message_id` (messageId), `by_thread` (threadId), `by_created` (createdAt)
- [x] 1.2 Add `answer_ratings` table to `convex/schema.ts` with fields: `answerId` (id ref to `answers`), `userId`, `rating` (`"good" | "bad"`), `createdAt`, `updatedAt`; indexes: `by_answer_user` (answerId, userId), `by_user` (userId), `by_created` (createdAt)
- [x] 1.3 Create `convex/ratings.ts` with `createAnswer` mutation — idempotent insert by messageId (no-op if exists)
- [x] 1.4 Create `upsertRating` mutation in `convex/ratings.ts` — lookup answerId by messageId, upsert rating by answerId+userId; delete if toggling off
- [x] 1.5 Create `getRatingsForThread` query in `convex/ratings.ts` — returns all ratings for a given user+thread (join through answers table)
- [x] 1.6 Add `getAnswerRatingStats` query in `convex/analytics.ts` (total answers, total rated, good count, bad count; respects `sinceTimestamp`)

## 2. Automatic Answer Creation

- [x] 2.1 In `ChatThread`, add an effect that fires when `status` transitions from `streaming` → `ready`: extract text from last user + assistant messages, call `createAnswer` mutation
- [x] 2.2 Use `messageId` as idempotency key to prevent duplicates on re-renders

## 3. Feedback Widget Component

- [x] 3.1 Create `src/components/chat/FeedbackWidget.tsx` — thumbs-up ("עזר לי") and thumbs-down ("לא עזר") buttons with Hebrew labels. Receives only `currentRating` and `onRate` — no messages array.
- [x] 3.2 Wire Convex `upsertRating` mutation on click with optimistic UI
- [x] 3.3 Style: ghost/muted buttons, highlight selected state, RTL-compatible, dark/light theme

## 4. Chat UI Integration

- [x] 4.1 Render `FeedbackWidget` in `MessageItem` after `SourcesPart` for completed assistant messages only (not streaming, not user messages)
- [x] 4.2 Pass `threadId`, `messageId`, `userId` from `ChatThread` context; hydrate existing ratings via `getRatingsForThread`

## 5. Admin Dashboard Integration

- [x] 5.1 Create `src/components/admin/AnswerRatingStats.tsx` — displays 4 StatCards (total answers, total rated, good count + %, bad count + %)
- [x] 5.2 Add Section E in `AnalyticsDashboard.tsx` after the free text prompts section, wired to `getAnswerRatingStats` with existing `sinceTimestamp`

## 6. Verification

- [x] 6.1 Manual test: send a message → answer record created in Convex automatically on stream finish
- [ ] 6.2 Manual test: rate an answer good → icon highlights, "עזר לי" selected, persists on reload
- [ ] 6.3 Manual test: change rating from good to bad → updates correctly
- [ ] 6.4 Manual test: toggle same rating off → rating removed
- [ ] 6.5 Manual test: guest user can rate answers
- [ ] 6.6 Manual test: admin dashboard Section E shows correct counts and percentages
- [x] 6.7 Run `tsc`, `npm run lint`, `npm run build` — all pass
