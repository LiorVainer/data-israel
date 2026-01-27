# Design: Convex RAG Integration

## Context

The project needs semantic search capabilities for Israeli open datasets. Convex provides a reactive database with built-in RAG component that can handle:

**Convex Deployment**: `https://decisive-alpaca-889.convex.cloud`
- Vector embeddings for semantic similarity
- Real-time queries with TypeScript type safety
- Filtered search with AND/OR logic
- Namespace organization

### Stakeholders
- End users: Benefit from better search results
- Developers: Need to maintain Convex schema and sync scripts
- Operations: Need to manage Convex deployment and data freshness

## Goals / Non-Goals

### Goals
- Enable semantic search for datasets and resources
- Maintain relationship between datasets and resources via `datasetId`
- Support filtering by organization, tags, and format
- Provide faster search than external API calls
- Keep existing tool interface (drop-in replacement)

### Non-Goals
- Real-time sync with data.gov.il (manual/scheduled sync is acceptable)
- Full CKAN API feature parity (only search tools affected)
- Custom embedding model training (use off-the-shelf models)
- Replace all CKAN API tools (only search tools)

## Decisions

### Decision 1: Use Convex + RAG Component
**What**: Use `@convex-dev/rag` component instead of custom vector DB
**Why**:
- Tightly integrated with Convex (no separate vector store)
- Handles chunking, embedding, and search in one package
- TypeScript-first with type-safe filters
- Built-in namespace support for multi-tenant scenarios

**Alternatives considered**:
- Pinecone + Convex: More operational complexity, separate billing
- pgvector + Supabase: Less TypeScript integration, different auth model
- Elasticsearch: Overkill for this use case, expensive to host

### Decision 2: Denormalized Resources in RAG
**What**: Store resources as separate RAG entries linked by `datasetId` filter
**Why**:
- Enables direct resource search without joining
- Filters allow scoping to specific dataset's resources
- Maintains flexibility for resource-only queries

**Schema approach**:
```typescript
// Convex tables (for metadata/relationships)
datasets: defineTable({
  ckanId: v.string(),        // Original data.gov.il ID
  title: v.string(),
  name: v.string(),
  notes: v.optional(v.string()),
  organizationId: v.optional(v.string()),
  organizationTitle: v.optional(v.string()),
  tags: v.array(v.string()),
  metadataCreated: v.optional(v.string()),
  metadataModified: v.optional(v.string()),
}).index("by_ckan_id", ["ckanId"]),

resources: defineTable({
  ckanId: v.string(),        // Original resource ID
  datasetId: v.id("datasets"), // Foreign key
  name: v.optional(v.string()),
  url: v.string(),
  format: v.string(),
  description: v.optional(v.string()),
}).index("by_dataset", ["datasetId"])
  .index("by_ckan_id", ["ckanId"]),
```

### Decision 3: OpenRouter Embeddings via AI SDK
**What**: Use OpenRouter's embedding API with `@openrouter/ai-sdk-provider` (same provider used for chat)
**Why**:
- Consistent with existing chat model setup in `data-agent.ts`
- Single API key (`OPENROUTER_API_KEY`) for both chat and embeddings
- Access to multiple embedding models (e.g., `openai/text-embedding-3-small`)
- No additional vendor/API key needed

**Implementation**:
```typescript
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// For RAG component
const rag = new RAG(components.rag, {
  textEmbeddingModel: openrouter.embedding("openai/text-embedding-3-small"),
  embeddingDimension: 1536,
});
```

**Alternatives considered**:
- Direct OpenAI API: Requires separate API key, additional vendor
- Cohere multilingual: Good Hebrew support but different auth flow
- Local models: Requires GPU, operational complexity

### Decision 4: Filter-Based Search Architecture
**What**: Use RAG filters for organization, tags, and format
**Why**:
- Enables combined semantic + metadata filtering
- Type-safe filter definitions
- Efficient index-based filtering in Convex

**Filter types**:
```typescript
type DatasetFilters = {
  organization: string;
  tag: string;
};

type ResourceFilters = {
  datasetId: string;
  format: string;
};
```

## Risks / Trade-offs

### Risk: Data Freshness
- **Problem**: Convex data may become stale vs. live CKAN API
- **Mitigation**:
  - Add `lastSyncedAt` metadata
  - Provide manual sync command
  - Consider scheduled sync (cron job)
  - Show "last updated" in search results

### Risk: Embedding Costs
- **Problem**: OpenAI embedding API costs for large datasets
- **Mitigation**:
  - Only embed once during sync (not per query)
  - Batch embedding requests
  - Consider caching unchanged documents
  - Monitor token usage

### Risk: Cold Start
- **Problem**: Search won't work until initial sync completes
- **Mitigation**:
  - Clear error message when no data
  - Document setup steps
  - Provide seed data for testing

### Trade-off: Consistency vs. Performance
- **Trade-off**: Local data may differ from live CKAN
- **Chosen approach**: Performance (local queries) over real-time consistency
- **Rationale**: Dataset metadata changes infrequently; faster UX worth the trade-off

## Migration Plan

### Phase 1: Setup (Non-Breaking)
1. Install Convex dependencies
2. Create Convex project and configure
3. Define schema and RAG component
4. Add sync script

### Phase 2: Parallel Run
1. Keep existing CKAN tools working
2. Add new Convex-based tools as separate functions
3. Test semantic search quality
4. Compare results with CKAN search

### Phase 3: Switchover
1. Update `searchDatasets` to use Convex RAG
2. Update `searchResources` to use Convex RAG
3. Keep CKAN client for other tools (getDatasetDetails, etc.)
4. Document breaking changes

### Rollback
- Revert to CKAN API by restoring original tool implementations
- No data migration needed (Convex is additive)
- Keep Convex schema for future use

## Open Questions

1. **Sync frequency**: How often should data be refreshed? Daily? Weekly? Manual only?
2. **Embedding model**: Should we support alternative embedding providers for cost optimization?
3. **Partial sync**: Should we support incremental sync based on `metadata_modified`?
4. **Search result ranking**: How to balance semantic similarity with recency/popularity?
