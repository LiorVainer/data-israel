# Chat UI Specification

## ADDED Requirements

### Requirement: Model Selection
Users SHALL be able to select from available AI models before or during a conversation.

#### Scenario: User selects a different model
- **WHEN** user clicks the model selector button
- **THEN** a dropdown/dialog shows available models grouped by provider
- **AND** user can search/filter models by name
- **AND** selecting a model closes the selector and updates the active model

#### Scenario: Selected model persists across messages
- **WHEN** user selects a model and sends a message
- **THEN** the response comes from the selected model
- **AND** the selection persists until user changes it

#### Scenario: Model selector shows current selection
- **WHEN** the chat UI renders
- **THEN** the model selector button displays the currently selected model name and provider logo

### Requirement: Stop Streaming Control
Users SHALL be able to stop an AI response while it is streaming.

#### Scenario: User stops streaming response
- **WHEN** a response is actively streaming (status = 'streaming')
- **AND** user clicks the stop button
- **THEN** the streaming request is aborted
- **AND** the partial response remains visible
- **AND** the UI returns to ready state

#### Scenario: Stop button visibility
- **WHEN** status is 'streaming' or 'submitted'
- **THEN** the submit button shows a stop icon (SquareIcon)
- **AND** clicking it aborts the request

#### Scenario: Stop button disabled when not streaming
- **WHEN** status is 'ready' or 'error'
- **THEN** the stop functionality is not available
- **AND** the button shows the submit icon (CornerDownLeftIcon)

### Requirement: Available Models Configuration
The system SHALL provide a centralized configuration for available AI models.

#### Scenario: Models defined in AgentConfig
- **WHEN** the application loads
- **THEN** `AgentConfig.availableModels` contains model definitions
- **AND** each model has: id, name, provider (display name), providerSlug (for logo)

#### Scenario: Default model selection
- **WHEN** no model has been explicitly selected
- **THEN** the first model in `AgentConfig.availableModels` is used as default
