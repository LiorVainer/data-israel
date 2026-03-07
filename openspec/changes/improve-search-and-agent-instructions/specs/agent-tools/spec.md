## MODIFIED Requirements

### Requirement: Dataset Search Tool
The system SHALL provide a `searchDatasets` tool that searches for datasets using both Convex RAG semantic search and the CKAN API in parallel, merging and deduplicating results by dataset ID.

#### Scenario: Search with keyword
- **WHEN** the tool is called with a short keyword query (e.g., "רכבת")
- **THEN** it SHALL run RAG and CKAN searches in parallel via `Promise.allSettled`
- **AND** merge results with CKAN results first, deduplicated by dataset ID
- **AND** return datasets with id, title, organization, tags, summary

#### Scenario: RAG returns low-quality results
- **WHEN** RAG results all have scores below 0.5
- **THEN** they SHALL be filtered out
- **AND** only CKAN results SHALL be returned

#### Scenario: RAG fails but CKAN succeeds
- **WHEN** the Convex RAG action throws an error
- **THEN** `Promise.allSettled` SHALL capture the rejection
- **AND** CKAN results SHALL still be returned successfully

#### Scenario: Both sources return results
- **WHEN** both RAG and CKAN return datasets
- **THEN** CKAN results SHALL appear first (better keyword ranking)
- **AND** RAG results not already in CKAN SHALL be appended
- **AND** total results SHALL be capped at the requested limit

#### Scenario: No results from either source
- **WHEN** neither RAG nor CKAN returns any results
- **THEN** the tool SHALL return success=false with error message

#### Scenario: Search with pagination
- **WHEN** the tool is called with rows=10 and start=0
- **THEN** it SHALL return at most 10 results starting from offset 0
- **AND** include total count for pagination

#### Scenario: API error handling
- **WHEN** both RAG and CKAN fail
- **THEN** the tool SHALL return a structured error object with success=false
- **AND** include error message

## ADDED Requirements

### Requirement: RAG Indexing Quality
The system SHALL index datasets for RAG search with deduplicated, capped tags to prevent keyword-stuffing from distorting embedding similarity scores.

#### Scenario: Deduplication of tags
- **WHEN** a dataset is indexed with duplicate tags (e.g., ["רכבת", "רכבת כבדה", "רכבת"])
- **THEN** duplicate tags SHALL be removed before building searchable text
- **AND** only unique tag values SHALL be included

#### Scenario: Tag cap
- **WHEN** a dataset has more than 5 unique tags
- **THEN** only the first 5 unique tags SHALL be included in searchable text
- **AND** the remaining tags SHALL be excluded from embedding

#### Scenario: Batch indexing consistency
- **WHEN** datasets are indexed via `batchIndexDatasets`
- **THEN** the same deduplication and cap logic SHALL apply

### Requirement: Agent Search Strategy Instructions
The DataGov agent instructions SHALL include explicit search strategy guidance to ensure effective keyword-based searching.

#### Scenario: Short keyword queries
- **WHEN** the agent searches for datasets
- **THEN** it SHALL use 1-2 short Hebrew keywords (e.g., "רכבת" not "נתוני דיוק רכבת ישראל")

#### Scenario: Retry with alternative terms
- **WHEN** the first search returns no relevant results
- **THEN** the agent SHALL try at least 2-3 different search terms before reporting "not found"
- **AND** alternatives SHALL include broader keywords, synonyms, or organization names

### Requirement: CBS Catalog Drilling Instructions
The CBS agent instructions SHALL require drilling through catalog levels to find and fetch actual data.

#### Scenario: Multi-level catalog navigation
- **WHEN** the agent browses the CBS catalog
- **THEN** it SHALL navigate through levels 1, 2, 3, and 4 as needed
- **AND** SHALL NOT report "not found" after only browsing level 1 or 2

#### Scenario: Data fetching requirement
- **WHEN** the agent finds a relevant series in the catalog
- **THEN** it SHALL fetch actual data with `getCbsSeriesData` or `getCbsSeriesDataByPath`
- **AND** SHALL NOT stop at catalog metadata only

### Requirement: Routing Agent Unified Response
The routing agent SHALL produce a single unified response when multiple sub-agents report no results.

#### Scenario: Multiple agents report no results
- **WHEN** both datagovAgent and cbsAgent report no relevant data
- **THEN** the routing agent SHALL write one consolidated response
- **AND** SHALL NOT repeat the same "not found" message multiple times

### Requirement: Data-Verified Prompt Suggestions
The system SHALL display prompt suggestion cards that are verified against live, queryable API data.

#### Scenario: Prompt cards display
- **WHEN** the empty conversation state is shown
- **THEN** 8 prompt cards SHALL be displayed with Hebrew labels and icons
- **AND** each prompt SHALL correspond to data verified as fresh and queryable

#### Scenario: Topic diversity
- **WHEN** prompt cards are displayed
- **THEN** they SHALL cover diverse topics: CPI/prices, trains, construction, housing, flights, road accidents, foreign trade, air quality
