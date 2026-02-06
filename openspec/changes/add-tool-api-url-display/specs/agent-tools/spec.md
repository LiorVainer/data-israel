# Agent Tools - API URL Display

## ADDED Requirements

### Requirement: Endpoint Constants
The system SHALL define centralized endpoint constants for all external APIs.

#### Scenario: CBS endpoint constants defined
- **WHEN** a CBS tool needs to construct an API URL
- **THEN** it SHALL use constants from `lib/api/cbs/endpoints.ts`
- **AND** the constants SHALL include base URLs for series, priceIndex, and dictionary APIs
- **AND** the constants SHALL include all endpoint paths

#### Scenario: DataGov endpoint constants defined
- **WHEN** a DataGov tool needs to construct an API URL
- **THEN** it SHALL use constants from `lib/api/data-gov/endpoints.ts`
- **AND** the constants SHALL include the CKAN base URL
- **AND** the constants SHALL include all action endpoint paths

### Requirement: Tool Output URL Field
All CBS and DataGov tools SHALL include an `apiUrl` field in their output schema.

#### Scenario: Successful tool call includes URL
- **WHEN** a tool successfully fetches data from an external API
- **THEN** the tool output SHALL include `apiUrl` containing the full URL that was fetched
- **AND** the URL SHALL include all query parameters used in the request

#### Scenario: Failed tool call includes attempted URL
- **WHEN** a tool fails to fetch data from an external API
- **THEN** the tool output SHALL include `apiUrl` containing the URL that was attempted
- **AND** this allows users to debug failed requests

#### Scenario: URL construction is deterministic
- **WHEN** the same tool is called with identical inputs
- **THEN** the constructed `apiUrl` SHALL be identical
- **AND** URL parameters SHALL be sorted consistently

### Requirement: Searched Resource Name Input
Specific entity tools (not exploration/list tools) SHALL accept an optional `searchedResourceName` input parameter.

#### Scenario: Agent provides resource name from exploration
- **WHEN** the AI agent discovers a resource via catalog/search tools
- **AND** the agent calls a specific entity tool to fetch that resource
- **THEN** the agent MAY provide `searchedResourceName` containing the Hebrew display name
- **AND** this name SHALL be passed through to the output for UI display

#### Scenario: Resource name in output
- **WHEN** a specific entity tool is called with `searchedResourceName`
- **THEN** the tool output SHALL include `searchedResourceName` with the same value
- **AND** the UI SHALL display this name as the badge label

#### Scenario: Missing resource name
- **WHEN** a specific entity tool is called without `searchedResourceName`
- **THEN** the tool output SHALL omit `searchedResourceName`
- **AND** the UI SHALL fall back to displaying the URL pathname

#### Scenario: Tools with searchedResourceName
- **WHEN** implementing specific entity tools
- **THEN** the following tools SHALL support `searchedResourceName`:
  - CBS: `get-cbs-series-data`, `get-cbs-series-data-by-path`, `get-cbs-price-data`, `calculate-cbs-price-index`
  - DataGov: `get-dataset-details`, `get-dataset-activity`, `get-resource-details`, `query-datastore-resource`, `get-organization-details`, `get-organization-activity`

#### Scenario: Tools without searchedResourceName
- **WHEN** implementing exploration/list tools
- **THEN** the following tools SHALL NOT have `searchedResourceName`:
  - CBS: `browse-cbs-catalog`, `browse-cbs-catalog-path`, `browse-cbs-price-indices`, `search-cbs-localities`
  - DataGov: `search-datasets`, `list-all-datasets`, `search-resources`, `list-organizations`, `list-groups`, `list-tags`, `get-status`, `get-dataset-schema`

### Requirement: URL Builder Helpers
The system SHALL provide URL builder helper functions for constructing API URLs.

#### Scenario: CBS URL builder
- **WHEN** a CBS tool needs to construct a URL
- **THEN** it SHALL use `buildCbsUrl(baseUrl, path, params)` from endpoints.ts
- **AND** the function SHALL handle undefined parameters by omitting them
- **AND** the function SHALL properly encode path segments and query parameters

#### Scenario: DataGov URL builder
- **WHEN** a DataGov tool needs to construct a URL
- **THEN** it SHALL use `buildDataGovUrl(path, params)` from endpoints.ts
- **AND** the function SHALL use the CKAN base URL automatically
- **AND** the function SHALL properly encode query parameters

## MODIFIED Requirements

### Requirement: CBS Price Index Browsing Tool
Users MUST be able to browse the CBS price index catalog hierarchically to discover available index codes. The tool output SHALL include the API URL that was fetched.

#### Scenario: Browse chapters with URL
- **WHEN** mode is "chapters"
- **THEN** return all price index chapters with id, name, order
- **AND** return `apiUrl` pointing to `/catalog/catalog` endpoint

#### Scenario: Browse topics with URL
- **WHEN** mode is "topics" and chapterId is provided
- **THEN** return topics within that chapter with id, name
- **AND** return `apiUrl` pointing to `/catalog/chapter` endpoint with id parameter

#### Scenario: Browse indices with URL
- **WHEN** mode is "indices" and subjectId is provided
- **THEN** return index codes within that topic with id, name
- **AND** return `apiUrl` pointing to `/catalog/subject` endpoint with id parameter

### Requirement: CBS Series Catalog Browsing Tool
Users MUST be able to browse the CBS statistical series catalog by level to discover available time series. The tool output SHALL include the API URL that was fetched.

#### Scenario: Browse catalog level with URL
- **WHEN** a level (1-5) is specified
- **THEN** return catalog items at that level with path, name, pathDesc
- **AND** return `apiUrl` pointing to `/catalog/level` endpoint with level and optional subject parameters

### Requirement: CBS Series Data Retrieval Tool
Users MUST be able to retrieve time series data by series ID. The tool output SHALL include the API URL that was fetched.

#### Scenario: Get series data with URL
- **WHEN** a valid seriesId is provided
- **THEN** return series observations with period, value
- **AND** return `apiUrl` pointing to `/data/list` endpoint with id and optional date range parameters

### Requirement: CBS Price Data Retrieval Tool
Users MUST be able to retrieve price index values by index code. The tool output SHALL include the API URL that was fetched.

#### Scenario: Get price data with URL
- **WHEN** a valid indexCode is provided
- **THEN** return price index data with year, month, value, percentChange
- **AND** return `apiUrl` pointing to `/data/price` endpoint with id and optional parameters

### Requirement: CBS Price Calculator Tool
Users MUST be able to calculate index adjustments between two dates. The tool output SHALL include the API URL that was fetched.

#### Scenario: Calculate adjustment with URL
- **WHEN** indexCode, startDate, and endDate are provided
- **THEN** return coefficient, adjustedAmount, startValue, endValue
- **AND** return `apiUrl` pointing to `/data/calculator/{indexCode}` endpoint

### Requirement: CBS Localities Search Tool
Users MUST be able to search Israeli localities by name. The tool output SHALL include the API URL that was fetched.

#### Scenario: Search localities with URL
- **WHEN** a search query is provided
- **THEN** return matching localities with id, nameHebrew, nameEnglish, district, population
- **AND** return `apiUrl` pointing to `/geo/localities` endpoint with search parameters

### Requirement: DataGov Dataset Search Tool
Users MUST be able to search datasets on data.gov.il. The tool output SHALL include the API URL that was fetched.

#### Scenario: Search datasets with URL
- **WHEN** a search query is provided
- **THEN** return matching datasets with id, title, organization, tags, summary
- **AND** return `apiUrl` pointing to `/action/package_search` endpoint with q parameter
- **AND** if Convex RAG is used as source, `apiUrl` MAY be omitted or indicate "convex-rag"

### Requirement: DataGov Dataset Details Tool
Users MUST be able to get full details for a specific dataset. The tool output SHALL include the API URL that was fetched.

#### Scenario: Get dataset details with URL
- **WHEN** a dataset ID is provided
- **THEN** return full dataset metadata including resources
- **AND** return `apiUrl` pointing to `/action/package_show` endpoint with id parameter

### Requirement: DataGov DataStore Query Tool
Users MUST be able to query data within a DataStore resource. The tool output SHALL include the API URL that was fetched.

#### Scenario: Query datastore with URL
- **WHEN** a resource_id and optional filters/query are provided
- **THEN** return fields and records from the DataStore
- **AND** return `apiUrl` pointing to `/action/datastore_search` endpoint with all parameters

### Requirement: DataGov Organization List Tool
Users MUST be able to list all organizations. The tool output SHALL include the API URL that was fetched.

#### Scenario: List organizations with URL
- **WHEN** the tool is called
- **THEN** return list of organization names
- **AND** return `apiUrl` pointing to `/action/organization_list` endpoint

### Requirement: DataGov Status Tool
Users MUST be able to check the CKAN API status. The tool output SHALL include the API URL that was fetched.

#### Scenario: Get status with URL
- **WHEN** the tool is called
- **THEN** return CKAN version, site info, extensions
- **AND** return `apiUrl` pointing to `/action/status_show` endpoint
