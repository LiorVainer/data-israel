# Tasks: Expand Admin Model Config to All Agents with Bulk Operations

## 1.0 Backend — Convex Bulk Mutation

- [x] 1.1 Add `bulkUpsert` mutation to `convex/aiModels.ts` — accepts `{ agentIds: string[], modelId: string }`, admin-guarded, upserts all in one transaction
- [x] 1.2 Verify existing `upsert` and `getAll` continue to work unchanged

## 2.0 Constants — Dynamic Agent Configs from Registry

- [x] 2.1 Refactor `src/constants/admin.ts` to derive agent configs from `AgentsDisplayMap` in the registry
- [x] 2.2 Export `ROUTING_AGENT_CONFIG` (single config for routing agent)
- [x] 2.3 Export `SUB_AGENT_CONFIGS` (array derived from registry entries with `dataSource` field)
- [x] 2.4 Export `ALL_AGENT_CONFIGS` combining routing + sub-agents
- [x] 2.5 Change `AgentId` type to `string` (dynamic, no longer a narrow union)
- [x] 2.6 Verify `getModelDisplay` and `formatPrice` helpers remain unchanged

## 3.0 Admin Page — Dynamic Agent List + Bulk Operations

- [x] 3.1 Update `selectedModels` state to initialize from all agent configs (not just 3)
- [x] 3.2 Update Convex sync `useEffect` to handle all dynamic agent IDs
- [x] 3.3 Render individual model picker cards for all agents (routing first, then sub-agents)
- [x] 3.4 Add "Bulk Operations" section with two model picker cards:
  - "החל על כל סוכני המידע" (Apply to all sub-agents) — triggers `bulkUpsert` with all sub-agent IDs
  - "החל על כל הסוכנים" (Apply to all agents) — triggers `bulkUpsert` with routing + all sub-agent IDs
- [x] 3.5 Wire bulk model picks to `bulkUpsert` mutation with confirmation dialog
- [x] 3.6 On bulk confirm, update all affected `selectedModels` entries locally (optimistic update)

## 4.0 Confirm Dialog — Bulk Change Support

- [x] 4.1 Update `ConfirmModelChangeDialog` to accept bulk changes (array of agent IDs)
- [x] 4.2 Show list of affected agent names when bulk change is pending
- [x] 4.3 Keep single-agent confirm behavior unchanged (backward compatible)

## 5.0 Verification

- [x] 5.1 Run `tsc` — no type errors
- [x] 5.2 Run `npm run lint` — no lint errors (only pre-existing warnings)
- [ ] 5.3 Manually verify: admin page shows all 9 agents with model pickers
- [ ] 5.4 Manually verify: bulk "all sub-agents" updates 8 agents in Convex
- [ ] 5.5 Manually verify: bulk "all agents" updates 9 agents in Convex
- [ ] 5.6 Manually verify: individual agent model changes still work
