## ADDED Requirements

### Requirement: Datastore Resource Query Tool
The system SHALL provide a `queryDatastoreResource` tool that queries tabular data within a specific resource using the CKAN DataStore API.

#### Scenario: Query with resource ID
- **WHEN** the tool is called with a valid resource_id
- **THEN** it SHALL call `/api/action/datastore_search?resource_id={resource_id}`
- **AND** return records (rows) with field names and values

#### Scenario: Query with pagination
- **WHEN** the tool is called with resource_id, limit=10, and offset=0
- **THEN** it SHALL include `&limit=10&offset=0` in the API request
- **AND** return at most 10 records starting from offset 0
- **AND** include total record count for pagination

#### Scenario: Query with column filters
- **WHEN** the tool is called with filters={"city": "Jerusalem", "year": "2023"}
- **THEN** it SHALL encode filters as JSON in the `filters` parameter
- **AND** return only records matching all filter criteria

#### Scenario: Query with sorting
- **WHEN** the tool is called with sort="population desc"
- **THEN** results SHALL be ordered by the specified column in descending order

#### Scenario: Invalid resource ID
- **WHEN** the tool is called with a non-existent resource_id
- **THEN** it SHALL return success=false with appropriate error message
- **AND** indicate the resource does not exist or is not in DataStore

#### Scenario: Resource not in DataStore
- **WHEN** the resource exists but is not loaded into DataStore (e.g., a PDF file)
- **THEN** the tool SHALL return success=false
- **AND** indicate the resource is not queryable via DataStore

#### Scenario: API rate limiting
- **WHEN** the CKAN API returns a 429 Too Many Requests error
- **THEN** the tool SHALL return structured error with rate limit information

### Requirement: Datastore Input Validation
The `queryDatastoreResource` tool inputs SHALL be validated using Zod schemas.

#### Scenario: Valid resource_id format
- **WHEN** resource_id is a valid UUID or identifier string
- **THEN** Zod validation SHALL pass

#### Scenario: Invalid filter format
- **WHEN** filters parameter is not a valid object (e.g., a string)
- **THEN** Zod validation SHALL fail and return type error

#### Scenario: Pagination bounds
- **WHEN** limit exceeds 1000 or offset is negative
- **THEN** Zod validation SHALL fail and return range error

### Requirement: Datastore Output Structure
The tool SHALL return structured JSON with consistent success/error format.

#### Scenario: Successful query response
- **WHEN** DataStore API returns valid data
- **THEN** response SHALL include:
  - success: true
  - fields: array of field definitions (name, type)
  - records: array of record objects
  - total: total record count
  - offset: current offset
  - limit: records per page

#### Scenario: Error response
- **WHEN** DataStore API returns an error
- **THEN** response SHALL include:
  - success: false
  - error: error message string
  - code: optional error code

### Requirement: DataStore API Client Method
The CKAN API client SHALL provide a `datastore.search()` method.

#### Scenario: Call datastore_search endpoint
- **WHEN** client.datastore.search() is called
- **THEN** it SHALL make GET request to `https://data.gov.il/api/action/datastore_search`
- **AND** include all query parameters (resource_id, filters, limit, offset, sort)

#### Scenario: JSON filter encoding
- **WHEN** filters parameter is provided as an object
- **THEN** it SHALL be JSON.stringify'd for the API query string

#### Scenario: Handle DataStore-specific errors
- **WHEN** API returns DataStore-specific errors (e.g., "resource not in DataStore")
- **THEN** client SHALL parse and return structured error information
