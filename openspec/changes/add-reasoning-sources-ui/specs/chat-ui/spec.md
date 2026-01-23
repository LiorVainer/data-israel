# Chat UI Capability - Delta

## ADDED Requirements

### Requirement: Reasoning Display

The chat UI SHALL display AI reasoning/thinking content when available using the ai-elements Reasoning component.

- The reasoning display SHALL be collapsible with a trigger showing thinking duration
- The reasoning content SHALL stream in real-time during generation
- The reasoning panel SHALL auto-collapse after streaming completes
- The reasoning trigger SHALL show Hebrew text "חושב..." during streaming
- The reasoning trigger SHALL show "חשב X שניות" after completion

#### Scenario: Reasoning streams during response

- **WHEN** the AI model returns reasoning tokens
- **THEN** the reasoning content is displayed in a collapsible panel above the response text
- **AND** the panel shows "חושב..." with shimmer animation while streaming
- **AND** the panel auto-collapses after streaming ends

#### Scenario: No reasoning available

- **WHEN** the AI model does not return reasoning tokens
- **THEN** no reasoning panel is displayed

---

### Requirement: Sources Display

The chat UI SHALL display source citations when available using the ai-elements Sources component.

- Sources SHALL be grouped per message and displayed after the response text
- Each source SHALL show its title (or hostname) and be clickable to open the URL
- Sources SHALL be displayed in a collapsible panel showing count

#### Scenario: Sources available in response

- **WHEN** the AI response includes `source-url` parts
- **THEN** a "Used X sources" trigger is displayed
- **AND** clicking the trigger reveals the list of sources
- **AND** each source links to its URL in a new tab

#### Scenario: No sources available

- **WHEN** the AI response has no `source-url` parts
- **THEN** no sources panel is displayed

---

### Requirement: ToolCallCard Component Extraction

The ToolCallCard component SHALL be extracted to a dedicated file for better code organization.

- The component SHALL be located at `components/chat/ToolCallCard.tsx`
- The component SHALL export the same interface as the inline version
- The `app/page.tsx` SHALL import ToolCallCard from the new location

#### Scenario: ToolCallCard renders correctly after extraction

- **WHEN** a tool call part is rendered in a message
- **THEN** the ToolCallCard component from `components/chat/ToolCallCard.tsx` is used
- **AND** the display is identical to the previous inline version

---

### Requirement: Backend Reasoning and Sources Streaming

The chat API route SHALL enable streaming of reasoning tokens and sources to the client.

- The API SHALL use `sendReasoning: true` in `toUIMessageStreamResponse` options
- The API SHALL use `sendSources: true` in `toUIMessageStreamResponse` options

#### Scenario: Reasoning tokens forwarded to client

- **WHEN** the AI model produces reasoning tokens
- **THEN** the reasoning parts are included in the streamed response to the client

#### Scenario: Sources forwarded to client

- **WHEN** the AI model response includes source citations
- **THEN** the source-url parts are included in the streamed response to the client
