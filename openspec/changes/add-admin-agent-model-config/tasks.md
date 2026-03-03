## 0. Test Infrastructure Setup
- [x] 0.1 Install vitest and dependencies: `pnpm add -D vitest @vitejs/plugin-react`
- [x] 0.2 Create `vitest.config.ts` with path aliases (`@/*` → root) and environment setup
- [x] 0.3 Add `"test": "vitest run"` and `"test:watch": "vitest"` scripts to `package.json`
- [x] 0.4 Verify `pnpm test` runs successfully (empty test suite)

## 1. Per-Agent Environment & Config
- [x] 1.1 Add `AI_DATAGOV_MODEL_ID` and `AI_CBS_MODEL_ID` as optional strings to `EnvSchema` in `lib/env.ts`
- [x] 1.2 Document new env vars (commented out) in `.env.example`
- [x] 1.3 Add `DATAGOV_ID` and `CBS_ID` to `AgentConfig.MODEL` in `agents/agent.config.ts` with `??` fallback to `DEFAULT_ID`
- [x] 1.4 Add `SubAgentId` type and update `getMastraModelId`/`getAiSdkModelId` to accept optional agent ID in `agents/network/model.ts`
- [x] 1.5 Pass `'datagov'` to `getMastraModelId()` in `agents/network/datagov/data-gov.agent.ts`
- [x] 1.6 Pass `'cbs'` to `getMastraModelId()` in `agents/network/cbs/cbs.agent.ts`
- [x] 1.7 Run `tsc` and `npm run build` to verify no errors

## 2. Agent Factory Functions & Dynamic Mastra
- [x] 2.1 Add `createDatagovAgent(modelId)` factory in `agents/network/datagov/data-gov.agent.ts`
- [x] 2.2 Add `createCbsAgent(modelId)` factory in `agents/network/cbs/cbs.agent.ts`
- [x] 2.3 Add `createRoutingAgent(modelId, subAgents)` factory in `agents/network/routing/routing.agent.ts`
- [x] 2.4 Export `AgentModelConfig` interface and `getMastraWithModels(config)` factory with caching in `agents/mastra.ts`
- [x] 2.5 Run `tsc` and `npm run build` to verify no errors

## 3. Convex `ai_models` Table
- [x] 3.1 Add `ai_models` table to `convex/schema.ts` (agentId, modelId, updatedAt, updatedBy, indexed by agentId)
- [x] 3.2 Create `convex/aiModels.ts` with `getAll` query and `upsert` mutation (admin-guarded via Clerk identity + publicMetadata)
- [x] 3.3 Run `tsc` and `npm run build` to verify no errors

## 4. Dynamic Model Resolution in Chat API
- [x] 4.1 Add `resolveModelConfig()` to `app/api/chat/route.ts` that fetches `ai_models` from Convex and merges with env var fallbacks
- [x] 4.2 Replace static `mastra` with `getMastraWithModels(config)` in POST handler
- [x] 4.3 Run `tsc` and `npm run build` to verify no errors

## 5. Admin Auth via Clerk RBAC
- [x] 5.1 Create `types/globals.d.ts` extending Clerk's `CustomJwtSessionClaims` and `UserPublicMetadata` with `role?: string`
- [x] 5.2 Add `isAdmin: boolean` to `UserContextType` in `context/UserContext.tsx`, derived from Clerk `useUser()` → `publicMetadata.role === 'admin'`
- [x] 5.3 Add admin panel link (`Settings` icon + "פאנל ניהול") to `NavUser.tsx` dropdown, conditional on `isAdmin`
- [x] 5.4 Run `tsc` and `npm run build` to verify no errors

## 6. Admin Panel UI
- [x] 6.1 Create `app/admin/page.tsx` — client component with `isAdmin` guard, fetches `ai_models` from Convex, renders 3 `ModelSelectorSection` instances (routing, datagov, cbs), saves via `useMutation`
- [x] 6.2 Run `tsc`, `npm run build`, `npm run lint` to verify no errors

## 7. Tests
- [x] 7.1 `agents/network/__tests__/model.test.ts` — test `getMastraModelId` and `getAiSdkModelId`: default (no arg) returns routing model, `'datagov'` returns datagov model, `'cbs'` returns cbs model, format is `openrouter/...`
- [x] 7.2 `agents/__tests__/mastra.test.ts` — test `getMastraWithModels`: returns Mastra instance, caches same config, recreates on config change
- [x] 7.3 `app/api/chat/__tests__/resolve-model-config.test.ts` — test `resolveModelConfig`: Convex values override env defaults, missing Convex values fall back to env, Convex failure falls back entirely to env config
- [x] 7.4 Run `pnpm test` to verify all tests pass

## 8. Final Verification
- [x] 8.1 Run full verification: `tsc && npm run build && npm run lint && npm run vibecheck`
- [x] 8.2 Run `pnpm test` — all tests pass (14/14)
- [x] 8.3 Verify backward compatibility: no env vars set → all agents use `AI_DEFAULT_MODEL_ID`
