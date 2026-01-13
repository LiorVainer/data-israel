## MODIFIED Requirements

### Requirement: RTL and Hebrew Language Support
The chat UI SHALL fully support Hebrew language with proper right-to-left (RTL) layout and typography.

#### Scenario: Hebrew text display
- **WHEN** the application loads
- **THEN** the root HTML element has `dir="rtl"` attribute
- **AND** all UI labels, placeholders, and instructions are in Hebrew
- **AND** text alignment follows RTL conventions (right-aligned for start, left-aligned for end)

#### Scenario: Mixed content handling
- **WHEN** displaying messages with both Hebrew and English
- **THEN** the layout maintains proper RTL flow
- **AND** English content (like code, URLs) displays correctly within Hebrew context

### Requirement: Collapsible Tool Displays
Tool call cards SHALL be collapsible to reduce visual clutter and improve readability.

#### Scenario: Tool card collapse/expand
- **WHEN** a tool call is rendered
- **THEN** the tool card displays with a collapse/expand button
- **AND** clicking the button toggles the visibility of tool input/output
- **AND** the toggle state animates smoothly

#### Scenario: Default tool state
- **WHEN** multiple tool calls exist in a conversation
- **THEN** only the most recent tool call is expanded by default
- **AND** older tool calls are collapsed
- **AND** users can expand any collapsed tool call

### Requirement: JSON Syntax Highlighting
JSON data in tool calls SHALL be displayed with syntax highlighting for improved readability.

#### Scenario: Highlighted JSON display
- **WHEN** a tool call contains JSON input or output
- **THEN** the JSON is rendered with syntax highlighting
- **AND** different data types (strings, numbers, booleans, null) have distinct colors
- **AND** the display includes copy-to-clipboard functionality
- **AND** large JSON objects can be collapsed/expanded by key

#### Scenario: Theme consistency
- **WHEN** JSON is highlighted
- **THEN** the color scheme matches the Shadcn/ui theme
- **AND** the highlighting works in both light and dark modes

## ADDED Requirements

### Requirement: Hebrew Agent Instructions
The AI agent SHALL use Hebrew instructions to provide a consistent Hebrew-first experience throughout the application.

#### Scenario: Agent initialization
- **WHEN** the agent is initialized
- **THEN** the agent's system instructions are in Hebrew
- **AND** the agent's reasoning rules are in Hebrew
- **AND** all tool names and function signatures remain in English for API compatibility

#### Scenario: Agent behavior consistency
- **WHEN** users interact with the agent in Hebrew
- **THEN** the agent maintains Hebrew language context in its reasoning
- **AND** the agent's internal instructions follow Hebrew guidelines
- **AND** the agent can still process English queries and dataset names

#### Scenario: Mixed language handling
- **WHEN** the agent receives queries with both Hebrew and English terms
- **THEN** the agent processes both languages correctly
- **AND** dataset names and technical terms in English are preserved
- **AND** responses maintain appropriate language context

### Requirement: Skeleton Loader
The system SHALL display a skeleton loader while waiting for AI responses.

#### Scenario: Loading state display
- **WHEN** a message is submitted and the agent is processing
- **THEN** a skeleton loader appears with shimmer animation
- **AND** the skeleton matches the expected message layout
- **AND** the skeleton replaces the basic spinner

#### Scenario: Skeleton animation
- **WHEN** the skeleton loader is visible
- **THEN** a subtle shimmer effect animates from right to left (RTL-aware)
- **AND** the animation loops continuously until content loads

### Requirement: Enhanced Empty State
The empty conversation state SHALL be visually engaging with Hebrew text and animations.

#### Scenario: Empty state display
- **WHEN** no messages exist in the conversation
- **THEN** a large icon appears in the center
- **AND** Hebrew title and description text are displayed
- **AND** example queries in Hebrew are shown below
- **AND** all text is center-aligned for RTL layout

#### Scenario: Empty state interaction
- **WHEN** user hovers over example queries
- **THEN** the query text highlights or animates
- **AND** clicking a query fills the input field (optional enhancement)

### Requirement: Message Animations
Messages SHALL appear with smooth animations for better visual feedback.

#### Scenario: New message animation
- **WHEN** a new message is added to the conversation
- **THEN** the message fades in from transparent to opaque
- **AND** the animation duration is between 200-300ms
- **AND** the animation respects reduced motion preferences

#### Scenario: Scroll behavior
- **WHEN** new messages cause the conversation to scroll
- **THEN** the scroll behavior is smooth
- **AND** the scroll-to-bottom button appears when not at bottom
- **AND** clicking scroll-to-bottom animates smoothly
