# Patterns

## Project Architecture
- Next.js 16 + Mastra agents + AI SDK v6
- Streaming: `handleChatStream` -> `createUIMessageStreamResponse`
- Memory: Convex (ConvexStore + ConvexVector)
- Sub-agent delegation: routing agent delegates to datagovAgent, cbsAgent

## Conventions
- Hebrew RTL UI
- `@/*` path aliases
- OpenSpec workflow for feature proposals
- Build verification: `npm run build && npm run lint && npm run vibecheck`
- TypeScript strict: no `any`, minimal `as` casts

## Next.js 16 PWA Patterns
- `themeColor` must go in `generateViewport(): Viewport` NOT `generateMetadata()` — Next.js 16 splits them
- Manifest via `app/manifest.ts` with `MetadataRoute.Manifest` return type — auto-generates `/manifest.webmanifest`
- Service worker in `public/sw.js` (plain JS, no build step) — add to ESLint `globalIgnores` to avoid SW global errors
- `npm run lint` fails in bash (path issue); use `npm run eslint` for ESLint checks

## ESLint Quirks
- `npm run lint` (next lint) has path resolution issues in bash env — use `npm run eslint` instead
- Pre-existing errors in repo: `eslint.config.mjs` (nextVitals/nextTs/compat unused), `lib/api/data-gov/types.js` (exports no-undef)

## Convex Code-Gen Patterns
- `convex/_generated/api.d.ts` includes all Convex modules after running `npx convex dev`
- Use `api.module.function` from `@/convex/_generated/api` for type-safe function references
- Avoid `makeFunctionReference` — use the codegen `api.*` imports instead

## Convex Mastra Storage Patch
- Upstream `@mastra/convex` storage handler (`stores/convex/src/server/storage.ts` in mastra-ai/mastra) does full table scans `.take(10000)` in `queryTable` and `load` (without `keys.id`) — exceeds Convex 16MB read limit as data grows
- Patched in `convex/mastra/storage.ts`: intercepts `queryTable` on `mastra_messages` (by_thread_created, by_record_id, by_resource), `mastra_threads` (by_resource, by_record_id), and `load` on `mastra_workflow_snapshot` (by_workflow_run) and `mastra_threads` (by_resource)
- Table name constants match Convex table names for most tables EXCEPT `mastra_workflow_snapshot` (singular constant) vs `mastra_workflow_snapshots` (plural Convex table)
- Fallback: delegates to `_upstream` (re-exported `mastraStorage`) for any operation not intercepted

## Web Push Patterns
- VAPID keys: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (client-safe) + `VAPID_PRIVATE_KEY` (server-only)
- `webpush.setVapidDetails('mailto:noreply@...', publicKey, privateKey)` — call once, check env first
- HTTP 410 Gone from sendNotification = browser permanently invalidated subscription → delete from Convex
- All push errors are caught and logged, never thrown (fire-and-forget from onFinish)
- SW must have `.catch()` on all promise chains passed to `event.waitUntil()` — unhandled rejections cause browser to show generic notification
- SW must have `skipWaiting()` + `clients.claim()` for immediate activation of new versions
- `localStorage` access must be wrapped in try-catch — throws `SecurityError` in Safari private browsing
- Unsubscribe should delete from Convex first, then browser, to avoid orphaned records on network failure
