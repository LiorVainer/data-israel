## ADDED Requirements

### Requirement: Per-Agent Model Environment Configuration
The system SHALL support optional environment variables `AI_DATAGOV_MODEL_ID` and `AI_CBS_MODEL_ID` to configure the model for each sub-agent independently. When not set, each agent SHALL fall back to `AI_DEFAULT_MODEL_ID`.

#### Scenario: No agent-specific env vars set
- **WHEN** `AI_DATAGOV_MODEL_ID` and `AI_CBS_MODEL_ID` are not set
- **THEN** all agents (routing, datagov, cbs) use `AI_DEFAULT_MODEL_ID`

#### Scenario: Agent-specific env var set
- **WHEN** `AI_DATAGOV_MODEL_ID` is set to a different model
- **THEN** the datagov agent uses that model while routing and cbs use `AI_DEFAULT_MODEL_ID`

### Requirement: Runtime Model Configuration via Convex
The system SHALL store per-agent model overrides in a Convex `ai_models` table. Runtime overrides SHALL take priority over environment variables. The resolution order SHALL be: Convex `ai_models` → per-agent env var → `AI_DEFAULT_MODEL_ID`.

#### Scenario: Convex override present
- **WHEN** an `ai_models` record exists for `agentId: 'datagov'` with `modelId: 'x-ai/grok-4.1-fast'`
- **THEN** the datagov agent uses `x-ai/grok-4.1-fast` regardless of env var value

#### Scenario: Convex unavailable
- **WHEN** the Convex query fails or returns empty results
- **THEN** the system falls back to env var values (and ultimately to `AI_DEFAULT_MODEL_ID`)

#### Scenario: Model change takes effect
- **WHEN** an admin updates the model for an agent in Convex
- **THEN** the next chat request uses the updated model

### Requirement: Dynamic Agent Instantiation
The system SHALL provide agent factory functions and a `getMastraWithModels(config)` factory that creates Mastra instances with the specified models. The factory SHALL cache instances by configuration to avoid unnecessary recreation.

#### Scenario: Config unchanged between requests
- **WHEN** two consecutive requests resolve the same model config
- **THEN** both requests use the same cached Mastra instance

#### Scenario: Config changed by admin
- **WHEN** an admin changes a model between requests
- **THEN** the next request creates a new Mastra instance with the updated models

### Requirement: Admin Access Control via Clerk RBAC
The system SHALL use Clerk's `publicMetadata.role` to determine admin status. A user with `publicMetadata.role === 'admin'` SHALL be considered an admin. The `isAdmin` flag SHALL be exposed via `UserContext`.

#### Scenario: Admin user
- **WHEN** a Clerk user has `publicMetadata.role` set to `'admin'`
- **THEN** `useUser().isAdmin` returns `true`

#### Scenario: Non-admin user
- **WHEN** a Clerk user has no `role` in `publicMetadata` or a different role
- **THEN** `useUser().isAdmin` returns `false`

#### Scenario: Guest user
- **WHEN** a user is not authenticated (guest)
- **THEN** `useUser().isAdmin` returns `false`

### Requirement: Admin Navigation Link
The system SHALL display an admin panel link in the `NavUser` dropdown menu only for admin users. The link SHALL navigate to `/admin` and display "פאנל ניהול" with a Settings icon.

#### Scenario: Admin sees link
- **WHEN** an admin user opens the NavUser dropdown
- **THEN** a "פאנל ניהול" menu item is visible

#### Scenario: Non-admin does not see link
- **WHEN** a non-admin user opens the NavUser dropdown
- **THEN** no admin panel link is visible

### Requirement: Admin Model Configuration Panel
The system SHALL provide an admin panel at `/admin` that allows admins to view and change the model for each agent (routing, datagov, cbs). The panel SHALL use the existing `ModelSelectorSection` component. Non-admin users SHALL see an access denied message.

#### Scenario: Admin views panel
- **WHEN** an admin navigates to `/admin`
- **THEN** three model selectors are displayed with Hebrew labels: "סוכן ניתוב", "סוכן data.gov.il", "סוכן הלמ\"ס"

#### Scenario: Admin changes model
- **WHEN** an admin selects a new model for an agent and saves
- **THEN** the change is persisted to the Convex `ai_models` table

#### Scenario: Non-admin access denied
- **WHEN** a non-admin user navigates to `/admin`
- **THEN** an access denied message is displayed

### Requirement: Admin-Guarded Convex Mutations
The `ai_models` upsert mutation SHALL verify the caller is an admin before persisting changes. The mutation SHALL check the Clerk identity's `publicMetadata.role` via `ctx.auth.getUserIdentity()`.

#### Scenario: Admin upserts model
- **WHEN** an admin calls the upsert mutation
- **THEN** the model config is saved and `updatedAt`/`updatedBy` are set

#### Scenario: Non-admin upsert rejected
- **WHEN** a non-admin calls the upsert mutation
- **THEN** the mutation throws an authorization error

### Requirement: Unit Tests for Core Logic
The system SHALL include vitest unit tests for the model factory, Mastra caching, and model config resolution functions. Tests SHALL verify fallback chains, caching behavior, and error handling.

#### Scenario: Model factory returns correct format
- **WHEN** `getMastraModelId('datagov')` is called
- **THEN** it returns `openrouter/{DATAGOV_ID}` and `getMastraModelId()` with no args returns `openrouter/{DEFAULT_ID}`

#### Scenario: Mastra factory caches by config
- **WHEN** `getMastraWithModels` is called twice with the same config
- **THEN** it returns the same Mastra instance

#### Scenario: Model config resolution fallback
- **WHEN** Convex returns no records for an agent
- **THEN** `resolveModelConfig` falls back to the env var value for that agent
