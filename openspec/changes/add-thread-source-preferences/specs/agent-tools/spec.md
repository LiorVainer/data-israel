## ADDED Requirements

### Requirement: Per-Thread Data Source Preferences
The system SHALL persist the user's enabled data sources selection per conversation thread. When a user returns to a thread, the picker SHALL restore the previously selected sources.

#### Scenario: Save picker state on toggle
- **WHEN** a user toggles a data source in the picker
- **THEN** the system saves the current `enabledSources` array to the `thread_preferences` table keyed by `threadId`

#### Scenario: Restore picker state on thread load
- **WHEN** a user navigates to an existing thread
- **THEN** the picker SHALL display the previously saved source selection for that thread

#### Scenario: New thread defaults to all sources
- **WHEN** a user creates a new thread with no saved preferences
- **THEN** all data sources SHALL be selected by default

#### Scenario: All sources selected clears preference
- **WHEN** a user selects all sources (via "select all" or manually)
- **THEN** the saved preference record SHALL be deleted (default state needs no storage)
