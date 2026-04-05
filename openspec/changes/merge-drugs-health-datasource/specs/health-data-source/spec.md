# Spec: Unified Health Data Source

## ADDED Requirements

### REQ-1: Domain-Based Subfolder Structure
The health data source SHALL organize API clients and tools into domain-based subfolders: `api/drugs/` for the drug registry and `api/overview-data/` for the health data overview-data.

#### Scenario: Drug API client location
- **WHEN** a drug tool imports its API client
- **THEN** the import path references `../../api/drugs/drugs.client`
- **AND** the client connects to `israeldrugs.health.gov.il`

#### Scenario: Dashboard API client location
- **WHEN** a overview-data tool imports its API client
- **THEN** the import path references `../../api/overview-data/overview-data.client`
- **AND** the client connects to `dataoverview-data.health.gov.il`

### REQ-2: Cross-Domain Tool Aggregation
The health data source SHALL export a unified `HealthTools` object that merges drug tools (8) and overview-data tools (5) into a single 13-tool record.

#### Scenario: Tool aggregation
- **WHEN** `tools/index.ts` is imported
- **THEN** `HealthTools` contains all 8 drug tool keys and all 5 overview-data tool keys
- **AND** `HealthToolName` type is the union of both

#### Scenario: Source resolver aggregation
- **WHEN** source resolvers are exported
- **THEN** `healthSourceResolvers` contains resolvers from both drugs (2) and overview-data (1) domains

### REQ-3: Unified Agent Instructions
The health agent SHALL have combined instructions covering both drug registry and health overview-data capabilities.

#### Scenario: Drug query delegation
- **WHEN** the routing agent delegates a drug query (e.g., "חפש תרופה נגד אלרגיה")
- **THEN** the health agent uses drug tools (`searchDrugByName`, `searchDrugBySymptom`, etc.)

#### Scenario: Dashboard query delegation
- **WHEN** the routing agent delegates a health overview-data query (e.g., "נתוני חיסוני ילדים")
- **THEN** the health agent uses overview-data tools (`getAvailableSubjects`, `getHealthData`, etc.)

### REQ-4: Combined Landing Page Card
The health data source SHALL display a single landing page card under the "בריאות" category.

#### Scenario: Landing card content
- **WHEN** the landing page renders the health category
- **THEN** one card appears for "משרד הבריאות"
- **AND** the card shows combined stats covering both drugs and overview-data

### REQ-5: Merged Suggestion Prompts
The health data source SHALL provide suggestion prompts covering both drug and overview-data domains.

#### Scenario: Suggestion variety
- **WHEN** the empty conversation shows health suggestions
- **THEN** suggestions include both drug-related prompts (e.g., "חלופות גנריות") and overview-data-related prompts (e.g., "איכות שירות בתי חולים")

## MODIFIED Requirements

### REQ-6: Tool ID Stability
All 13 tool IDs SHALL remain unchanged after the merge.

#### Scenario: Drug tool IDs preserved
- **WHEN** the unified health agent registers tools
- **THEN** all 8 drug tool IDs exist: `searchDrugByName`, `searchDrugBySymptom`, `exploreGenericAlternatives`, `exploreTherapeuticCategories`, `browseSymptoms`, `getDrugDetails`, `suggestDrugNames`, `generateDrugsSourceUrl`

#### Scenario: Dashboard tool IDs preserved
- **WHEN** the unified health agent registers tools
- **THEN** all 5 overview-data tool IDs exist: `getAvailableSubjects`, `getHealthMetadata`, `getHealthData`, `getHealthLinks`, `generateHealthSourceUrl`

### REQ-7: Data Source ID Simplification
The `DataSource` type union SHALL contain `'health'` but NOT `'drugs'`.

#### Scenario: Drug tools mapped to health source
- **WHEN** `getToolDataSource('searchDrugByName')` is called
- **THEN** it returns `'health'`

#### Scenario: DataSource type
- **WHEN** TypeScript checks the `DataSource` union
- **THEN** `'drugs'` is NOT a valid value
- **AND** `'health'` IS a valid value

## REMOVED Requirements

### REQ-8: Separate Drugs Data Source
The standalone `src/data-sources/drugs/` folder and its `DrugsDataSource` definition SHALL be removed.

#### Scenario: No drugs folder
- **WHEN** the filesystem is checked
- **THEN** `src/data-sources/drugs/` does not exist

#### Scenario: No drugs agent in network
- **WHEN** the routing agent lists its sub-agents
- **THEN** `drugsAgent` is NOT listed
- **AND** `healthAgent` IS listed with both drug and overview-data capabilities
