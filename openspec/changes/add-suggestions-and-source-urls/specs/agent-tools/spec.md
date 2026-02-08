## ADDED Requirements

### Requirement: Follow-Up Suggestions Tool
The system SHALL provide a `suggestFollowUps` client-side tool that the agent calls at the end of every response to generate context-aware follow-up suggestions in Hebrew.

The tool input schema SHALL accept:
- `suggestions`: Array of 2-4 Hebrew strings representing follow-up questions or actions

The tool SHALL be registered as a client tool (alongside chart tools) so it renders custom UI without server-side execution.

The agent instructions SHALL mandate calling this tool at the end of every response.

#### Scenario: Agent provides suggestions after data query
- **WHEN** the user asks "מהן 5 הערים הגדולות בישראל?" and the agent responds
- **THEN** the agent calls `suggestFollowUps` with suggestions like ["השווה בין הערים לפי צפיפות אוכלוסייה", "הצג גרף של גודל האוכלוסייה", "מהם היישובים עם הדירוג הסוציו-אקונומי הגבוה?"]

#### Scenario: Suggestions are contextually relevant
- **WHEN** the agent responds about CBS price indices
- **THEN** the suggestions SHALL relate to the topic (e.g., "חשב הצמדה למדד", "הצג מגמת מחירים בגרף", "השווה בין מדדים שונים")

### Requirement: DataGov Portal Source URL Tool
The system SHALL provide a `generateDataGovSourceUrl` server-side tool that constructs human-readable data.gov.il portal URLs for datasets and resources.

The tool input schema SHALL accept:
- `datasetName`: Dataset slug/name (required)
- `resourceId`: Resource UUID (optional)
- `query`: Search query within the resource (optional)
- `title`: Hebrew display title for the source link (required)

The tool SHALL return:
- `url`: Constructed portal URL following the pattern `https://data.gov.il/dataset/{datasetName}/resource/{resourceId}?query={query}`
- `title`: The provided Hebrew title
- `success`: Boolean indicating URL construction succeeded

#### Scenario: Generate URL for dataset resource with query
- **WHEN** the agent calls `generateDataGovSourceUrl` with `{ datasetName: "orl-prices", resourceId: "aaa40832-ac82-4c86-bac6-0d05c83f576f", query: "2000", title: "מחירי אורל - 2000" }`
- **THEN** the tool returns `{ url: "https://data.gov.il/dataset/orl-prices/resource/aaa40832-ac82-4c86-bac6-0d05c83f576f?query=2000", title: "מחירי אורל - 2000", success: true }`

#### Scenario: Generate URL for dataset without resource
- **WHEN** the agent calls `generateDataGovSourceUrl` with `{ datasetName: "roads-br7", title: "נתוני כבישים" }`
- **THEN** the tool returns `{ url: "https://data.gov.il/dataset/roads-br7", title: "נתוני כבישים", success: true }`

### Requirement: CBS Portal Source URL Tool
The system SHALL provide a `generateCbsSourceUrl` server-side tool that constructs CBS portal or API URLs for statistical data sources.

The tool input schema SHALL accept:
- `sourceType`: One of `"series"`, `"price-index"`, or `"localities"` (required)
- `seriesId`: Series code for series data (optional, required when sourceType is "series")
- `indexId`: Price index code (optional, required when sourceType is "price-index")
- `query`: Search term for localities (optional)
- `title`: Hebrew display title for the source link (required)

The tool SHALL return:
- `url`: Constructed CBS URL (API URL with `format=json` for direct data access, or CBS portal page URL)
- `title`: The provided Hebrew title
- `success`: Boolean indicating URL construction succeeded

#### Scenario: Generate URL for CBS series data
- **WHEN** the agent calls `generateCbsSourceUrl` with `{ sourceType: "series", seriesId: "123456", title: "נתוני אוכלוסייה" }`
- **THEN** the tool returns `{ url: "https://apis.cbs.gov.il/series/data/list?format=json&id=123456&lang=he", title: "נתוני אוכלוסייה", success: true }`

#### Scenario: Generate URL for CBS price index
- **WHEN** the agent calls `generateCbsSourceUrl` with `{ sourceType: "price-index", indexId: "120010", title: "מדד המחירים לצרכן" }`
- **THEN** the tool returns `{ url: "https://api.cbs.gov.il/index/data/price?format=json&id=120010&lang=he", title: "מדד המחירים לצרכן", success: true }`

#### Scenario: Generate URL for CBS localities
- **WHEN** the agent calls `generateCbsSourceUrl` with `{ sourceType: "localities", query: "תל אביב", title: "נתוני יישוב - תל אביב" }`
- **THEN** the tool returns `{ url: "https://api.cbs.gov.il/dictionary/geo/localities?format=json&q=תל אביב&lang=he", title: "נתוני יישוב - תל אביב", success: true }`
