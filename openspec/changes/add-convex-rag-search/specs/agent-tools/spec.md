# agent-tools Spec Delta

## MODIFIED Requirements

### Requirement: Dataset Search Tool
The system SHALL provide a `searchDatasets` tool that queries the Convex RAG database to find datasets using semantic similarity search.

#### Scenario: Semantic search with query
- **WHEN** the tool is called with query parameter "public transportation data"
- **THEN** it SHALL perform semantic similarity search against indexed dataset embeddings
- **AND** return datasets ranked by semantic relevance (not just keyword match)
- **AND** include id, title, organization, tags, and relevance score

#### Scenario: Search with organization filter
- **WHEN** the tool is called with query and organization filter
- **THEN** it SHALL combine semantic search with organization metadata filter
- **AND** return only datasets from the specified organization

#### Scenario: Search with tag filter
- **WHEN** the tool is called with query and tag filter
- **THEN** it SHALL combine semantic search with tag metadata filter
- **AND** return only datasets with the specified tag

#### Scenario: Search with pagination
- **WHEN** the tool is called with limit=10
- **THEN** it SHALL return at most 10 results ordered by semantic relevance
- **AND** include total count for pagination context

#### Scenario: Empty database handling
- **WHEN** the Convex database has no indexed datasets
- **THEN** the tool SHALL return success=false with message indicating sync required

#### Scenario: Hebrew query support
- **WHEN** the tool is called with Hebrew query text
- **THEN** it SHALL find semantically relevant datasets regardless of language match
- **AND** return Hebrew dataset titles and descriptions

## MODIFIED Requirements

### Requirement: Resource Search Tool
The system SHALL provide a `searchResources` tool that queries the Convex RAG database to find resources using semantic similarity and dataset relationship.

#### Scenario: Semantic search for resources
- **WHEN** the tool is called with query "CSV files about education"
- **THEN** it SHALL perform semantic similarity search against indexed resource embeddings
- **AND** return resources ranked by semantic relevance

#### Scenario: Search resources by dataset
- **WHEN** the tool is called with datasetId filter
- **THEN** it SHALL return only resources belonging to the specified dataset
- **AND** maintain semantic search within that scope

#### Scenario: Search resources by format
- **WHEN** the tool is called with format filter "csv"
- **THEN** it SHALL return only resources with CSV format
- **AND** combine with semantic search if query provided

#### Scenario: Resource with dataset context
- **WHEN** resource search returns results
- **THEN** each result SHALL include parent dataset ID for context
- **AND** include resource id, name, url, format, and description
