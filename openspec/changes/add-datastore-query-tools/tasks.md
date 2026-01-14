# Implementation Tasks

## 1. API Client Enhancement
- [x] 1.1 Add `datastore.search()` method to CKAN API client
- [x] 1.2 Define TypeScript interfaces for datastore search request/response
- [x] 1.3 Add Zod schemas for datastore API responses

## 2. Tool Implementation
- [x] 2.1 Create `lib/tools/query-datastore-resource.ts`
- [x] 2.2 Define Zod input schema with resource_id, filters, limit, offset, sort
- [x] 2.3 Implement execute function with API call
- [x] 2.4 Add structured error handling
- [x] 2.5 Export tool from `lib/tools/index.ts`

## 3. Agent Registration
- [x] 3.1 Import new tool in `agents/data-agent.ts`
- [x] 3.2 Add tool to agent's tools object
- [x] 3.3 Update agent instructions to mention datastore querying capability

## 4. Testing & Validation
- [x] 4.1 Run `tsc` to verify no TypeScript errors
- [x] 4.2 Run `npm run build` to verify compilation
- [x] 4.3 Run `npm run lint` to check code quality
- [x] 4.4 Run `npm run vibecheck` for code quality validation
- [ ] 4.5 Test tool in chat UI with sample resource queries

## 5. Documentation
- [x] 5.1 Update CLAUDE.md if needed with new tool patterns
- [x] 5.2 Mark tasks as complete in this file
