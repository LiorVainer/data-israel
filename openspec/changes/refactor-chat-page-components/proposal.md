# Change: Refactor Chat Page into Smaller Components

## Why

The `app/page.tsx` file is ~520 lines long and contains too many responsibilities: message rendering, tool call display, model selection, and empty state. This makes the code difficult to maintain, test, and extend. Additionally, the `MessageToolCalls` component is defined but not used, causing duplicated inline code.

## What Changes

- Extract message rendering into separate component files
- Use the existing `MessageToolCalls` component (currently unused) and make ChainOfThought header clickable for user control while preserving auto-open behavior
- Replace custom type definitions with AI SDK types where available (`UIMessage`, `ToolUIPart`, `TextUIPart`)
- Split `page.tsx` into focused, single-responsibility components

## Impact

- Affected specs: `chat-ui` (new capability spec)
- Affected code:
  - `app/page.tsx` - main refactoring target
  - `components/chat/` - new component files
  - `lib/tools/types.ts` - may need updates for AI SDK type integration
