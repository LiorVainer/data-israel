## Context
The CBS API consists of 3 separate sub-APIs with different base URLs but similar parameter conventions. All support `format=json`.

## Goals / Non-Goals
- Goals: Typed client for all 3 sub-APIs, 6 agent tools, swagger.json artifact
- Non-Goals: Authentication (CBS API is public), caching, rate limiting

## Decisions
- **3 axios instances**: Each sub-API has a different base URL, so we use separate instances rather than a single one with path switching. This mirrors the data-gov pattern of one instance per API.
- **Namespaced client object**: `cbsApi.series.*`, `cbsApi.priceIndex.*`, `cbsApi.dictionary.*` — consistent with `dataGovApi.dataset.*` pattern.
- **JSON format forced**: All requests include `format: 'json'` as default param on axios instance, since we always want JSON.
- **No response wrapper unwrapping**: Unlike CKAN which wraps in `{ success, result }`, CBS returns data directly. The generic GET helper just returns `response.data`.

## Risks / Trade-offs
- CBS API may have different response shapes than documented — mitigated by loose typing with optional fields
- 3 base URLs means 3 axios instances — acceptable complexity for clean separation
