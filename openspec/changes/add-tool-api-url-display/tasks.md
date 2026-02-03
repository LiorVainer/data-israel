# Tasks: Add API URL Display to Tool Calls

## 1. Create Endpoint Constants

### 1.1 CBS Endpoints
- [x] 1.1.1 Create `lib/api/cbs/endpoints.ts` with `CBS_ENDPOINTS` constant
- [x] 1.1.2 Add base URLs for series, priceIndex, and dictionary APIs
- [x] 1.1.3 Add all endpoint paths as constants
- [x] 1.1.4 Add `buildCbsUrl()` helper function for URL construction
- [x] 1.1.5 Export types for endpoint parameters

### 1.2 DataGov Endpoints
- [x] 1.2.1 Create `lib/api/data-gov/endpoints.ts` with `DATAGOV_ENDPOINTS` constant
- [x] 1.2.2 Add base URL and all CKAN action endpoints
- [x] 1.2.3 Add `buildDataGovUrl()` helper function for URL construction

## 2. Update CBS Tools (8 tools)

### 2.1 Series Tools
- [x] 2.1.1 Update `browse-cbs-catalog.ts` output schema with `apiUrl`
- [x] 2.1.2 Update `browse-cbs-catalog.ts` execute to construct and return URL
- [x] 2.1.3 Update `browse-cbs-catalog-path.ts` output schema with `apiUrl`
- [x] 2.1.4 Update `browse-cbs-catalog-path.ts` execute to construct and return URL
- [x] 2.1.5 Update `get-cbs-series-data.ts` input schema with `searchedResourceName` (optional, Hebrew display name of the series)
- [x] 2.1.6 Update `get-cbs-series-data.ts` output schema with `apiUrl` and `searchedResourceName`
- [x] 2.1.7 Update `get-cbs-series-data.ts` execute to construct and return URL, pass through searchedResourceName
- [x] 2.1.8 Update `get-cbs-series-data-by-path.ts` input schema with `searchedResourceName`
- [x] 2.1.9 Update `get-cbs-series-data-by-path.ts` output schema with `apiUrl` and `searchedResourceName`
- [x] 2.1.10 Update `get-cbs-series-data-by-path.ts` execute to construct and return URL, pass through searchedResourceName

### 2.2 Price Index Tools
- [x] 2.2.1 Update `browse-cbs-price-indices.ts` output schema with `apiUrl`
- [x] 2.2.2 Update `browse-cbs-price-indices.ts` execute to construct and return URL
- [x] 2.2.3 Update `get-cbs-price-data.ts` input schema with `searchedResourceName` (optional, Hebrew name of the price index)
- [x] 2.2.4 Update `get-cbs-price-data.ts` output schema with `apiUrl` and `searchedResourceName`
- [x] 2.2.5 Update `get-cbs-price-data.ts` execute to construct and return URL, pass through searchedResourceName
- [x] 2.2.6 Update `calculate-cbs-price-index.ts` input schema with `searchedResourceName`
- [x] 2.2.7 Update `calculate-cbs-price-index.ts` output schema with `apiUrl` and `searchedResourceName`
- [x] 2.2.8 Update `calculate-cbs-price-index.ts` execute to construct and return URL, pass through searchedResourceName

### 2.3 Dictionary Tools
- [x] 2.3.1 Update `search-cbs-localities.ts` output schema with `apiUrl`
- [x] 2.3.2 Update `search-cbs-localities.ts` execute to construct and return URL

## 3. Update DataGov Tools (15 tools)

### 3.1 Dataset Tools
- [x] 3.1.1 Update `search-datasets.ts` output schema with `apiUrl`
- [x] 3.1.2 Update `search-datasets.ts` execute to construct and return URL
- [x] 3.1.3 Update `list-all-datasets.ts` output schema with `apiUrl`
- [x] 3.1.4 Update `list-all-datasets.ts` execute to construct and return URL
- [x] 3.1.5 Update `get-dataset-details.ts` input schema with `searchedResourceName` (optional, Hebrew title of the dataset)
- [x] 3.1.6 Update `get-dataset-details.ts` output schema with `apiUrl` and `searchedResourceName`
- [x] 3.1.7 Update `get-dataset-details.ts` execute to construct and return URL, pass through searchedResourceName
- [x] 3.1.8 Update `get-dataset-schema.ts` output schema with `apiUrl`
- [x] 3.1.9 Update `get-dataset-schema.ts` execute to construct and return URL
- [x] 3.1.10 Update `get-dataset-activity.ts` input schema with `searchedResourceName` (optional, Hebrew title of the dataset)
- [x] 3.1.11 Update `get-dataset-activity.ts` output schema with `apiUrl` and `searchedResourceName`
- [x] 3.1.12 Update `get-dataset-activity.ts` execute to construct and return URL, pass through searchedResourceName

### 3.2 Resource Tools
- [x] 3.2.1 Update `search-resources.ts` output schema with `apiUrl`
- [x] 3.2.2 Update `search-resources.ts` execute to construct and return URL
- [x] 3.2.3 Update `get-resource-details.ts` input schema with `searchedResourceName` (optional, Hebrew name of the resource)
- [x] 3.2.4 Update `get-resource-details.ts` output schema with `apiUrl` and `searchedResourceName`
- [x] 3.2.5 Update `get-resource-details.ts` execute to construct and return URL, pass through searchedResourceName
- [x] 3.2.6 Update `query-datastore-resource.ts` input schema with `searchedResourceName` (optional, Hebrew name of the resource being queried)
- [x] 3.2.7 Update `query-datastore-resource.ts` output schema with `apiUrl` and `searchedResourceName`
- [x] 3.2.8 Update `query-datastore-resource.ts` execute to construct and return URL, pass through searchedResourceName

### 3.3 Organization Tools
- [x] 3.3.1 Update `list-organizations.ts` output schema with `apiUrl`
- [x] 3.3.2 Update `list-organizations.ts` execute to construct and return URL
- [x] 3.3.3 Update `get-organization-details.ts` input schema with `searchedResourceName` (optional, Hebrew name of the organization)
- [x] 3.3.4 Update `get-organization-details.ts` output schema with `apiUrl` and `searchedResourceName`
- [x] 3.3.5 Update `get-organization-details.ts` execute to construct and return URL, pass through searchedResourceName
- [x] 3.3.6 Update `get-organization-activity.ts` input schema with `searchedResourceName` (optional, Hebrew name of the organization)
- [x] 3.3.7 Update `get-organization-activity.ts` output schema with `apiUrl` and `searchedResourceName`
- [x] 3.3.8 Update `get-organization-activity.ts` execute to construct and return URL, pass through searchedResourceName

### 3.4 Group/Tag Tools
- [x] 3.4.1 Update `list-groups.ts` output schema with `apiUrl`
- [x] 3.4.2 Update `list-groups.ts` execute to construct and return URL
- [x] 3.4.3 Update `list-tags.ts` output schema with `apiUrl`
- [x] 3.4.4 Update `list-tags.ts` execute to construct and return URL
- [x] 3.4.5 Update `list-licenses.ts` output schema with `apiUrl` (if exists)
- [x] 3.4.6 Update `list-licenses.ts` execute to construct and return URL (if exists)

### 3.5 System Tools
- [x] 3.5.1 Update `get-status.ts` output schema with `apiUrl`
- [x] 3.5.2 Update `get-status.ts` execute to construct and return URL

## 4. Update Chat UI Components

### 4.1 Type Definitions
- [x] 4.1.1 Update `components/chat/types.ts` to extract `apiUrl` and `searchedResourceName` from tool output

### 4.2 Tool Call Display
- [x] 4.2.1 Update `GroupedToolCall` interface to include `apiUrls: string[]` and `resourceNames: string[]`
- [x] 4.2.2 Update `groupToolCalls()` in `ToolCallParts.tsx` to collect URLs and resource names from tool outputs
- [x] 4.2.3 Update `ToolCallStep.tsx` to render URLs using `ChainOfThoughtSearchResults`
- [x] 4.2.4 Display `searchedResourceName` as badge label when available (Hebrew display name)
- [x] 4.2.5 Make URLs clickable with external link behavior
- [x] 4.2.6 Show resource name in badge, URL accessible on click/hover

## 5. Verification
- [x] 5.1 Run `npm run build` to verify no TypeScript errors
- [x] 5.2 Run `npm run lint` to verify no linting issues (fixed with --fix)
- [ ] 5.3 Run `npm run vibecheck` for code quality (skipped - tool not installed)
- [ ] 5.4 Manual test: Verify URLs display correctly for CBS tools
- [ ] 5.5 Manual test: Verify URLs display correctly for DataGov tools
- [ ] 5.6 Manual test: Verify searchedResourceName displays as badge label
- [ ] 5.7 Manual test: Verify failed tool calls still show attempted URL
