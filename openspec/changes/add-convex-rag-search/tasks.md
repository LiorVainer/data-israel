# Tasks: Add Convex RAG Search

## 1. Convex Setup
- [x] 1.1 Install Convex dependencies (`convex`, `@convex-dev/rag`)
- [x] 1.2 Initialize Convex project with deployment URL `https://decisive-alpaca-889.convex.cloud`
- [x] 1.3 Configure Convex in `convex/convex.config.ts` with RAG component
- [x] 1.4 Verify `OPENROUTER_API_KEY` environment variable exists (reuse from chat)
- [x] 1.5 Run `npx convex codegen` to generate types

## 2. Database Schema
- [x] 2.1 Create `convex/schema.ts` with datasets table
- [x] 2.2 Add resources table with datasetId foreign key
- [x] 2.3 Define indexes for efficient queries (by_ckan_id, by_dataset)
- [x] 2.4 Run `npx convex dev` to deploy schema

## 3. RAG Configuration
- [x] 3.1 Create `convex/rag.ts` with RAG instance configuration
- [x] 3.2 Define filter types for organization, tags, format
- [x] 3.3 Set up OpenRouter embedding model (`openrouter.textEmbeddingModel("openai/text-embedding-3-small")`, 1536 dimensions)
- [x] 3.4 Configure namespaces for datasets and resources

## 4. Convex Functions
- [x] 4.1 Create `convex/datasets.ts` with CRUD operations
- [x] 4.2 Create `convex/resources.ts` with CRUD operations
- [x] 4.3 Create `convex/search.ts` with RAG search actions
- [x] 4.4 Add semantic search for datasets with filters
- [x] 4.5 Add semantic search for resources with datasetId filter

## 5. Data Sync
- [x] 5.1 Create `scripts/sync-to-convex.ts` to upload datasets
- [x] 5.2 Add batch processing for large dataset counts
- [x] 5.3 Add RAG indexing for dataset text (title, notes, tags)
- [x] 5.4 Add resource sync with datasetId linking
- [ ] 5.5 Add RAG indexing for resource text (name, description)
- [x] 5.6 Add progress logging and error handling

## 6. Tool Migration
- [x] 6.1 Create Convex client wrapper in `lib/convex/client.ts`
- [x] 6.2 Update `lib/tools/search-datasets.ts` to use Convex RAG
- [x] 6.3 Update `lib/tools/search-resources.ts` to use Convex RAG
- [x] 6.4 Maintain backward-compatible response format
- [x] 6.5 Add fallback to CKAN API if Convex unavailable

## 7. Testing & Verification
- [ ] 7.1 Run initial data sync from data.gov.il
- [ ] 7.2 Test semantic search with Hebrew queries
- [ ] 7.3 Test filtered search (by organization, tags, format)
- [ ] 7.4 Test resource search by datasetId
- [ ] 7.5 Verify agent can use updated tools
- [x] 7.6 Run `npm run build && npm run lint && npm run vibecheck`

## 8. Documentation
- [ ] 8.1 Update CLAUDE.md with Convex setup instructions
- [ ] 8.2 Add .env.example with new environment variables
- [ ] 8.3 Document sync script usage
- [ ] 8.4 Archive this change after deployment
