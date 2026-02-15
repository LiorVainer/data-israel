# Change: Add token usage tracking and context window indicator

## Why
Users have no visibility into how much of the model's context window is consumed by the current conversation. As threads grow long, the model may silently lose early context. A visual percentage indicator gives users real-time awareness of context usage so they can start a new thread before hitting limits. Additionally, a usage log enables future billing, analytics, and per-user cost tracking.

## What Changes
- Install `@convex-dev/agent` as a dependency for its `vUsage` and `vProviderMetadata` validators
- Add `MAX_CONTEXT_TOKENS` to `AgentConfig.CHAT` (200,000 tokens for the default model)
- Create a `thread_usage` Convex table modeled after `@convex-dev/agent`'s `rawUsage` pattern — stores full usage data per generation (threadId, userId, agentName, model, provider, usage stats, providerMetadata)
- Add Convex mutation (`insertThreadUsage`) to log each generation's usage and query (`getLatestThreadUsage`) to fetch the most recent entry for a thread
- Capture actual token usage from the model provider via `onFinish` callback in `handleChatStream` and persist via `convexMutation`
- Add a `ContextWindowIndicator` component using shadcn `Progress` that displays the percentage of context window consumed
- Embed the indicator in `ChatThread.tsx` near the input section, with real-time Convex subscription

## Design Decision: Usage Log Pattern (not single-row upsert)

Following `@convex-dev/agent`'s `rawUsage` pattern, each generation inserts a **new row** rather than upserting a single row per thread. This provides:
- **Full usage history** — every generation is logged with model, provider, agent name, and token breakdown
- **Future billing/analytics** — can aggregate by user, time period, or model
- **Auditable** — no data is ever overwritten

For the context window indicator, we query the **latest** entry for the thread (most recent `promptTokens` = current context window usage).

## Design Decision: Reuse `@convex-dev/agent` validators

The `@convex-dev/agent` package exports `vUsage` and `vProviderMetadata` Convex validators. Rather than duplicating these, we install the package and import them directly. We only use the validators — not the agent framework itself.

## Design Decision: `onFinish` callback with `totalUsage`

Mastra's `MastraOnFinishCallbackArgs` provides `totalUsage: LanguageModelUsage` — already summed across all steps — and `model?: { modelId, provider }`. No manual step reduction needed, no hardcoding of model/provider.

The indicator uses **`totalTokens`** (not just `promptTokens`) because the model retains all tokens in its context window — both the input prompt and the generated completion become part of the context for the next turn.

`LanguageModelUsage` type: `{ promptTokens, completionTokens, totalTokens, reasoningTokens?, cachedInputTokens?, raw? }`. We extract only the three core fields to match `vUsage` from `@convex-dev/agent`.

## Impact
- Affected specs: `chat-ui` (new capability)
- Affected code:
  - `package.json` — add `@convex-dev/agent` dependency
  - `agents/agent.config.ts` — add `MAX_CONTEXT_TOKENS`
  - `convex/schema.ts` — add `thread_usage` table (appended at end, before mastra tables)
  - `convex/threads.ts` — add `insertThreadUsage` mutation + `getLatestThreadUsage` query
  - `app/api/chat/route.ts` — add `onFinish` callback to capture and store token usage
  - `components/chat/ChatThread.tsx` — embed indicator with Convex `useQuery`
  - New: `components/chat/ContextWindowIndicator.tsx` — progress component
