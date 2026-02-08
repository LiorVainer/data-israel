## Context

The application is an Israeli open data AI agent that retrieves data from data.gov.il (CKAN API) and CBS (Central Bureau of Statistics). Users interact via a streaming chat interface. Currently:
- The agent provides answers but no follow-up suggestions
- Data sources are shown as API URLs (not human-friendly portal URLs)
- The Suggestions component only renders hardcoded prompts on the landing page

## Goals / Non-Goals

### Goals
- Agent generates context-aware follow-up suggestions after every response
- Users can click suggestions to immediately submit them as queries
- Users get clickable portal URLs to verify/explore data in original portals
- Sources display using existing ai-elements Sources component

### Non-Goals
- Inline citations within response text (future enhancement)
- Automatically generating source URLs without agent explicitly calling tools
- Changing the existing tool result summarization pipeline

## Decisions

### Decision 1: Suggestions as a Client Tool

**What**: Create `suggestFollowUps` as a client-side tool (same category as chart display tools).

**Why**: Client tools render custom UI without executing server-side. The agent generates the suggestions content, and the frontend renders them as interactive buttons. This follows the existing pattern for chart tools (`displayBarChart`, `displayLineChart`, `displayPieChart`).

**Alternatives considered**:
- **Custom data parts**: Could use AI SDK's data parts to stream suggestions. Rejected because this doesn't integrate with the Mastra agent framework cleanly.
- **Post-processing on frontend**: Could generate suggestions client-side. Rejected because the agent has the best context for relevant follow-ups.
- **Separate API endpoint**: Could have a dedicated suggestions endpoint. Rejected as over-engineering - a tool call is simpler and leverages existing infrastructure.

### Decision 2: Source URL Tools as Server Tools

**What**: Create `generateDataGovSourceUrl` and `generateCbsSourceUrl` as server-side tools (like existing data tools).

**Why**: These tools construct portal URLs from dataset/resource metadata. They need access to the URL building utilities already available server-side. The agent calls them after data retrieval to include source links.

**Alternatives considered**:
- **Modify existing tools to return portal URLs**: Would add `portalUrl` to every existing tool output. Rejected because it would require modifying 23 existing tools and would add URLs even when unnecessary.
- **Client-side URL construction**: Could build portal URLs in the frontend from tool result data. Rejected because the frontend doesn't have the full context (group name, dataset slug) needed to construct portal URLs.

### Decision 3: Extract Source URLs from Tool Results

**What**: In MessageItem, extract `url` and `title` from the output of `generateDataGovSourceUrl` and `generateCbsSourceUrl` tool results and merge them with existing `source-url` message parts for rendering via SourcesPart.

**Why**: This reuses the existing SourcesPart component and ai-elements Sources UI without needing changes to the stream protocol. The tool results are already available in message parts.

### Decision 4: Suggestions Rendering Location

**What**: Render suggestions below the conversation in ChatThread (not inside MessageItem).

**Why**: Suggestions should only appear after the last assistant message, not on every message. They should be positioned near the input area for easy interaction. They disappear when a new message is sent.

## URL Patterns

### data.gov.il Portal URLs

Based on the CKAN portal structure:
```
# Dataset page (Hebrew)
https://data.gov.il/dataset/{dataset-name}

# Resource within dataset
https://data.gov.il/dataset/{dataset-name}/resource/{resource-id}

# Resource with query filter
https://data.gov.il/dataset/{dataset-name}/resource/{resource-id}?query={search-term}

# Organization page
https://data.gov.il/organization/{organization-id}
```

The tool will construct these from dataset metadata already retrieved by other tools.

### CBS Portal/API URLs

CBS doesn't have a CKAN-like data viewer. Source URLs will be:
```
# Series data (API - viewable in browser as JSON)
https://apis.cbs.gov.il/series/data/list?format=json&id={seriesId}&lang=he

# Price index data
https://api.cbs.gov.il/index/data/price?format=json&id={indexId}&lang=he

# CBS statistics website (general)
https://www.cbs.gov.il/he/Statistics/Pages/Generators/Time-Series-DataBank.aspx

# CBS price indices page
https://www.cbs.gov.il/he/Statistics/Pages/Generators/Database-of-Prices-and-Price-Indices.aspx
```

## Risks / Trade-offs

- **Risk**: Agent may not always call `suggestFollowUps` despite instructions
  - Mitigation: Strong instruction emphasis + StopCondition can be adjusted if needed
- **Risk**: data.gov.il portal URL pattern may not be 100% reliable for all datasets
  - Mitigation: Include fallback to API URL if portal URL construction fails
- **Risk**: CBS has no user-friendly data viewer, so API URLs may confuse non-technical users
  - Mitigation: For CBS, link to the general statistics page + API URL as secondary source

## Open Questions

- Should suggestions be limited to a max count (3-4) to avoid UI clutter? → Yes, 2-4
- Should source URLs open in new tab? → Yes (existing Source component already does target="_blank")
