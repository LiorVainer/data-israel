## Context

The admin model config panel was built with 3 hardcoded agents. The system now has 9 agents (1 routing + 8 data-source sub-agents) and a registry that dynamically tracks all data sources. This change makes the admin panel registry-driven and adds bulk operations.

## Goals / Non-Goals

- **Goals:**
  - Admin panel lists all agents dynamically from the registry
  - Adding a new data source auto-adds its agent to the admin panel
  - Bulk-apply a model to all sub-agents (8 data-source agents)
  - Bulk-apply a model to all agents (routing + 8 sub-agents)
  - Bulk operations use the same model picker UI as individual agents
  - Bulk changes are confirmed via a dialog showing affected agents

- **Non-Goals:**
  - Per-tool model configuration (models are per-agent only)
  - Model presets or saved configurations
  - Undo/rollback for model changes

## Decisions

### Dynamic Agent List from Registry

- **Decision:** Derive `AGENT_CONFIGS` from `AgentsDisplayMap` in `registry.ts` instead of hardcoding.
- **Why:** `AgentsDisplayMap` already contains all agent IDs, labels, and icons. It's maintained alongside data source definitions, so new sources automatically appear.
- **Implementation:** Split into `ROUTING_AGENT_CONFIG` (single) and `SUB_AGENT_CONFIGS` (array derived from registry entries that have a `dataSource`). `ALL_AGENT_CONFIGS` = routing + sub-agents.

### AgentId Type Becomes a String

- **Decision:** Change `AgentId` from a narrow literal union (`'routing' | 'datagov' | 'cbs'`) to `string` since it's now dynamic.
- **Why:** The registry-driven list means agent IDs are only known at runtime. The Convex `ai_models` table already stores `agentId` as `v.string()`, so no schema change needed.

### Bulk Upsert as Single Convex Mutation

- **Decision:** Add a `bulkUpsert` mutation in `convex/aiModels.ts` that loops through agent IDs and upserts each in one transaction.
- **Why:** Convex mutations are transactional — if any upsert fails, none are applied. This gives atomic bulk updates. Alternative of calling `upsert` N times from the client would be non-atomic and chatty.
- **Trade-off:** Convex mutations have a time limit, but upserting 9 records is fast.

### Bulk UI as Separate Sections

- **Decision:** Add two separate model picker cards above the individual agent cards: "Apply to all sub-agents" and "Apply to all agents". These use the same `ModelPickerDialog` but trigger `bulkUpsert`.
- **Why:** Keeps the UI consistent — same interaction pattern (click → pick model → confirm). The bulk sections are visually distinct (grouped in a separate "Bulk Operations" area) so admins understand the scope.
- **Alternative considered:** A "select all" checkbox approach — rejected because it adds selection state complexity and doesn't match the existing card-per-agent pattern.

### Confirm Dialog Shows Affected Agents

- **Decision:** When a bulk change is pending, the `ConfirmModelChangeDialog` shows the list of agent names that will be affected.
- **Why:** Bulk operations are high-impact. The admin should see exactly which agents will change before confirming.

## Risks / Trade-offs

- **Dynamic list ordering:** Agents appear in registry insertion order. This is currently stable (the `DATA_SOURCE_METAS` array is ordered). If order changes, admin panel order changes. Acceptable.
- **No "current model" for bulk:** The bulk picker has no single "current model" to show since each agent may have a different model. The picker opens with no pre-selection. After applying, individual cards update to reflect the new model.
