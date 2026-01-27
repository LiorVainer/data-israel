# Change: Add Convex RAG for Semantic Dataset Search

## Why

The current `searchDatasets` and `searchResources` tools rely on the data.gov.il CKAN API's basic keyword search, which has limitations:
- No semantic understanding (exact keyword matching only)
- No vector similarity search
- Each search requires external API calls with latency
- No offline capability or caching layer

By storing datasets and resources in Convex with RAG (Retrieval-Augmented Generation) embeddings, we can provide:
- **Semantic search**: Find datasets by meaning, not just keywords
- **Faster queries**: Local database queries instead of external API calls
- **Better Hebrew support**: Embeddings can understand Hebrew text semantically
- **Rich filtering**: Combine semantic search with metadata filters (organization, tags, format)

## What Changes

1. **Add Convex backend** with two tables:
   - `datasets` - Stores all dataset metadata from data.gov.il
   - `resources` - Stores resource metadata with `datasetId` foreign key

2. **Add Convex RAG component** for semantic search:
   - Index dataset titles, descriptions, and tags
   - Index resource names and descriptions
   - Enable filtered search by organization, tags, format

3. **Replace search tools** with Convex RAG queries:
   - `searchDatasets` → Query Convex RAG with semantic search
   - `searchResources` → Query Convex RAG with datasetId filtering

4. **Add data sync script** to populate Convex from data.gov.il:
   - Fetch all datasets using existing `fetch-all-datasets.ts`
   - Upload to Convex with embeddings

## Impact

- **Affected specs**: `agent-tools` (MODIFIED: search tools)
- **New specs**: `convex-data-store` (ADDED: tables and RAG)
- **Affected code**:
  - `lib/tools/search-datasets.ts` - Replace CKAN API with Convex RAG
  - `lib/tools/search-resources.ts` - Replace CKAN API with Convex RAG
  - `convex/` - New Convex backend (schema, functions, RAG config)
  - `scripts/` - New sync scripts
- **Dependencies**: Add `convex`, `@convex-dev/rag`
- **Environment**: Uses existing `OPENROUTER_API_KEY` for embeddings (same as chat model)

## **BREAKING** Changes

- `searchDatasets` will return results from local Convex database, not live CKAN API
- `searchResources` will return results from local Convex database
- Initial data sync required before search works
- Convex deployment URL: `https://decisive-alpaca-889.convex.cloud`
