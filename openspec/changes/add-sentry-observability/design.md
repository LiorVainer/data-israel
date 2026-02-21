## Context

The application is a Next.js 16 App Router project with React 19 Server Components, Mastra agent framework, and Convex backend. It currently lacks any error tracking, structured logging, or session replay. Sentry is the industry-standard observability platform for JavaScript/TypeScript applications with first-class Next.js support.

## Goals / Non-Goals

- Goals:
  - Capture all unhandled errors (client, server, edge) automatically
  - Enable Session Replay with privacy-safe defaults for reproducing user issues
  - Provide structured logging API (`Sentry.logger`) for agent and API debugging
  - Upload source maps for readable stack traces in production
  - Capture Server Component errors via `onRequestError` hook

- Non-Goals:
  - Custom Sentry dashboard configuration (done in Sentry UI, not code)
  - Performance profiling of Mastra agent internals (future enhancement)
  - Replacing console.log throughout codebase (incremental adoption)
  - User feedback widget (can be added later if needed)

## Decisions

### SDK: `@sentry/nextjs`
- **Why**: Official Sentry SDK for Next.js with built-in support for App Router, Server Components, Edge Runtime, and automatic instrumentation
- **Alternatives**: Generic `@sentry/node` + `@sentry/browser` (more manual setup, no Next.js-specific integrations)

### Session Replay privacy defaults
- **Decision**: Enable `maskAllText: true`, `blockAllMedia: true`, `maskAllInputs: true`
- **Why**: The app handles user queries about public data but masking by default is the safest starting point. Can be relaxed later if needed.

### Sample rates
- **Decision**: `tracesSampleRate: 1.0` in dev, `0.1` in prod; `replaysOnErrorSampleRate: 1.0`, `replaysSessionSampleRate: 0.1`
- **Why**: Full visibility in development, cost-effective in production. 100% replay capture on errors ensures all error sessions are replayable.

### Structured logging
- **Decision**: Enable `enableLogs: true` across all three configs (client, server, edge)
- **Why**: Allows progressive adoption of `Sentry.logger.info/warn/error` without requiring a logging framework migration

### instrumentation.ts
- **Decision**: Create new `instrumentation.ts` at project root (currently doesn't exist)
- **Why**: Required by Next.js 15+ for server-side SDK registration and `onRequestError` hook

## Risks / Trade-offs

- **Bundle size increase** → `@sentry/nextjs` adds ~30-50KB gzipped to client bundle. Session Replay adds more. Mitigated by tree-shaking and lazy loading of replay.
- **Build time increase** → Source map upload adds time to builds. Mitigated by only uploading in CI (`silent: !process.env.CI`).
- **Privacy** → Session Replay records user interactions. Mitigated by strict masking defaults.
- **DSN exposure** → `NEXT_PUBLIC_SENTRY_DSN` is public by design (client-side). This is safe — DSN only allows sending events, not reading them.

## Open Questions

- Should we add Sentry to the `serverExternalPackages` list in `next.config.ts`? (Likely not needed since `@sentry/nextjs` handles this internally)
- Do we want to add the Sentry user feedback widget (`feedbackIntegration`) in a future iteration?
