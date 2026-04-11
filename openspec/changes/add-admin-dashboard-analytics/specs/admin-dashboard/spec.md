## ADDED Requirements

### Requirement: Admin Dashboard Analytics Overview
The admin page SHALL provide an analytics dashboard accessible via a tab alongside the existing model configuration.

#### Scenario: Admin views analytics tab
- **WHEN** an authenticated admin navigates to `/admin` and selects the "אנליטקות" tab
- **THEN** the system SHALL display stat cards with key metrics: unique users (total, registered, guests), total registered users vs those who opened threads, total guests vs those who opened threads, total threads, total messages, avg threads per user, avg threads per guest, avg messages per user, avg messages per guest, avg messages per thread

#### Scenario: Non-admin access denied
- **WHEN** a non-admin user navigates to `/admin`
- **THEN** the system SHALL show the existing access denied screen

### Requirement: Time Range Filtering
The analytics dashboard SHALL support filtering all metrics by time range.

#### Scenario: Filter by predefined time range
- **WHEN** an admin selects a time range (last hour, last 24h, last 7d, last 30d, all time)
- **THEN** all stat cards and charts SHALL update to reflect only data within the selected time range

#### Scenario: Default time range
- **WHEN** the analytics dashboard loads
- **THEN** the default time range SHALL be "last 7 days"

### Requirement: Thread Origin Analysis
The dashboard SHALL display a chart showing how threads were initiated — via prompt suggestion cards or free-text input.

#### Scenario: Prompt card thread detected
- **WHEN** a thread's first user message exactly matches one of the `PROMPT_CARDS` prompt strings
- **THEN** the thread SHALL be categorized under that card's label in the chart

#### Scenario: Free-text thread detected
- **WHEN** a thread's first user message does not match any `PROMPT_CARDS` prompt string
- **THEN** the thread SHALL be categorized as "שאילתה חופשית" (free text) in the chart

### Requirement: Thread Activity Over Time
The dashboard SHALL display a time-series chart showing thread creation trends.

#### Scenario: Display thread creation trend
- **WHEN** the analytics dashboard is loaded with a selected time range
- **THEN** an area chart SHALL show the number of threads created per time bucket (hourly for ≤24h ranges, daily for longer ranges)

### Requirement: Token Usage by Model
The dashboard SHALL display token consumption broken down by model.

#### Scenario: Display token usage
- **WHEN** the analytics dashboard is loaded
- **THEN** a bar chart SHALL show total prompt and completion tokens consumed per model within the time range

### Requirement: Agent Delegation Breakdown
The dashboard SHALL display a chart showing how the routing agent delegates to sub-agents.

#### Scenario: Display delegation distribution
- **WHEN** the analytics dashboard is loaded
- **THEN** a pie chart SHALL show the proportion of delegations to datagovAgent, cbsAgent, and direct responses

### Requirement: Hebrew Labels and Tooltips
All dashboard UI text SHALL be in Hebrew, consistent with the rest of the application.

#### Scenario: Chart labels in Hebrew
- **WHEN** any chart is rendered on the dashboard
- **THEN** its title, axis labels, legend entries, and tooltip text SHALL all be in Hebrew

#### Scenario: Stat card labels in Hebrew
- **WHEN** stat cards are rendered
- **THEN** each card's label SHALL be in Hebrew (e.g., "משתמשים ייחודיים", "סה״כ שיחות", "ממוצע הודעות לשיחה")

### Requirement: Mobile Responsive Dashboard
The analytics dashboard SHALL be fully responsive across mobile and desktop viewports.

#### Scenario: Mobile layout
- **WHEN** the viewport width is below 768px
- **THEN** stat cards SHALL stack in a single column, charts SHALL be full-width, and chart heights SHALL be reduced

#### Scenario: Desktop layout
- **WHEN** the viewport width is 768px or above
- **THEN** stat cards SHALL display in a 2-3 column grid and charts SHALL display in a 2-column layout where appropriate
