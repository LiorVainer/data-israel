## ADDED Requirements

### Requirement: Chat Interface

The system SHALL provide a chat interface on the homepage that allows users to interact with the Israeli Open Data Agent.

#### Scenario: User sends a message

- **WHEN** the user types a message and submits the form
- **THEN** the message is sent to the `/api/chat` endpoint
- **AND** the user's message appears in the chat history
- **AND** the agent's response streams in real-time

#### Scenario: Agent uses tools

- **WHEN** the agent invokes a tool (e.g., searchDatasets)
- **THEN** the tool call is displayed in the chat UI
- **AND** the tool's input parameters are shown
- **AND** when the tool completes, the output is displayed

#### Scenario: Empty state

- **WHEN** the page loads with no messages
- **THEN** the chat input is visible and ready for user input

### Requirement: Message Display

The system SHALL display messages with proper formatting for text and tool calls.

#### Scenario: Text message rendering

- **WHEN** a message contains text content
- **THEN** the text is displayed with appropriate styling
- **AND** user messages are visually distinguished from assistant messages

#### Scenario: Tool call rendering

- **WHEN** a message contains tool calls
- **THEN** each tool call is displayed with its name, input, and output
- **AND** tool call states are reflected in the UI (streaming, available, error)

### Requirement: Real-time Streaming

The system SHALL support real-time streaming of agent responses.

#### Scenario: Streaming text

- **WHEN** the agent generates a text response
- **THEN** the text appears incrementally as it streams
- **AND** the UI updates without requiring page refresh

#### Scenario: Streaming tool calls

- **WHEN** the agent invokes a tool
- **THEN** the tool input streams as it's being generated
- **AND** the tool output appears when available

### Requirement: User Input

The system SHALL provide a text input for users to send messages to the agent.

#### Scenario: Submit message

- **WHEN** the user types text and presses Enter or clicks Send
- **THEN** the message is sent to the agent
- **AND** the input field is cleared

#### Scenario: Empty message prevention

- **WHEN** the user tries to submit an empty message
- **THEN** the message is not sent
- **AND** the form remains in its current state

### Requirement: Responsive Design

The system SHALL provide a responsive layout that works on different screen sizes.

#### Scenario: Desktop layout

- **WHEN** the page is viewed on a desktop screen
- **THEN** the chat interface is centered with a maximum width
- **AND** messages are easily readable

#### Scenario: Mobile layout

- **WHEN** the page is viewed on a mobile device
- **THEN** the chat interface adapts to the screen size
- **AND** the input remains accessible at the bottom
