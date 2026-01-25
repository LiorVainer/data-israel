# convex-data-store Specification

## ADDED Requirements

### Requirement: Datasets Table
The system SHALL provide a Convex table `datasets` that stores metadata for all data.gov.il datasets.

#### Scenario: Dataset document structure
- **WHEN** a dataset is stored in Convex
- **THEN** it SHALL include ckanId (original ID), title, name, notes, organizationId, organizationTitle, tags array, metadataCreated, and metadataModified

#### Scenario: Query dataset by CKAN ID
- **WHEN** querying for a specific dataset
- **THEN** the system SHALL support lookup by original ckanId via index
- **AND** return the full dataset document

#### Scenario: Dataset uniqueness
- **WHEN** syncing datasets from data.gov.il
- **THEN** existing datasets SHALL be updated (not duplicated) based on ckanId match

### Requirement: Resources Table
The system SHALL provide a Convex table `resources` that stores metadata for dataset resources with foreign key relationship.

#### Scenario: Resource document structure
- **WHEN** a resource is stored in Convex
- **THEN** it SHALL include ckanId, datasetId (Convex ID reference), name, url, format, and description

#### Scenario: Query resources by dataset
- **WHEN** querying for resources of a specific dataset
- **THEN** the system SHALL support lookup by datasetId via index
- **AND** return all resources belonging to that dataset

#### Scenario: Resource uniqueness
- **WHEN** syncing resources from data.gov.il
- **THEN** existing resources SHALL be updated (not duplicated) based on ckanId match

### Requirement: RAG Indexing for Datasets
The system SHALL index dataset text content for semantic search using Convex RAG component.

#### Scenario: Dataset text indexing
- **WHEN** a dataset is added or updated
- **THEN** the system SHALL create RAG embeddings for title, notes, and concatenated tags
- **AND** store embeddings with organization and tag filter metadata

#### Scenario: Dataset namespace
- **WHEN** indexing datasets for RAG
- **THEN** all datasets SHALL use "datasets" namespace
- **AND** support filtered search within that namespace

#### Scenario: Dataset filter types
- **WHEN** configuring RAG for datasets
- **THEN** the system SHALL define filter types for organization (string) and tag (string)
- **AND** enable type-safe filtered search

### Requirement: RAG Indexing for Resources
The system SHALL index resource text content for semantic search using Convex RAG component.

#### Scenario: Resource text indexing
- **WHEN** a resource is added or updated
- **THEN** the system SHALL create RAG embeddings for name and description
- **AND** store embeddings with datasetId and format filter metadata

#### Scenario: Resource namespace
- **WHEN** indexing resources for RAG
- **THEN** all resources SHALL use "resources" namespace
- **AND** support filtered search within that namespace

#### Scenario: Resource filter types
- **WHEN** configuring RAG for resources
- **THEN** the system SHALL define filter types for datasetId (string) and format (string)
- **AND** enable type-safe filtered search

### Requirement: Data Sync from data.gov.il
The system SHALL provide a sync mechanism to populate Convex from the data.gov.il CKAN API.

#### Scenario: Full sync execution
- **WHEN** running the sync script
- **THEN** the system SHALL fetch all datasets from data.gov.il
- **AND** create or update dataset documents in Convex
- **AND** create RAG embeddings for each dataset

#### Scenario: Resource sync with relationship
- **WHEN** syncing resources for a dataset
- **THEN** the system SHALL link each resource to its parent dataset via datasetId
- **AND** create RAG embeddings for each resource

#### Scenario: Batch processing
- **WHEN** syncing large numbers of datasets
- **THEN** the system SHALL process in batches to avoid rate limits
- **AND** provide progress logging

#### Scenario: Sync error handling
- **WHEN** sync encounters API errors
- **THEN** the system SHALL log errors and continue with remaining items
- **AND** report summary of successes and failures

### Requirement: Embedding Model Configuration
The system SHALL configure OpenRouter embedding API using the existing `@openrouter/ai-sdk-provider` for generating embeddings.

#### Scenario: Embedding model initialization
- **WHEN** RAG component is initialized
- **THEN** it SHALL use OpenRouter with model `openai/text-embedding-3-small` (1536 dimensions)
- **AND** use existing `OPENROUTER_API_KEY` environment variable (same as chat model)

#### Scenario: OpenRouter provider consistency
- **WHEN** embedding model is configured
- **THEN** it SHALL use `createOpenRouter` from `@openrouter/ai-sdk-provider`
- **AND** call `openrouter.embedding("openai/text-embedding-3-small")`

#### Scenario: Embedding generation
- **WHEN** text is added to RAG
- **THEN** embeddings SHALL be generated automatically by the RAG component via OpenRouter
- **AND** stored in Convex vector index
