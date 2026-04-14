# landing-page-sources

## ADDED Requirements

### Requirement: Landing Categories as Single Source of Truth
The system SHALL define landing page categories in a single `LANDING_CATEGORIES` constant. Each category has a Hebrew `label` and numeric `order`. The `LandingCategory` type SHALL be `keyof typeof LANDING_CATEGORIES`.

#### Scenario: Categories are typed and centralized
- **GIVEN** `LANDING_CATEGORIES` is defined in `display.types.ts`
- **WHEN** a data source declares `landing.category`
- **THEN** TypeScript SHALL enforce the value is a valid key of `LANDING_CATEGORIES`
- **AND** adding a new category requires only updating the constant

### Requirement: DataSourceDefinition Landing Config
Each `DataSourceDefinition` SHALL support an optional `landing` field with logo path, Hebrew description, stats array, category, and sort order.

#### Scenario: Data source with landing config
- **GIVEN** a data source defines `landing: { logo, description, stats, category, order }`
- **WHEN** the SourcesSection renders
- **THEN** it SHALL display the source as a card under the correct category tab

#### Scenario: Data source without landing config
- **GIVEN** a data source does not define `landing`
- **WHEN** the SourcesSection renders
- **THEN** it SHALL NOT display that source on the landing page

### Requirement: SourcesSection with Category Tabs
The `SourcesSection` component SHALL render a shadcn/ui `Tabs` component with one tab per landing category, sorted by `order`. Within each tab, sources SHALL render as cards in a responsive grid.

#### Scenario: Tabs render in correct order
- **GIVEN** categories have `order` values 1, 2, 3
- **WHEN** the landing page renders
- **THEN** tabs SHALL appear left-to-right (RTL: right-to-left) in ascending order
- **AND** the first category SHALL be selected by default

#### Scenario: Cards within a tab
- **GIVEN** a category has 3 data sources with `landing` config
- **WHEN** the user selects that category tab
- **THEN** 3 `SourceCard` components SHALL render in a responsive grid (1 col mobile, 2 col tablet, 3 col desktop)
- **AND** each card shows logo, description, stats, and a link to the source URL

#### Scenario: RTL support
- **GIVEN** the UI is in Hebrew RTL mode
- **WHEN** tabs and cards render
- **THEN** the `Tabs` component SHALL have `dir="rtl"`
- **AND** card layout SHALL respect RTL flow

### Requirement: SourceCard Component
A new `SourceCard` component SHALL render a single data source with logo, Hebrew description, up to 3 stat items, and a link to the source URL.

#### Scenario: Card displays stats
- **GIVEN** a source has 3 stats defined
- **WHEN** the SourceCard renders
- **THEN** it SHALL show each stat with its label, value, and icon
