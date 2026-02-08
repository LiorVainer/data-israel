# Tasks: Add Follow-Up Suggestions Tool and Data Source URL Tools

## 1. Backend - Suggestions Tool
- [x] 1.1 Create `lib/tools/client/suggest-follow-ups.ts` with Zod input schema (`suggestions: z.array(z.string()).min(2).max(4)`) and client tool definition
- [x] 1.2 Register `suggestFollowUps` in `lib/tools/client/index.ts` (add to `ClientTools` object)
- [x] 1.3 Export types in `lib/tools/types.ts` and `lib/tools/index.ts`

## 2. Backend - DataGov Source URL Tool
- [x] 2.1 Create `lib/tools/datagov/generate-source-url.ts` with input schema (datasetName, resourceId?, query?, title) and execute function that constructs portal URL
- [x] 2.2 Register `generateDataGovSourceUrl` in `lib/tools/datagov/index.ts` (add to `DataGovTools` object)
- [x] 2.3 Export types in `lib/tools/types.ts` and `lib/tools/index.ts`

## 3. Backend - CBS Source URL Tool
- [x] 3.1 Create `lib/tools/cbs/source/generate-source-url.ts` with input schema (sourceType: series|price-index|localities, relevant IDs, title) and execute function that constructs CBS URL
- [x] 3.2 Register `generateCbsSourceUrl` in `lib/tools/cbs/index.ts` (add to `CbsTools` object)
- [x] 3.3 Export types in `lib/tools/types.ts` and `lib/tools/index.ts`

## 4. Backend - Agent Integration
- [x] 4.1 Register all 3 new tools in routing agent (`agents/network/routing/routing.agent.ts`) — note: tools auto-register via `...ClientTools`, `...DataGovTools`, `...CbsTools` spread, so only verify they appear
- [x] 4.2 Update routing agent instructions (`agents/network/routing/config.ts`) to add a new `📎 מקורות ושאלות המשך` section mandating:
  - **Always** call `suggestFollowUps` at the end of every response with 2-4 Hebrew suggestions
  - Call `generateDataGovSourceUrl` after retrieving data from data.gov.il tools
  - Call `generateCbsSourceUrl` after retrieving data from CBS tools
  - **Define the response flow order** in the instructions:
    1. First: call data retrieval tools
    2. Then: call source URL tools (`generateDataGovSourceUrl` / `generateCbsSourceUrl`)
    3. Then: call `suggestFollowUps` with follow-up suggestions
    4. Finally: generate the text response (summary) — this is what triggers the stop condition

- [x] 4.3 **Update `stopWhen` in `app/api/chat/route.ts`** to enforce that `suggestFollowUps` is called before the agent stops.

## 5. Type-Safe UIMessage Refactor
- [x] 5.1 Add `AppUIMessage` type to `agents/types.ts` using `InferUITools` from AI SDK
- [ ] 5.2 (deferred) Update `components/chat/ChatThread.tsx` to use `useChat<AppUIMessage>()` instead of `useChat` with `messages: [] as UIMessage[]`
- [ ] 5.3 (deferred) Update `components/chat/MessageItem.tsx` to accept `message: AppUIMessage` instead of `message: UIMessage`
- [ ] 5.4 (deferred) Replace `part as ToolCallPart` casts in MessageItem with AI SDK's `isToolUIPart(part)` type guard (import from `'ai'`)
- [ ] 5.5 (deferred) Update chart tool rendering in MessageItem to use typed `part.input` directly (no more `part as ToolCallPart` then `toolPart.input as Record<string, unknown>`)

## 6. Frontend - Suggestions in ChatThread
- [x] 6.1 Update `components/chat/Suggestions.tsx` to accept optional `suggestions` prop (array of strings). When provided, render those instead of `PROMPTS_EXAMPLES`. Keep landing page usage unchanged.
- [x] 6.2 Update `components/chat/ChatThread.tsx` to:
  - Extract `suggestFollowUps` tool output from the last assistant message's parts
  - When tool state is `input-available` or `output-available` and `!isStreaming`, render `<Suggestions>`
  - Position between `<Conversation>` and `<InputSection>` (inside the z-20 container)
  - Wire `onClick` to `(text) => void sendMessage({ text })`

## 7. Frontend - Source URLs via SourcesPart in MessageItem
- [x] 7.1 Update `components/chat/MessageItem.tsx` to:
  - Define source tool type set: `new Set(['tool-generateDataGovSourceUrl', 'tool-generateCbsSourceUrl'])`
  - Extract `{ url, title }` from tool output when state is `output-available` and output has `success: true`
  - Convert extracted results into `SourceUrlUIPart`-compatible objects: `{ type: 'source-url', sourceId, url, title }`
  - Merge with existing `source-url` message parts array
  - Pass combined sources to `<SourcesPart sources={allSources} />`

- [x] 7.2 Add `suggestFollowUps`, `generateDataGovSourceUrl`, and `generateCbsSourceUrl` to `CLIENT_TOOL_TYPES` set in `MessageItem.tsx` so they don't appear in the ToolCallParts timeline (they have their own custom rendering)

## 8. Verification
- [x] 8.1 Run `tsc` to verify no TypeScript errors
- [x] 8.2 Run `npm run build` to verify production build succeeds
- [x] 8.3 Run `npm run lint` to verify linting passes
- [x] 8.4 Run `npm run vibecheck` to verify code quality
- [ ] 8.5 Manual test: Send a query and verify suggestions appear after response
- [ ] 8.6 Manual test: Click a suggestion and verify it submits as user input
- [ ] 8.7 Manual test: Query data.gov.il data and verify portal source links appear in SourcesPart
- [ ] 8.8 Manual test: Query CBS data and verify source links appear in SourcesPart
