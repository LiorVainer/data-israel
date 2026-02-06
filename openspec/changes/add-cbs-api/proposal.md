# Change: Add Israel CBS (Central Bureau of Statistics) API Integration

## Why
The agent currently only accesses data.gov.il (CKAN). Adding the CBS API unlocks Israel's official statistical time series, price/CPI indices, and geographic dictionaries — significantly expanding what users can query.

## What Changes
- New API client layer (`lib/api/cbs/`) with typed axios clients for 3 CBS sub-APIs
- 6 new agent tools for browsing catalogs, fetching series data, price indices, CPI calculations, and locality lookups
- Agent instructions updated to mention CBS data source
- OpenAPI 3.0 swagger.json artifact for future reference

## Impact
- Affected specs: `agent-tools`
- Affected code: `lib/api/cbs/`, `lib/tools/`, `agents/data-agent.ts`
- No breaking changes to existing functionality
