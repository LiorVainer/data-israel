## ADDED Requirements

### Requirement: Message Part Component Separation
The chat UI SHALL render each message part type through a dedicated component:
- `TextMessagePart` for text content with copy/regenerate actions
- `ReasoningPart` for thinking/reasoning indicators
- `SourcesPart` for source URL references
- `MessageToolCalls` for tool call timelines

#### Scenario: Text message with actions
- **WHEN** an assistant message contains a text part
- **THEN** TextMessagePart renders the text with copy and regenerate actions on the last message

#### Scenario: Tool calls displayed in timeline
- **WHEN** a message contains tool-* parts
- **THEN** MessageToolCalls renders them in a ChainOfThought timeline

### Requirement: ChainOfThought User Control
The MessageToolCalls component SHALL allow users to toggle the ChainOfThought open/closed state by clicking the header, while preserving automatic open behavior when processing starts.

#### Scenario: User clicks header to toggle
- **WHEN** user clicks the ChainOfThoughtHeader
- **THEN** the ChainOfThought content toggles between open and closed

#### Scenario: Auto-opens when processing starts
- **WHEN** a new tool call begins processing (isProcessing becomes true)
- **THEN** the ChainOfThought automatically opens

#### Scenario: User closes during processing
- **WHEN** user clicks header to close while tools are processing
- **THEN** the ChainOfThought closes and stays closed until user reopens or new processing starts

### Requirement: Empty Conversation Welcome Screen
The chat UI SHALL display a welcome screen with example prompts when no messages exist.

#### Scenario: No messages in conversation
- **WHEN** the messages array is empty
- **THEN** EmptyConversation component displays welcome text and PromptSuggestions

### Requirement: Type Safety with AI SDK
The chat components SHALL use AI SDK types where applicable to ensure type safety and reduce custom type definitions.

#### Scenario: Tool state type checking
- **WHEN** checking a tool part's state
- **THEN** the state values match AI SDK's ToolUIPart states: 'input-streaming', 'input-available', 'output-available', 'output-error', 'approval-requested', 'approval-responded', 'output-denied'
