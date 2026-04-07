# Capability: Admin Model Config

## MODIFIED Requirements

### Requirement: Dynamic Agent Listing
The admin panel MUST derive its agent list dynamically from the data source registry rather than hardcoding agent IDs.

#### Scenario: All registered agents appear in admin panel
- **Given** the data source registry defines 8 data source agents and 1 routing agent
- **When** an admin opens the model configuration panel
- **Then** all 9 agents are listed with individual model pickers
- **And** each agent shows its Hebrew label and icon from the registry

#### Scenario: New data source auto-appears
- **Given** a developer adds a new data source to `DATA_SOURCE_METAS` in `registry.ts`
- **When** the admin panel is loaded
- **Then** the new agent appears in the model config list without any changes to `constants/admin.ts`

### Requirement: Per-Agent Model Configuration
Each agent MUST have its own model picker that persists the selection to the Convex `ai_models` table.

#### Scenario: Change individual agent model
- **Given** an admin is on the model configuration panel
- **When** they select a new model for a specific agent
- **Then** a confirmation dialog shows the current and new model
- **And** upon confirmation, the selection is persisted to Convex
- **And** the UI reflects the new model immediately (optimistic update)

## ADDED Requirements

### Requirement: Bulk Model Update — All Sub-Agents
The admin panel MUST provide a bulk action to apply a single model to all data-source sub-agents at once.

#### Scenario: Apply model to all sub-agents
- **Given** an admin selects a model in the "Apply to all sub-agents" picker
- **When** the admin confirms the bulk change
- **Then** all 8 sub-agent model configs are updated in a single Convex transaction
- **And** the routing agent's model is NOT changed
- **And** all individual sub-agent cards reflect the new model

#### Scenario: Bulk confirm shows affected agents
- **Given** an admin picks a model for bulk "all sub-agents"
- **When** the confirmation dialog appears
- **Then** it lists all 8 sub-agent names that will be affected

### Requirement: Bulk Model Update — All Agents
The admin panel MUST provide a bulk action to apply a single model to all agents (routing + all sub-agents).

#### Scenario: Apply model to all agents
- **Given** an admin selects a model in the "Apply to all agents" picker
- **When** the admin confirms the bulk change
- **Then** all 9 agent model configs (routing + 8 sub-agents) are updated in a single Convex transaction
- **And** all individual agent cards reflect the new model

### Requirement: Convex Bulk Upsert Mutation
A `bulkUpsert` mutation MUST exist to atomically update multiple agent model configs in one transaction.

#### Scenario: Atomic bulk update
- **Given** 9 agent IDs and a model ID are provided
- **When** `bulkUpsert` is called
- **Then** all 9 records are upserted (created or updated) atomically
- **And** if any upsert fails, none are applied

#### Scenario: Admin guard on bulk upsert
- **Given** a non-admin user
- **When** they call `bulkUpsert`
- **Then** the mutation throws "Admin access required"
