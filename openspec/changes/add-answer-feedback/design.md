## Context

The chat UI renders assistant messages via `MessageItem`. Each message ends with `SourcesPart` (line 314). The feedback widget will appear after sources, below the full answer, visible only for completed (non-streaming) assistant messages.

The admin analytics dashboard (`AnalyticsDashboard.tsx`) has four sections (KPIs, user breakdown, charts, free text prompts) with a shared time-range selector. The rating analytics will be added as a new Section E.

Convex is the existing persistence layer for all user/thread data.

## Goals / Non-Goals

- Goals:
  - Let any user (authenticated or guest) rate any completed assistant answer as good or bad
  - Show Hebrew text labels next to thumb icons: "עזר לי" / "לא עזר"
  - Store question/answer text in a separate `answers` table for review context
  - Keep the rating mutation lightweight (just `answerId` + `rating`)
  - Avoid passing the full `messages` array to `FeedbackWidget`
  - Display aggregate analytics in the existing admin dashboard with time-range filtering
- Non-Goals:
  - Free-text feedback or detailed categories (future iteration)
  - Per-agent or per-tool-call granularity (rating is per assistant message)
  - Separate analytics page (use existing dashboard)
  - Server-side answer creation (done client-side to keep route.ts unchanged)

## Decisions

- **Two-table architecture**:
  - `answers` table: stores `threadId`, `messageId`, `userId`, `userPrompt`, `assistantResponse`, `createdAt`. One record per completed assistant response — created automatically when streaming finishes, **not** on rating.
  - `answer_ratings` table: stores `answerId` (foreign key → `answers`), `userId`, `rating`, `createdAt`, `updatedAt`. Lightweight — no text duplication.
  - Rationale: the `answers` table is a complete Q&A log for reviewing all interactions. Ratings are a separate concern layered on top. Multiple users could rate the same answer without duplicating text.

- **Automatic answer creation**: When `useChat` status transitions from `'streaming'` → `'ready'` in `ChatThread`, an effect fires a Convex `createAnswer` mutation with the last user+assistant message text. This happens for every response, regardless of whether the user rates it. Uses `messageId` as an idempotency key (mutation is a no-op if the answer already exists).

- **Text extraction logic** (in `ChatThread` effect):
  ```
  messages array: [user₁, assistant₁, user₂, assistant₂, ...]
  On streaming finish:
    assistantResponse = last assistant message's text parts joined
    userPrompt = preceding user message's text parts joined
    → createAnswer({ threadId, messageId, userId, userPrompt, assistantResponse })
  ```

- **FeedbackWidget receives no messages**: The widget only needs `threadId`, `messageId`, `userId`, and the pre-fetched rating state. When the user clicks a rating, the mutation looks up the existing `answerId` by `messageId` and upserts the rating.

- **Widget placement**: Inline below `SourcesPart` in `MessageItem` (line ~314), not a pop-up/modal. Rendered only when `message.role === 'assistant'` and the message is not actively streaming.
- **Label text**: Hebrew — thumbs-up: "עזר לי", thumbs-down: "לא עזר". Kept minimal, inline with buttons.
- **Rating model**: Binary (`"good" | "bad"`) stored as a string union. One rating per user per message; upsert semantics so users can change their mind. Clicking the already-selected rating unsets it.
- **User identity**: Uses the same `userId` pattern as the rest of the app — Clerk ID for authenticated users, guest session ID for guests. Passed from `ChatThread` context.
- **Analytics placement**: New section in `AnalyticsDashboard` after Section D (free text prompts). Uses the same `sinceTimestamp` time-range filter. Shows 4 `StatCard`s: total answers (from `answers` table), total rated, good count (with %), bad count (with %).
- **Hydration**: On thread load, `getRatingsForThread` fetches all ratings for the current user+thread in a single query. Individual `FeedbackWidget` instances read from this pre-fetched map.

## Data flow

```
1. Streaming finishes (status: streaming → ready)
   ChatThread effect fires:
   → createAnswer({ threadId, messageId, userId, userPrompt, assistantResponse })
   → Convex inserts answer record (no-op if messageId already exists)

2. User clicks 👍/👎 on FeedbackWidget
   → upsertRating({ messageId, userId, rating })
   → Convex: lookup answerId by messageId, upsert rating by answerId+userId
     (toggle off = delete rating record)
```

## Risks / Trade-offs

- Widget adds visual weight to every assistant message → Mitigated by keeping it minimal (small ghost buttons, muted until interacted with).
- No free-text feedback → Acceptable for v1; can be extended later.
