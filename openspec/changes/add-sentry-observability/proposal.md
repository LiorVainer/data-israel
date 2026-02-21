# Change: Add Sentry Error Tracking, Logging, and Session Replay

## Why

The application currently has no centralized error tracking, structured logging, or session replay capabilities. When users encounter errors in production, there is no visibility into what happened, making debugging difficult. Adding Sentry provides:
- Automatic error capture across client, server, and edge runtimes
- Structured logging via `Sentry.logger` for agent tool calls and API interactions
- Session Replay to visually reproduce user-facing issues
- Performance tracing for identifying slow agent responses

## What Changes

- Install `@sentry/nextjs` SDK
- Create 3 Sentry config files (`sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`)
- Create `instrumentation.ts` to register Sentry for Node.js and Edge runtimes, including `onRequestError` for Server Component error capture
- Wrap `next.config.ts` with `withSentryConfig` for source map uploads
- Add `app/global-error.tsx` error boundary for React rendering errors
- Add environment variables (`NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`)
- Configure Session Replay with privacy-safe defaults (mask text, block media)
- Enable structured logging (`enableLogs: true`) across all runtimes

## Impact

- Affected specs: New `observability` capability
- Affected code:
  - `next.config.ts` (wrap with `withSentryConfig`)
  - `instrumentation.ts` (new file — Sentry runtime registration)
  - `sentry.client.config.ts` (new file)
  - `sentry.server.config.ts` (new file)
  - `sentry.edge.config.ts` (new file)
  - `app/global-error.tsx` (new file)
  - `.env.local` (new env vars)
  - `package.json` (new dependency)
