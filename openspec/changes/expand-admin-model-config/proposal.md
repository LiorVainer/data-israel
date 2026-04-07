# Change: Expand Admin Model Config to All Agents with Bulk Operations

## Why

The admin panel currently hardcodes model configuration for only 3 agents (routing, datagov, cbs). The system has grown to 9 agents (routing + 8 data-source sub-agents). Operators need to:
1. Configure models for **every** agent, not just the original three
2. Bulk-apply a model to all sub-agents at once
3. Bulk-apply a model to all agents (routing + all sub-agents) at once

The agent list should be **dynamically derived** from the data source registry so that adding a new data source automatically adds it to the admin panel with no code changes needed.

## What Changes

- **`constants/admin.ts`**: Replace hardcoded 3-agent `AGENT_CONFIGS` with a dynamic derivation from `AgentsDisplayMap` in the registry. Separate routing agent from sub-agents. Add virtual "bulk" agent IDs for the two bulk operations.
- **`convex/aiModels.ts`**: Add `bulkUpsert` mutation that accepts an array of agent IDs + a model ID, performing a batch update in a single Convex transaction.
- **`app/admin/page.tsx`**: Render all agents dynamically. Add two bulk-update model picker sections ("Apply to all sub-agents", "Apply to all agents") using the same `ModelPickerDialog` component. Wire bulk selections to the new `bulkUpsert` mutation.
- **`components/admin/ConfirmModelChangeDialog.tsx`**: Support displaying bulk changes (showing which agents will be affected and the new model).

## Impact

- Modifies existing `add-admin-agent-model-config` capability
- Affected code:
  - `src/constants/admin.ts` — dynamic agent configs from registry
  - `convex/aiModels.ts` — new `bulkUpsert` mutation
  - `src/app/admin/page.tsx` — dynamic agent list + bulk-update sections
  - `src/components/admin/ConfirmModelChangeDialog.tsx` — bulk change display support
- No new tables or schema changes needed (reuses existing `ai_models` table)
- No breaking changes to existing functionality — individual model pickers continue to work
