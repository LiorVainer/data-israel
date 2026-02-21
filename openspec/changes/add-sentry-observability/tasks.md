## 1. Installation & Configuration

- [x] 1.1 Install `@sentry/nextjs` via pnpm
- [x] 1.2 Create `sentry.client.config.ts` with error tracking, Session Replay integration, and structured logging
- [x] 1.3 Create `sentry.server.config.ts` with error tracking and structured logging
- [x] 1.4 Create `sentry.edge.config.ts` with error tracking and structured logging
- [x] 1.5 Create `instrumentation.ts` with `register()` for Node.js/Edge runtimes and `onRequestError` for Server Components

## 2. Next.js Integration

- [x] 2.1 Wrap `next.config.ts` with `withSentryConfig` (preserve existing `serverExternalPackages`)
- [x] 2.2 Create `app/global-error.tsx` error boundary component

## 3. Environment & Verification

- [x] 3.1 Add `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_AUTH_TOKEN` to `.env.local` (placeholder values)
- [x] 3.2 Document required env vars in proposal
- [x] 3.3 Run `npm run build` to verify build succeeds with Sentry
- [x] 3.4 Run `npm run lint` to verify no new lint errors in Sentry files
- [x] 3.5 Run `tsc` to verify no TypeScript errors
