# Tasks: Add Model Selection and Stop Streaming Controls

## 1. Configuration Setup
- [x] 1.1 Add `availableModels` array to `AgentConfig` with model definitions (id, name, provider, providerSlug)
- [x] 1.2 Export `AvailableModel` type from `agent.config.ts`

## 2. API Route Updates
- [x] 2.1 Update `app/api/chat/route.ts` to accept `model` parameter from request body
- [x] 2.2 Validate model parameter against `AgentConfig.availableModels`
- [x] 2.3 Use selected model when creating agent/streaming response

## 3. Model Selector Integration
- [x] 3.1 Add model state with `useState` in `app/page.tsx`
- [x] 3.2 Add model selector open state
- [x] 3.3 Import `ModelSelector` components from `@/components/ai-elements/model-selector`
- [x] 3.4 Render `ModelSelector` in chat input footer using ai-elements PromptInput
- [x] 3.5 Pass selected model to chat API via sendMessage body option
- [x] 3.6 Style model selector for RTL support

## 4. Stop Streaming Integration
- [x] 4.1 Destructure `stop` function from `useChat` hook
- [x] 4.2 Pass `status` and `stop` to `PromptInputSubmit` component
- [x] 4.3 Test abort functionality cancels the streaming response
- [x] 4.4 Ensure UI state resets correctly after stopping

## 5. Verification
- [x] 5.1 Run `npm run build` - verify build succeeds
- [x] 5.2 Run `npm run lint` - verify no lint errors in modified files
- [ ] 5.3 Run `npm run vibecheck` - verify code quality
- [ ] 5.4 Manual test: switch models and verify response comes from selected model
- [ ] 5.5 Manual test: stop mid-stream and verify response stops
