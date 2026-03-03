## Context

The agent network has three agents (routing, datagov, cbs) that all use a single model. This change introduces per-agent model configuration with a 3-tier resolution strategy and an admin panel for runtime changes. It spans environment config, Convex backend, Mastra agent instantiation, Clerk auth, and React UI.

## Goals / Non-Goals

- **Goals:**
  - Each agent (routing, datagov, cbs) can run on a different model
  - Models configurable via env vars (deploy-time) and Convex table (runtime)
  - Admin panel for changing models without redeployment
  - Admin access gated by Clerk RBAC (no new auth system)
  - Backward compatible: no env vars set → all agents use `AI_DEFAULT_MODEL_ID`

- **Non-Goals:**
  - User-facing model selection (already covered by `add-model-selection-stop-control`)
  - Per-thread or per-message model overrides
  - Model cost tracking or usage analytics
  - Admin user management UI (admins are set via Clerk Dashboard)

## Decisions

### Model Resolution Order
- **Decision:** Convex `ai_models` → per-agent env var → `AI_DEFAULT_MODEL_ID`
- **Why:** Convex provides runtime overrides without redeploy. Env vars provide deploy-time defaults. The global default is the ultimate fallback. This layering lets operators start simple (just set one env var) and add granularity as needed.

### Admin Auth via Clerk publicMetadata
- **Decision:** Use Clerk's built-in `publicMetadata.role` for admin RBAC instead of a Convex `admins` table or `role` field on users.
- **Alternatives considered:**
  - Convex `admins` table with email list → Requires separate data sync, duplicates auth concern
  - Convex `users.role` field → Requires Clerk webhook to keep in sync, adds schema migration
  - Clerk `publicMetadata.role` → Native to auth provider, accessible client-side via `useUser()`, server-side via `auth()`, zero Convex schema changes for auth
- **Why:** Clerk already manages users. `publicMetadata` is the Clerk-recommended pattern for roles. Set via Dashboard or API, automatically available in session claims. Extensible to other roles (moderator, etc.) without schema changes.

### Dynamic Mastra Instantiation
- **Decision:** Create agent factory functions and a `getMastraWithModels(config)` factory that caches Mastra instances by config hash.
- **Why:** Mastra agents bind their model at construction time (the `model` param is a string, not a function). To change models at runtime, we must create new Agent instances. Caching by config JSON key ensures we only recreate when the config actually changes (admin saves new model), not on every request.
- **Alternatives considered:**
  - Monkey-patching agent model property → Fragile, not supported by Mastra API
  - Recreating agents on every request → Wasteful, creates garbage collection pressure
  - Using model override in `handleChatStream` params → Only works for the routing agent, not sub-agents (they're bound at Agent construction)

### Reuse ModelSelectorSection
- **Decision:** Reuse the existing `components/chat/ModelSelectorSection.tsx` for the admin panel.
- **Why:** The component already renders `AgentConfig.AVAILABLE_MODELS` grouped by provider with search. It accepts `selectedModel`, `open`, `onOpenChange`, `onSelectModel` props — exactly what the admin panel needs.

## Risks / Trade-offs

- **Stale cache risk:** If an admin changes models while a request is in-flight, the old Mastra instance handles that request. The new config takes effect on the next request. This is acceptable for a low-frequency admin action.
- **Memory usage:** Each unique model config creates a cached Mastra + Agent set. In practice there's only one active config at a time (the cache replaces, not accumulates). Old instances are garbage collected.
- **Convex query per request:** `resolveModelConfig()` queries Convex on each POST. This adds ~10-50ms latency. Acceptable given the agent response takes seconds. Could add in-memory TTL cache later if needed.

## Open Questions

- None — all decisions resolved via user feedback and Clerk docs research.
