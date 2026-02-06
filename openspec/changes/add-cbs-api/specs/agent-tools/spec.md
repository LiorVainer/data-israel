## ADDED Requirements

### Requirement: CBS Series Catalog Tool
The system SHALL provide a `browseCbsCatalog` tool that browses the CBS statistical catalog hierarchy.

#### Scenario: Browse top-level categories
- **WHEN** the tool is called with level=1
- **THEN** it SHALL call CBS Series API `/catalog/level` with `id=1&format=json`
- **AND** return a list of top-level statistical subjects

#### Scenario: Browse sub-categories
- **WHEN** the tool is called with level=2 and a subject code
- **THEN** it SHALL return sub-categories within the specified subject

#### Scenario: API error
- **WHEN** the CBS API returns an error
- **THEN** the tool SHALL return success=false with error message

### Requirement: CBS Series Data Tool
The system SHALL provide a `getCbsSeriesData` tool that retrieves time series data by series ID.

#### Scenario: Get series with date range
- **WHEN** the tool is called with a series ID and start/end period
- **THEN** it SHALL call `/data/list` with the ID and date range
- **AND** return data points with dates and values

#### Scenario: Get latest N entries
- **WHEN** the tool is called with `last=12`
- **THEN** it SHALL return the 12 most recent data points

### Requirement: CBS Price Index Catalog Tool
The system SHALL provide a `browseCbsPriceIndices` tool that browses price index categories.

#### Scenario: Browse chapters
- **WHEN** the tool is called without a specific chapter
- **THEN** it SHALL return all price index chapters

#### Scenario: Browse chapter topics
- **WHEN** the tool is called with a chapter ID
- **THEN** it SHALL return topics and index codes within that chapter

### Requirement: CBS Price Data Tool
The system SHALL provide a `getCbsPriceData` tool that retrieves price index values.

#### Scenario: Get index values
- **WHEN** the tool is called with an index code and date range
- **THEN** it SHALL return index values over time

#### Scenario: Get latest values
- **WHEN** the tool is called with `last=6`
- **THEN** it SHALL return the 6 most recent index values

### Requirement: CBS Price Calculator Tool
The system SHALL provide a `calculateCbsPriceIndex` tool for CPI index adjustment calculations.

#### Scenario: Calculate adjustment
- **WHEN** the tool is called with index code, start date, end date, and amount
- **THEN** it SHALL return the adjusted amount and coefficient

### Requirement: CBS Localities Dictionary Tool
The system SHALL provide a `searchCbsLocalities` tool for searching Israeli locality data.

#### Scenario: Search by name
- **WHEN** the tool is called with a Hebrew locality name
- **THEN** it SHALL return matching localities with population, district, and region

#### Scenario: Filter by district
- **WHEN** the tool is called with a district filter
- **THEN** it SHALL return only localities in that district

### Requirement: CBS API Client
The system SHALL provide a reusable CBS API client with typed axios instances.

#### Scenario: Series API call
- **WHEN** client makes a request to the Series API
- **THEN** it SHALL use base URL `https://apis.cbs.gov.il/series/` with `format=json`

#### Scenario: Price Index API call
- **WHEN** client makes a request to the Price Index API
- **THEN** it SHALL use base URL `https://api.cbs.gov.il/index/` with `format=json`

#### Scenario: Dictionary API call
- **WHEN** client makes a request to the Dictionary API
- **THEN** it SHALL use base URL `https://api.cbs.gov.il/dictionary/` with `format=json`
