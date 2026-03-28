## ADDED Requirements

### Requirement: Per-Thread Data Source Settings
The system SHALL persist the user's enabled data sources selection per conversation thread. When a user returns to a thread, the picker SHALL restore the previously selected sources.

#### Scenario: Save picker state on toggle
- **WHEN** a user toggles a data source in the picker
- **THEN** the system saves the current `enabledSources` array to the `thread_settings` table keyed by `threadId`

#### Scenario: Restore picker state on thread load
- **WHEN** a user navigates to an existing thread
- **THEN** the picker SHALL display the previously saved source selection for that thread

#### Scenario: All sources selected clears setting
- **WHEN** a user selects all sources (via "select all" or manually)
- **THEN** the saved setting record SHALL be deleted (default state needs no storage)

### Requirement: User Default Source Settings
The system SHALL allow users to configure default enabled data sources that apply to all new conversations via a `/settings` page. Per-thread settings override user defaults.

#### Scenario: Set user defaults via settings page
- **WHEN** a user navigates to `/settings` and configures source defaults
- **THEN** the system saves the selection to the `user_settings` table keyed by `userId`

#### Scenario: New thread initializes from user defaults
- **WHEN** a user creates a new thread and has saved default settings
- **THEN** the picker SHALL initialize with the user's default source selection (not all sources)

#### Scenario: Thread settings override user defaults
- **WHEN** a user has both user defaults and per-thread settings for a given thread
- **THEN** the per-thread settings SHALL take priority

#### Scenario: Fallback when no settings exist
- **WHEN** a new thread is created and no user defaults are saved
- **THEN** all data sources SHALL be selected by default

### Requirement: Settings Navigation
The system SHALL provide a "הגדרות" link in the sidebar user menu that navigates to the settings page.

#### Scenario: User sees settings link
- **WHEN** a user opens the sidebar user dropdown
- **THEN** a "הגדרות" menu item SHALL appear and navigate to `/settings`
- **AND** the sidebar SHALL close on click
