# Change: Add Per-Agent Model Configuration with Admin Panel

## Why

All three agents (routing, datagov, cbs) currently share a single model via `AI_DEFAULT_MODEL_ID`. Operators need the ability to assign different models to each agent (e.g., a cheaper/faster model for sub-agents, a more capable model for routing) and change them at runtime without redeploying.

## What Changes

- Add optional per-agent model env vars (`AI_DATAGOV_MODEL_ID`, `AI_CBS_MODEL_ID`) with fallback to `AI_DEFAULT_MODEL_ID`
- Add Convex `ai_models` table for runtime model overrides (takes priority over env vars)
- Add admin panel UI at `/admin` for changing agent models, gated by Clerk RBAC (`publicMetadata.role === 'admin'`)
- Add `isAdmin` to `UserContext` derived from Clerk's `publicMetadata.role`
- Add admin navigation link in `NavUser` dropdown (visible only to admins)
- Add dynamic Mastra instance factory with caching to support runtime model changes
- Reuse existing `ModelSelectorSection` component for admin model picker UI

## Impact

- Affected specs: none existing (new `admin-model-config` capability)
- Affected code:
  - `lib/env.ts` — new optional env vars
  - `agents/agent.config.ts` — per-agent model ID config
  - `agents/network/model.ts` — model factory accepts agent ID
  - `agents/network/datagov/data-gov.agent.ts` — factory function + agent-specific model
  - `agents/network/cbs/cbs.agent.ts` — factory function + agent-specific model
  - `agents/network/routing/routing.agent.ts` — factory function accepting sub-agents
  - `agents/mastra.ts` — dynamic Mastra factory with caching
  - `convex/schema.ts` — `ai_models` table
  - `convex/aiModels.ts` — new CRUD queries/mutations
  - `app/api/chat/route.ts` — resolve model config from Convex + dynamic Mastra
  - `context/UserContext.tsx` — `isAdmin` from Clerk `publicMetadata`
  - `components/navigation/NavUser.tsx` — admin panel link
  - `app/admin/page.tsx` — new admin panel page
  - `types/globals.d.ts` — Clerk type extensions
