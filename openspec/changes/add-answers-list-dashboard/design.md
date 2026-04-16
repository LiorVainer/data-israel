# Design: Answers List Dashboard Section

## Data Shape

`getAnswersList` query returns `AnswerEntry[]`:

```ts
export interface AnswerEntry {
    answerId: Id<'answers'>;
    userPrompt: string;
    assistantResponse: string;
    createdAt: number;           // Unix ms
    rating: 'good' | 'bad' | null;
}
```

Join strategy: fetch all `answers` (filtered by `sinceTimestamp`), then batch-fetch their ratings via a single `answer_ratings` table scan and build a `Map<answerId, rating>`. O(n) — no per-row index hit needed.

## Component Layout

```
AnswersList
├── header: "תשובות ושאלות (N)"
├── Search <Input> (right-to-left, same as FreeTextPromptsList)
└── scrollable div (max-h-[500px] overflow-y-auto)
    └── for each AnswerEntry:
        AnswerCard
        ├── row: timestamp (left) + rating badge (right, 👍/👎/—)
        ├── question block: label "שאלה", text truncated 2 lines, click to expand
        └── answer block: label "תשובה", text truncated 3 lines, click to expand
```

### Mobile vs Desktop

Cards are full-width on both layouts — no grid split needed. The scrollable container handles overflow on both. No `isMobile` branching required in this component.

### Expand/collapse

Per-card expand toggle via local `Set<string>` state keyed on `answerId`. Click anywhere on the truncated text block to toggle. No external state.

## Truncation

- `userPrompt`: `line-clamp-2` (collapsed) → unclamped (expanded)
- `assistantResponse`: `line-clamp-3` (collapsed) → unclamped (expanded)

CSS `line-clamp` via Tailwind's `line-clamp-N` utilities (available in Tailwind 4).

## Limit

Default: 100 most-recent answers. No pagination — consistent with `getFreeTextPrompts` pattern. If the corpus grows, pagination can be added in a follow-up change.
