# data-source-integration

## ADDED Requirements

### Requirement: BudgetKey Data Source via MCPClient
The system SHALL integrate BudgetKey as a data source using Mastra's `MCPClient` with the hosted endpoint `https://next.obudget.org/mcp`. Tools SHALL be auto-discovered and namespaced as `budgetkey_ToolName`.

#### Scenario: BudgetKey agent queries budget data
- **GIVEN** a user asks about Israeli state budget allocations
- **WHEN** the routing agent delegates to the budget sub-agent
- **THEN** the sub-agent SHALL use MCPClient tools (DatasetInfo, DatasetFullTextSearch, DatasetDBQuery) to query the BudgetKey API
- **AND** return Hebrew-formatted results

#### Scenario: BudgetKey tools appear in ChainOfThought UI
- **GIVEN** the budget agent executes MCPClient tools
- **WHEN** tool calls stream via `data-tool-agent` parts
- **THEN** the UI SHALL display Hebrew tool names and icons from registered translations
- **AND** resource chips SHALL show extracted dataset/query labels

### Requirement: Knesset Data Source
The system SHALL integrate Knesset parliamentary data via custom Mastra tools querying the Knesset OData API at `http://knesset.gov.il/Odata/ParliamentInfo.svc`.

#### Scenario: Search bills by keyword
- **GIVEN** a user asks about legislation related to education
- **WHEN** the routing agent delegates to the Knesset sub-agent
- **THEN** the sub-agent SHALL search bills via OData `$filter` with `substringof()`
- **AND** return matching bills with ID, name, type, and Knesset number

#### Scenario: Get committee information
- **GIVEN** a user asks about a specific Knesset committee
- **WHEN** the Knesset agent queries committee data
- **THEN** it SHALL return committee details including name, type, sessions, and active status

### Requirement: Nadlan Data Source
The system SHALL integrate Israeli real estate transaction data via custom Mastra tools querying the Govmap API at `https://www.govmap.gov.il/api/`.

#### Scenario: Find recent deals near an address
- **GIVEN** a user asks about apartment prices in a specific area
- **WHEN** the routing agent delegates to the Nadlan sub-agent
- **THEN** it SHALL autocomplete the address, find nearby deals, and return transaction data with prices, property types, and dates

#### Scenario: Market trend analysis
- **GIVEN** a user asks about price trends in a neighborhood
- **WHEN** the Nadlan agent analyzes historical data
- **THEN** it SHALL return yearly price breakdowns and property type analysis

### Requirement: Israel Drugs Data Source
The system SHALL integrate the Ministry of Health pharmaceutical database via custom Mastra tools querying `https://israeldrugs.health.gov.il/GovServiceList/IDRServer`.

#### Scenario: Search drug by name
- **GIVEN** a user asks about a specific medication
- **WHEN** the drugs agent searches by name
- **THEN** it SHALL return matching drugs with registration number, active ingredients, health fund coverage, and prescription status

#### Scenario: Find drugs for symptom
- **GIVEN** a user asks what medications treat a specific condition
- **WHEN** the drugs agent searches by symptom category
- **THEN** it SHALL return relevant medications with therapeutic classifications

### Requirement: IL Health Data Source
The system SHALL integrate Ministry of Health dashboard data via custom Mastra tools querying `https://datadashboard.health.gov.il/api`.

#### Scenario: Query health service quality
- **GIVEN** a user asks about hospital quality metrics
- **WHEN** the health agent fetches data for the `serviceQuality` subject
- **THEN** it SHALL first retrieve metadata for available endpoints, then fetch specific data

### Requirement: Grocery Prices Data Source
The system SHALL integrate Israeli supermarket price data from mandatory Price Transparency Law XML feeds.

#### Scenario: Compare product prices across chains
- **GIVEN** a user asks about the price of a specific product
- **WHEN** the grocery agent parses PricesFull feeds from multiple chains
- **THEN** it SHALL match products by barcode (729 prefix) or fuzzy name matching
- **AND** return a comparison table sorted by price

#### Scenario: Optimize shopping list
- **GIVEN** a user provides a shopping list
- **WHEN** the grocery agent calculates costs across chains
- **THEN** it SHALL recommend the cheapest single-store and optimal multi-store split

## MODIFIED Requirements

### Requirement: Routing Agent Handles 8 Sub-Agents
The routing agent SHALL delegate to all sub-agents via flat routing (no hierarchy). It SHALL support parallel sub-agent calls for cross-domain queries.

#### Scenario: Cross-domain query
- **GIVEN** a user asks "how much did the government spend on housing in Tel Aviv?"
- **WHEN** the routing agent identifies this spans budget and real estate
- **THEN** it MAY call budget and Nadlan sub-agents in parallel
- **AND** synthesize results from both

### Requirement: DataSource Union Updated
The `DataSource` type SHALL include all 8 source IDs: `'cbs' | 'datagov' | 'budget' | 'knesset' | 'nadlan' | 'drugs' | 'health' | 'grocery'`.

#### Scenario: Badge config for all sources
- **GIVEN** a source URL chip is displayed in the chat UI
- **WHEN** the source belongs to any of the 8 data sources
- **THEN** it SHALL render with the correct badge styling from `DATA_SOURCE_CONFIG`
