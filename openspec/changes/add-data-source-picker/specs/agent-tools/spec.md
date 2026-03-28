## ADDED Requirements

### Requirement: Data Source Filtering
The system SHALL allow users to select which data sources are available to the routing agent for a given conversation turn. When a subset of sources is selected, the routing agent SHALL only have access to sub-agents corresponding to those sources. When all sources are selected (or no filter is provided), all sub-agents SHALL be available (default behavior).

#### Scenario: User selects specific sources
- **WHEN** user selects only "cbs" and "nadlan" in the data source picker
- **THEN** the routing agent only has access to cbsAgent and nadlanAgent as sub-agents
- **AND** the routing agent cannot delegate to other sub-agents (budget, drugs, etc.)

#### Scenario: All sources selected (default)
- **WHEN** no source filter is applied (default state)
- **THEN** all 9 sub-agents are available to the routing agent
- **AND** behavior is identical to the current system

#### Scenario: Prevent empty agent set
- **WHEN** user deselects the last remaining source
- **THEN** the system SHALL re-enable all sources instead of leaving an empty set

### Requirement: Data Source Picker UI
The system SHALL provide a multi-select picker in the chat input toolbar that displays all data sources grouped by landing page categories.

#### Scenario: Trigger button label when all selected
- **WHEN** all data sources are selected (default state)
- **THEN** the trigger button SHALL display "בחר מקורות מידע" with a database icon

#### Scenario: Trigger button label when subset selected
- **WHEN** 3 out of 9 sources are selected
- **THEN** the trigger button SHALL display "3 מקורות מידע נבחרו"

#### Scenario: Category grouping in popover
- **WHEN** the picker popover is opened
- **THEN** sources SHALL be grouped under category headers: "ממשל ותקציב", "כלכלה ונדל״ן", "בריאות"
- **AND** each source shows its logo (or icon fallback) and Hebrew label

#### Scenario: Disabled during streaming
- **WHEN** the chat status is "streaming" or "submitted"
- **THEN** the picker trigger SHALL be disabled
