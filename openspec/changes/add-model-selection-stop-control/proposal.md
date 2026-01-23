# Change: Add Model Selection and Stop Streaming Controls

## Why

Users need control over their chat experience: selecting different AI models and stopping responses mid-stream. Currently the model is hardcoded in `agent.config.ts` and there's no way to abort a streaming response from the UI.

## What Changes

- Add `ModelSelector` component integration for switching models at runtime
- Add stop button functionality using AI SDK's `stop()` function from `useChat`
- Extend `PromptInputSubmit` to toggle between submit and stop based on streaming state
- Send selected model to API route for dynamic model selection
- Update `AgentConfig` to provide available models list

## Impact

- Affected specs: `chat-ui` (new capability)
- Affected code:
  - `app/page.tsx` - Add model selector and stop control
  - `app/api/chat/route.ts` - Accept model parameter
  - `agents/agent.config.ts` - Add available models configuration
  - `components/ai-elements/model-selector.tsx` - Already exists (no changes needed)
  - `components/ai-elements/prompt-input.tsx` - Already has `PromptInputSubmit` with status support
