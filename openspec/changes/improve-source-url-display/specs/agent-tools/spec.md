## ADDED Requirements

### Requirement: Source URL Data Source Grouping
The system SHALL group source URL chips by their data provider and display them with provider-specific styling.

#### Scenario: CBS sources displayed with CBS styling
- **WHEN** a message contains source URLs from CBS tools
- **THEN** the source chips SHALL be grouped under an orange "למ"ס" header badge
- **AND** chips SHALL use CBS color scheme from `DATA_SOURCE_CONFIG`

#### Scenario: DataGov sources displayed with DataGov styling
- **WHEN** a message contains source URLs from DataGov tools
- **THEN** the source chips SHALL be grouped under a blue-green "מידע ממשלתי" header badge
- **AND** chips SHALL use DataGov color scheme from `DATA_SOURCE_CONFIG`

#### Scenario: Mixed sources grouped separately
- **WHEN** a message contains sources from both CBS and DataGov
- **THEN** sources SHALL be displayed in separate provider groups

### Requirement: Source URL Type Separation
The system SHALL distinguish between portal URLs (human-readable web pages) and API URLs (JSON endpoints).

#### Scenario: Portal links shown prominently
- **WHEN** a source URL points to a portal page (data.gov.il dataset page, CBS web view)
- **THEN** it SHALL be displayed with a portal icon (🌐) and shown before API links within its group

#### Scenario: API links shown as secondary
- **WHEN** a source URL points to a raw API endpoint (CKAN datastore, CBS series API)
- **THEN** it SHALL be displayed with an API icon (📡) after portal links within its group

#### Scenario: URL type derived from tool resolver
- **WHEN** `resolveToolSourceUrl` resolves a source from a tool output
- **THEN** the resolver SHALL return `urlType: 'portal'` for tools that use `portalUrl` and `urlType: 'api'` for tools that use `apiUrl`

### Requirement: Collapsible Source Groups
The system SHALL display source groups in a collapsible/expandable UI.

#### Scenario: Sources collapsed by default
- **WHEN** a message finishes rendering with source URLs
- **THEN** the sources section SHALL show a summary trigger ("המידע הגיע מ-N מקורות")
- **AND** grouped sources SHALL be hidden until the user clicks to expand
