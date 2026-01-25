# Design: Refactor Chat Page Components

## Context

The current `app/page.tsx` is a large single file (~520 lines) that handles:
- Empty conversation state (welcome screen)
- Message rendering with multiple part types (text, reasoning, tool calls, sources)
- Model selection UI
- Chat input handling

The `MessageToolCalls` component is defined (lines 196-264) but the actual rendering uses inline ChainOfThought code (lines 335-378), causing duplication.

The current inline ChainOfThought only supports auto-open (based on `shouldBeOpen` flag) but doesn't allow user to toggle via header click.

## Goals / Non-Goals

**Goals:**
- Split page.tsx into focused components (~100-150 lines each)
- Make ChainOfThought user-controllable while preserving auto-open behavior
- Use AI SDK types where available to reduce custom type definitions
- Improve maintainability and testability

**Non-Goals:**
- Changing the visual design or layout
- Adding new features beyond the refactoring scope
- Modifying the `ai-elements/` components (per CLAUDE.md instructions)

## Decisions

### Decision 1: Component File Structure
Place new components in `components/chat/` directory:
```
components/chat/
├── types.ts                    # Shared types (tool helpers, etc.)
├── MessageToolCalls.tsx        # Tool calls timeline with ChainOfThought
├── TextMessagePart.tsx         # Text message rendering with actions
├── ReasoningPart.tsx           # Reasoning indicator
├── SourcesPart.tsx             # Sources display
├── EmptyConversation.tsx       # Welcome screen
├── MessageItem.tsx             # Single message container
└── ModelSelectorSection.tsx    # Model selector wrapper
```

**Alternatives considered:**
- Keeping everything in `page.tsx` - rejected due to maintainability
- Creating a `features/chat/` directory - rejected as `components/chat/` already exists

### Decision 2: ChainOfThought State Management
The `MessageToolCalls` component already uses internal state for `isOpen` with `useEffect` for auto-open. This pattern should be preserved:
- User can click header to toggle
- Auto-opens when `isProcessing` becomes true
- Remains controllable after auto-open

**Implementation:**
```tsx
const [isOpen, setIsOpen] = useState(true);
const prevIsProcessing = useRef(isProcessing);

// Auto-open when processing starts
useEffect(() => {
  if (isProcessing && !prevIsProcessing.current) {
    setIsOpen(true);
  }
  prevIsProcessing.current = isProcessing;
}, [isProcessing]);

// ChainOfThought with controlled state - header click toggles via onOpenChange
<ChainOfThought open={isOpen} onOpenChange={setIsOpen}>
```

### Decision 3: AI SDK Type Usage
Use AI SDK types where they match our needs:
- `UIMessage` - already using via `DataAgentUIMessage`
- `ToolUIPart` - complex generic type, create a simplified local type that's compatible
- `TextUIPart` - use for text parts

The AI SDK's `ToolUIPart` is a complex generic:
```typescript
type ToolUIPart<TOOLS extends UITools = UITools> = ValueOf<{
  [NAME in keyof TOOLS & string]: {
    type: `tool-${NAME}`;
    toolCallId: string;
    state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
    // ...
  }
}>;
```

We'll use a simplified interface that covers our use case without requiring the full generic.

## Risks / Trade-offs

- **Risk**: Breaking existing functionality during refactor
  - **Mitigation**: Run build, lint, and tsc after each change; test in browser

- **Risk**: Over-componentization making code harder to follow
  - **Mitigation**: Keep components focused and co-located; only extract where it adds value

## Open Questions

None - the refactoring approach is straightforward.
