# empty-conversation-tabs

## ADDED Requirements

### Requirement: Suggestions Field on DataSourceDefinition
The `DataSourceDefinition` interface SHALL support an optional `suggestions` field containing an array of example prompts with labels and icons, plus optional icon and color overrides.

#### Scenario: Data source with suggestions
- **GIVEN** a data source defines `suggestions: { prompts: [...] }`
- **WHEN** the registry aggregates data sources
- **THEN** the suggestions SHALL be available via `getDataSourcesWithSuggestions()`

#### Scenario: Data source without suggestions
- **GIVEN** a data source does not define `suggestions`
- **WHEN** `getDataSourcesWithSuggestions()` is called
- **THEN** that source SHALL be excluded from the results

### Requirement: Category-Based Empty Conversation
The `EmptyConversation` component SHALL display suggestion cards grouped by `LANDING_CATEGORIES` (3 tabs: government, economy, health) instead of a flat grid. Each card SHALL be tagged with its source name/icon.

#### Scenario: Category tabs render
- **GIVEN** multiple data sources have suggestions defined
- **WHEN** the empty conversation renders
- **THEN** 3 category tabs SHALL appear matching `LANDING_CATEGORIES` labels (ממשל ותקציב, כלכלה ונדל"ן, בריאות)

#### Scenario: Selecting a category tab
- **GIVEN** a user clicks a category tab
- **WHEN** the tab becomes active
- **THEN** the suggestion cards below SHALL show prompts from all sources in that category

#### Scenario: Cards tagged with source
- **GIVEN** a category tab has suggestions from multiple sources
- **WHEN** the cards render
- **THEN** each card SHALL show the source icon and short name alongside its label

#### Scenario: Default state
- **GIVEN** no category tab is explicitly selected
- **WHEN** the empty conversation first renders
- **THEN** the first category tab (government) SHALL be selected by default

#### Scenario: Clicking a suggestion card
- **GIVEN** a suggestion card is displayed
- **WHEN** the user clicks it
- **THEN** it SHALL call the `onClick` handler with the card's `prompt` text

### Requirement: Remove Hardcoded Prompt Cards
The `constants/prompt-cards.ts` file SHALL be removed and all prompt card data SHALL come from data source definitions via the registry.

#### Scenario: No import of prompt-cards
- **GIVEN** the refactor is complete
- **WHEN** the codebase is searched for `prompt-cards` imports
- **THEN** no files SHALL import from `constants/prompt-cards`

## MODIFIED Requirements

### Requirement: SuggestionsConfig Type
The `display.types.ts` SHALL export a `SuggestionsConfig` interface and `SuggestionPrompt` interface used by `DataSourceDefinition`.

#### Scenario: Type definitions
- **GIVEN** the types are defined
- **WHEN** a data source declares suggestions
- **THEN** TypeScript SHALL enforce the correct shape (icon, color, prompts with label/prompt/icon)
