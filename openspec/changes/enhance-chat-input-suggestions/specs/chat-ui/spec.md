# Chat UI Specification

## ADDED Requirements

### Requirement: Enhanced Chat Input Component
The chat input SHALL provide an auto-resizing, animated textarea with visual feedback for user interactions.

#### Scenario: Input expands as user types
- **WHEN** user types multiple lines of text
- **THEN** the input height smoothly animates to fit the content up to a maximum height

#### Scenario: Clear button appears with text
- **WHEN** user types any text in the input
- **THEN** a clear button fades in and clears both the input and suggestions when clicked

#### Scenario: Submit button shows loading state
- **WHEN** user submits a message
- **THEN** the submit button icon changes from Send to Loader with rotation animation

#### Scenario: Enter key submits message
- **WHEN** user presses Enter without Shift key
- **THEN** the message is submitted (Shift+Enter adds new line)

### Requirement: Interactive Prompt Suggestions
The empty state SHALL display clickable suggestion buttons that populate the input with example prompts.

#### Scenario: Suggestions displayed when no messages
- **WHEN** no messages exist in the conversation
- **THEN** a grid of suggestion buttons is displayed with example prompts in Hebrew

#### Scenario: Clicking suggestion populates input
- **WHEN** user clicks a suggestion button
- **THEN** the input is populated with the example prompt text

#### Scenario: Suggestions are visually distinct
- **WHEN** suggestion buttons are displayed
- **THEN** they have a semi-transparent background with hover effects

### Requirement: Button Gradient Variant
The Button component SHALL support a "gradient" variant for visual emphasis.

#### Scenario: Gradient variant renders correctly
- **WHEN** Button component is rendered with variant="gradient"
- **THEN** it displays with a gradient background and appropriate hover states
