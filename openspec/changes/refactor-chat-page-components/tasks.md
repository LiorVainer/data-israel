# Tasks: Refactor Chat Page Components

## 1. Type System Updates
- [ ] 1.1 Import AI SDK types (`UIMessage`, `TextUIPart`, `ToolUIPart`) from `ai` package
- [ ] 1.2 Update `SourceUrlPart` interface to use AI SDK source types if available
- [ ] 1.3 Remove or adapt custom `ToolCallPart` interface to align with `ToolUIPart`
- [ ] 1.4 Create a shared types file `components/chat/types.ts` for chat-specific types

## 2. Extract MessageToolCalls Component
- [ ] 2.1 Move `MessageToolCalls` to `components/chat/MessageToolCalls.tsx`
- [ ] 2.2 Ensure ChainOfThought is user-controllable via header click (toggle open/close)
- [ ] 2.3 Preserve auto-open behavior when processing starts
- [ ] 2.4 Export helper functions (`getToolStatus`, `getToolInfo`, `getToolDescription`)

## 3. Extract Message Part Components
- [ ] 3.1 Create `components/chat/TextMessagePart.tsx` for text message rendering
- [ ] 3.2 Create `components/chat/ReasoningPart.tsx` for reasoning indicator
- [ ] 3.3 Create `components/chat/SourcesPart.tsx` for sources display

## 4. Extract Higher-Level Components
- [ ] 4.1 Create `components/chat/EmptyConversation.tsx` for welcome screen
- [ ] 4.2 Create `components/chat/MessageItem.tsx` for single message container
- [ ] 4.3 Create `components/chat/ModelSelectorSection.tsx` for model selector

## 5. Refactor page.tsx
- [ ] 5.1 Import new components into `app/page.tsx`
- [ ] 5.2 Replace inline rendering with component usage
- [ ] 5.3 Remove duplicate ChainOfThought code (use `MessageToolCalls` instead)
- [ ] 5.4 Remove the console.log debug statement

## 6. Verification
- [ ] 6.1 Run `npm run build` to verify build succeeds
- [ ] 6.2 Run `npm run lint` to check linting
- [ ] 6.3 Run `tsc` to verify no TypeScript errors
- [ ] 6.4 Test in browser to verify functionality
