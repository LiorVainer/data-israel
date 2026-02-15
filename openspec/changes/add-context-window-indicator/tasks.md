## 1. Dependencies & Configuration
- [x]1.1 Install `@convex-dev/agent` for its `vUsage` and `vProviderMetadata` validators:
```bash
pnpm add @convex-dev/agent
```
- [x]1.2 Add `MAX_CONTEXT_TOKENS: 200_000` to `AgentConfig.CHAT` in `agents/agent.config.ts`

## 2. Convex Table
- [x]2.1 Add `thread_usage` table to `convex/schema.ts` — **append before mastra tables, never in the middle** (shifting internal table numbering breaks existing stored IDs):

```typescript
// In convex/schema.ts — import validators from @convex-dev/agent
import { vUsage, vProviderMetadata } from '@convex-dev/agent';

// vUsage already includes all 5 fields:
//   promptTokens, completionTokens, totalTokens (required)
//   reasoningTokens, cachedInputTokens (optional)
// No extension needed.

// Add BEFORE the mastra_threads line
thread_usage: defineTable({
    threadId: v.string(),
    userId: v.string(),
    agentName: v.optional(v.string()),
    model: v.string(),
    provider: v.string(),
    usage: vUsage,
    providerMetadata: v.optional(vProviderMetadata),
    createdAt: v.number(),
})
    .index('by_thread', ['threadId'])
    .index('by_thread_created', ['threadId', 'createdAt'])
    .index('by_user', ['userId']),
```

- [x]2.2 Run `npx convex dev` to push schema and generate types

## 3. Convex Functions
- [x]3.1 Add `insertThreadUsage` mutation in `convex/threads.ts`:

```typescript
import { vUsage, vProviderMetadata } from '@convex-dev/agent';

export const insertThreadUsage = mutation({
    args: {
        threadId: v.string(),
        userId: v.string(),
        agentName: v.optional(v.string()),
        model: v.string(),
        provider: v.string(),
        usage: vUsage,
        providerMetadata: v.optional(vProviderMetadata),
    },
    handler: async (ctx, args) => {
        return ctx.db.insert('thread_usage', {
            ...args,
            createdAt: Date.now(),
        });
    },
});
```

- [x]3.2 Add `getLatestThreadUsage` query in `convex/threads.ts` — returns the most recent usage entry for a thread:

```typescript
export const getLatestThreadUsage = query({
    args: { threadId: v.string() },
    handler: async (ctx, { threadId }) => {
        return ctx.db
            .query('thread_usage')
            .withIndex('by_thread_created', (q) => q.eq('threadId', threadId))
            .order('desc')
            .first();
    },
});
```

## 4. API Route Integration
- [x]4.1 In `app/api/chat/route.ts`, add `onFinish` callback to `handleChatStream`'s `defaultOptions`.

The `MastraOnFinishCallbackArgs` type (from `@mastra/core/dist/stream/types`) provides:
- `totalUsage: LanguageModelUsage` — **already summed across all steps** (no manual reduction needed)
- `model?: { modelId?, provider? }` — actual model used (no hardcoding needed)

```typescript
import { convexMutation, api } from '@/lib/convex/client';

// Inside POST handler, extract threadId from memoryConfig
const threadId = memoryConfig.thread;

const stream = await handleChatStream<AppUIMessage>({
    mastra,
    agentId: 'routingAgent',
    params: enhancedParams,
    defaultOptions: {
        toolCallConcurrency: CHAT.TOOL_CALL_CONCURRENCY,
        stopWhen: hasCompletedWithSuggestions,
        onFinish: ({ totalUsage, model }) => {
            if (!threadId) return;
            // totalUsage is LanguageModelUsage — includes all 5 token fields.
            // Extract only the fields that match vUsage to avoid passing `raw`.
            const { promptTokens, completionTokens, totalTokens,
                    reasoningTokens, cachedInputTokens } = totalUsage;
            void convexMutation(api.threads.insertThreadUsage, {
                threadId,
                userId,
                agentName: 'routingAgent',
                model: model?.modelId ?? AgentConfig.MODEL.DEFAULT_ID,
                provider: model?.provider ?? 'openrouter',
                usage: {
                    promptTokens,
                    completionTokens,
                    totalTokens,
                    reasoningTokens,
                    cachedInputTokens,
                },
            });
        },
    },
    sendReasoning: true,
    sendSources: true,
});
```

**Note**: `totalUsage` is typed as `LanguageModelUsage` which extends `LanguageModelV2Usage` (`{ promptTokens, completionTokens, totalTokens }`) with optional `reasoningTokens`, `cachedInputTokens`, and `raw`. We extract only the three core fields to match `vUsage`.

- [x]4.2 Run `tsc` to verify no type errors

## 5. Context Window Indicator Component
- [x]5.1 Create `components/chat/ContextWindowIndicator.tsx` using shadcn `Progress`
- [x]5.2 Accept props: `usedTokens: number`, `maxTokens: number`
- [x]5.3 Display percentage label in Hebrew (e.g. "50% מחלון ההקשר בשימוש") and progress bar
- [x]5.4 Color-code: default up to 70%, warning (amber) 70-90%, danger (red) 90%+
- [x]5.5 Show compact by default — progress bar visible, expands detail on hover or when >70%

## 6. Integration into ChatThread
- [x]6.1 In `ChatThread.tsx`, subscribe to `api.threads.getLatestThreadUsage` via Convex `useQuery` and pass **`totalTokens`** (not just promptTokens — the model retains all tokens in context):

```typescript
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { AgentConfig } from '@/agents/agent.config';

const latestUsage = useQuery(api.threads.getLatestThreadUsage, { threadId: id });
const totalTokens = latestUsage?.usage.totalTokens ?? 0;

<ContextWindowIndicator
    usedTokens={totalTokens}
    maxTokens={AgentConfig.CHAT.MAX_CONTEXT_TOKENS}
/>
```

- [x]6.2 Embed `ContextWindowIndicator` near the input section
- [x]6.3 Ensure indicator updates reactively via Convex subscription when the mutation fires after each response

## 7. Verification
- [x]7.1 Run `tsc` — no new type errors
- [x]7.2 Run `npm run build` — build succeeds
- [x]7.3 Run `npm run lint` — no new lint errors
- [x]7.4 Manual test: send a message, verify indicator updates after response completes with real token data from the model provider
