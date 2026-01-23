# Change: Add Reasoning & Sources Display to Chat UI

## Why

Users currently cannot see the AI's thinking process or the sources used to generate answers. This limits transparency and trust. The AI SDK v6 supports streaming reasoning tokens and sources, and the ai-elements SDK provides ready-to-use components (Reasoning, Sources, InlineCitation) for displaying this information elegantly.

Additionally, the `ToolCallCard` component is currently defined inline in `app/page.tsx`, making the file harder to maintain. Extracting it to a separate file improves code organization.

## What Changes

1. **Enable reasoning streaming**: Update API route to send reasoning tokens with `sendReasoning: true`
2. **Enable sources streaming**: Update API route to send sources with `sendSources: true`
3. **Add Reasoning UI**: Render `reasoning` message parts using ai-elements `Reasoning` component (collapsible, shows thinking time)
4. **Add Sources UI**: Render `source-url` message parts using ai-elements `Sources` component
5. **Extract ToolCallCard**: Move `ToolCallCard` component from `app/page.tsx` to `components/chat/ToolCallCard.tsx`

## Impact

- **Affected specs**: chat-ui (new capability)
- **Affected code**:
  - `app/api/chat/route.ts` - Add sendReasoning and sendSources options
  - `app/page.tsx` - Add rendering for reasoning and source parts, remove ToolCallCard
  - `components/chat/ToolCallCard.tsx` - New file for extracted component
