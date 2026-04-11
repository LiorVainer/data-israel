# Progress

## add-dynamic-openrouter-models — E2E Verification (Task 14)
- [x] Scenario 1: TypeScript — `npx tsc --noEmit` exit 0, zero errors
- [x] Scenario 2: Build — `npm run build` exit 0, /admin route static
- [x] Scenario 3: Lint — `npx eslint` exit 0 on new files (0 errors)
- [x] Scenario 4: Vibecheck — 73/100, 2 HIGH pre-existing (sw.js, tool-translations.tsx), no new issues
- [x] Scenario 5: Cross-file consistency — AvailableModel single definition in agent.config.ts, imported by hook + admin page
- [x] Scenario 6: Silent failure fixes — .catch() with revert+toast on upsertModel (line 148); response.data + architecture guards in hook (lines 54, 62)
- [x] Scenario 7: No static fallback — admin page has zero references to AgentConfig.AVAILABLE_MODELS

## add-pwa-push-notifications — Phase 1
- [x] 1.1 app/manifest.ts — MetadataRoute.Manifest, Hebrew RTL, theme_color, icons
- [x] 1.2 SKIP — icons to be provided by user
- [x] 1.3 public/sw.js — push + notificationclick, smart suppression, Hebrew
- [x] 1.4 app/layout.tsx — generateViewport() with themeColor
- [x] 1.5 next.config.ts — headers() for /sw.js
- [x] 1.6 Verified: build exit 0, tsc exit 0, no new ESLint errors, vibecheck 76/100

## add-pwa-push-notifications — Phase 2
- [x] 2.1 convex/schema.ts — push_subscriptions table (userId, endpoint, keys, createdAt, by_user_id + by_endpoint indexes)
- [x] 2.2 convex/pushSubscriptions.ts — savePushSubscription, deletePushSubscription, deleteByEndpoint, getPushSubscriptionsByUser
- [x] 2.3 .env.example — NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY placeholders
- [x] 2.4 web-push@3.6.7 + @types/web-push@3.6.4 installed via pnpm
- [x] 2.5 lib/push/send-notification.ts — sendPushToUser, VAPID no-op, 410 cleanup
- [x] 2.6 Verified: build exit 0, tsc exit 0, no new ESLint errors, vibecheck 76/100

## add-pwa-push-notifications — Phase 3
- [x] 3.1 app/api/chat/route.ts — import sendPushToUser + void fire-and-forget call in onFinish after clearActiveStreamId
- [x] 3.2 Payload: threadId for deep link, Hebrew title, Hebrew body
- [x] 3.3 Verified: tsc exit 0, build exit 0, no new ESLint errors in route.ts

## add-pwa-push-notifications — Phase 4
- [x] 4.1 hooks/use-push-subscription.ts — SW registration, subscription check, subscribe(), unsubscribe() with Convex mutations via makeFunctionReference
- [x] 4.2 components/chat/NotificationPrompt.tsx — Hebrew RTL banner, dismissed localStorage, BellRing icon
- [x] 4.3 components/chat/ChatThread.tsx — integrated NotificationPrompt with usePushSubscription
- [x] 4.4 Verified: tsc exit 0, build exit 0, eslint no new errors (pre-existing 4 remain), vibecheck 76/100

## add-pwa-push-notifications — E2E Verification (Task 10)
- [x] Scenario 1: Build & Type Safety — tsc exit 0, build exit 0 (manifest.webmanifest in output), eslint 0 new errors, vibecheck 76/100
- [x] Scenario 2: Manifest Integrity — Hebrew metadata, RTL, standalone, theme_color, icons
- [x] Scenario 3: Service Worker — skipWaiting, clients.claim, push+notificationclick with .catch, smart suppression
- [x] Scenario 4: Convex Schema & Mutations — push_subscriptions table + 4 CRUD functions verified
- [x] Scenario 5: Server Push Trigger — sendPushToUser fire-and-forget in onFinish, VAPID no-op, 410 cleanup
- [x] Scenario 6: Client Push Hook & UI — SW registration, subscribe/unsubscribe, Hebrew prompt, localStorage try-catch
- [x] Scenario 7: Security Headers — Content-Type, Cache-Control, CSP for /sw.js
- [x] Scenario 8: Cross-file Consistency — all makeFunctionReference paths match, VAPID env vars consistent, icons referenced (files pending)
- Non-blocking items: `as { statusCode: number }` cast in send-notification.ts, unused `unsubscribe` prop in NotificationPrompt, missing icon files (user will provide)

## add-admin-agent-model-config — All Phases COMPLETE
- [x] Phase 0: vitest setup (vitest.config.ts, test scripts)
- [x] Phase 1: Per-agent env config (AI_DATAGOV_MODEL_ID, AI_CBS_MODEL_ID, SubAgentId type)
- [x] Phase 2: Agent factories (createDatagovAgent, createCbsAgent, createRoutingAgent, getMastraWithModels)
- [x] Phase 3: Convex ai_models table + getAll/upsert CRUD
- [x] Phase 4: Dynamic model resolution (resolveModelConfig → Convex → env → default)
- [x] Phase 5: Clerk RBAC (isAdmin in UserContext, admin link in NavUser)
- [x] Phase 6: Admin panel UI (/admin page with 3 ModelSelectorSection instances)
- [x] Phase 7: Unit tests (14 tests, 3 suites — model, mastra, resolve-model-config)
- [x] Phase 8: Final verification (tsc, build, lint, vibecheck, tests all pass)

## add-agent-evals — All Tasks COMPLETE
- [x] Task 1: Setup — eval.config.ts with judge model, sampling rates
- [x] Task 2: 6 custom scorers (hebrew-output, no-tech-leakage, tool-compliance, conciseness, source-attribution, data-freshness)
- [x] Task 3: Live scorer integration on all 3 agents + Mastra instance
- [x] Task 4: CI/CD eval test suites (routing, datagov, cbs)
- [x] Task 5: Convex backend (prompt_revisions table, scores query, revisions CRUD)
- [x] Task 6: Prompt optimization script + npm scripts
- [x] Task 7: GitHub Actions CI/CD workflow
- [x] Task 8: Verification (tsc 0 errors, build pass, lint pass, 14 tests pass)

## add-resumable-streaming
- [x] Research, proposal created, awaiting implementation

## add-admin-dashboard-analytics — Tasks 1-6 COMPLETE
- [x] 1.1 recharts@3.8.0 installed via pnpm
- [x] 1.2 shadcn tabs → src/components/ui/tabs.tsx
- [x] 1.3 src/constants/prompt-cards.ts — PromptCard + PROMPT_CARDS exported
- [x] 1.4 EmptyConversation.tsx imports from @/constants/prompt-cards
- [x] 2.x convex/analytics.ts — 5 analytics query functions
- [x] 3.1-3.4 Admin page Tabs refactor + AnalyticsDashboard + time-range selector
- [x] 4.1-4.5 StatCard + UserGuestBreakdownCard + KPI row + breakdown wired to Convex
- [x] 5.1-5.7 Charts: ThreadOriginChart, ThreadsOverTimeChart, TokenUsageChart, AgentDelegationChart — all wired, Hebrew labels, CSS-var colors
- [x] 6.1-6.3 Mobile responsiveness: isMobile-driven heights/margins/grids/legend positions
- Verification: tsc exit 0, build exit 0, 40/40 tests pass, ESLint 0 errors
