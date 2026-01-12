# Agent Tools Specification (Delta)

## ADDED Requirements

### Requirement: Dataset Search Tool
The system SHALL provide a `searchDatasets` tool that queries the data.gov.il CKAN API to find datasets matching user criteria.

#### Scenario: Search with keyword
- **WHEN** the tool is called with query parameter "transportation"
- **THEN** it SHALL call `/api/3/action/package_search` with query parameter
- **AND** return a list of matching datasets with id, title, organization, tags

#### Scenario: Search with pagination
- **WHEN** the tool is called with rows=10 and start=0
- **THEN** it SHALL return at most 10 results starting from offset 0
- **AND** include total count for pagination

#### Scenario: Search with sorting
- **WHEN** the tool is called with sort="metadata_modified desc"
- **THEN** results SHALL be ordered by last modified date descending

#### Scenario: API error handling
- **WHEN** the CKAN API returns an error (4xx or 5xx)
- **THEN** the tool SHALL return a structured error object with success=false
- **AND** include error message and code

### Requirement: Dataset Details Tool
The system SHALL provide a `getDatasetDetails` tool that retrieves full metadata for a specific dataset by ID.

#### Scenario: Get dataset by ID
- **WHEN** the tool is called with a valid dataset ID
- **THEN** it SHALL call `/api/3/action/package_show` with the ID
- **AND** return full dataset metadata including resources, organization, tags

#### Scenario: Invalid dataset ID
- **WHEN** the tool is called with a non-existent dataset ID
- **THEN** it SHALL return success=false with appropriate error message

#### Scenario: Dataset with resources
- **WHEN** a dataset has downloadable resources
- **THEN** the response SHALL include the resources array with URL, format, and description

### Requirement: Group Listing Tool
The system SHALL provide a `listGroups` tool that enumerates dataset publishers and categories.

#### Scenario: List all groups
- **WHEN** the tool is called without parameters
- **THEN** it SHALL call `/api/3/action/group_list`
- **AND** return a list of group names

#### Scenario: List with full details
- **WHEN** the tool is called with allFields=true
- **THEN** each group SHALL include name, display_name, description, and package_count

#### Scenario: Paginated group listing
- **WHEN** the tool is called with limit=20 and offset=10
- **THEN** it SHALL return at most 20 groups starting from offset 10

### Requirement: Tag Listing Tool
The system SHALL provide a `listTags` tool that explores dataset taxonomy and keywords.

#### Scenario: List all tags
- **WHEN** the tool is called without parameters
- **THEN** it SHALL call `/api/3/action/tag_list`
- **AND** return a list of tag names

#### Scenario: Search tags by query
- **WHEN** the tool is called with query="health"
- **THEN** it SHALL return only tags matching "health"

#### Scenario: Tags with metadata
- **WHEN** the tool is called with allFields=true
- **THEN** each tag SHALL include name and usage count

### Requirement: Zod Input Validation
All tool inputs SHALL be validated using Zod schemas before making API calls.

#### Scenario: Valid input passes validation
- **WHEN** searchDatasets is called with valid parameters
- **THEN** Zod validation SHALL pass and API call proceeds

#### Scenario: Invalid input type
- **WHEN** searchDatasets is called with rows="ten" (string instead of number)
- **THEN** Zod validation SHALL fail and return type error

#### Scenario: Out of range values
- **WHEN** searchDatasets is called with rows=10000 (exceeds max)
- **THEN** Zod validation SHALL fail and return range error

### Requirement: Zod Output Validation
All tool outputs SHALL conform to defined Zod schemas for type safety.

#### Scenario: Successful API response
- **WHEN** CKAN API returns valid data
- **THEN** response SHALL be validated against output schema
- **AND** TypeScript types SHALL be inferred from schema

#### Scenario: Malformed API response
- **WHEN** CKAN API returns unexpected structure
- **THEN** Zod validation SHALL catch the issue
- **AND** tool SHALL return structured error

### Requirement: CKAN API Client
The system SHALL provide a reusable CKAN API client for making HTTP requests.

#### Scenario: Successful API call
- **WHEN** client makes a valid request to `/api/3/action/package_search`
- **THEN** it SHALL use fetch with base URL `https://data.gov.il/api/3`
- **AND** return parsed JSON response

#### Scenario: Network error
- **WHEN** fetch fails due to network issues
- **THEN** client SHALL catch the error and return structured error object

#### Scenario: Non-JSON response
- **WHEN** API returns non-JSON content-type
- **THEN** client SHALL handle gracefully and return error

### Requirement: TypeScript Type Safety
All tools and API client code SHALL maintain strict TypeScript type safety.

#### Scenario: No any types
- **WHEN** code is type-checked with tsc
- **THEN** there SHALL be zero uses of `any` type (except for unknown external data before validation)

#### Scenario: Minimal type assertions
- **WHEN** code uses type assertions with `as`
- **THEN** each assertion SHALL be necessary and documented with comment

#### Scenario: Zod type inference
- **WHEN** Zod schemas are defined
- **THEN** TypeScript types SHALL be inferred using `z.infer<typeof schema>`
- **AND** no duplicate type definitions SHALL exist

### Requirement: Tool Registration
All tools SHALL be exported from `lib/agent/tools/index.ts` for easy import.

#### Scenario: Import all tools
- **WHEN** agent code imports from `@/lib/agent/tools`
- **THEN** all four tools SHALL be available as named exports

#### Scenario: Tree-shaking support
- **WHEN** bundler processes tool imports
- **THEN** unused tools SHALL be excluded from bundle (ES module exports)
