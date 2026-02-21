## ADDED Requirements

### Requirement: Error Tracking
The system SHALL automatically capture and report all unhandled errors across client-side rendering, server-side rendering (including React Server Components), and Edge runtime to Sentry.

#### Scenario: Client-side rendering error
- **WHEN** a React component throws an unhandled error during client-side rendering
- **THEN** the error SHALL be captured by the global error boundary (`app/global-error.tsx`) and reported to Sentry with full stack trace

#### Scenario: Server Component error
- **WHEN** a React Server Component throws an error during server-side rendering
- **THEN** the error SHALL be captured via the `onRequestError` hook in `instrumentation.ts` and reported to Sentry

#### Scenario: Edge runtime error
- **WHEN** an error occurs in middleware or an Edge API route
- **THEN** the error SHALL be captured by the Edge Sentry SDK and reported to Sentry

### Requirement: Session Replay
The system SHALL record user sessions for visual replay of interactions, with privacy-safe defaults that mask all text, inputs, and media.

#### Scenario: Error session replay
- **WHEN** a user session encounters an error
- **THEN** 100% of such sessions SHALL be captured for replay (`replaysOnErrorSampleRate: 1.0`)

#### Scenario: Normal session sampling
- **WHEN** a user session does not encounter an error
- **THEN** 10% of sessions SHALL be sampled for replay (`replaysSessionSampleRate: 0.1`)

#### Scenario: Privacy masking
- **WHEN** a session is being recorded
- **THEN** all text content SHALL be masked (`maskAllText: true`), all input values SHALL be masked (`maskAllInputs: true`), and all media SHALL be blocked (`blockAllMedia: true`)

### Requirement: Structured Logging
The system SHALL provide a structured logging API via `Sentry.logger` that sends logs to Sentry across all runtimes (client, server, edge).

#### Scenario: Server-side structured log
- **WHEN** server-side code calls `Sentry.logger.info("message", { key: "value" })`
- **THEN** the log SHALL be sent to Sentry with the structured context data

#### Scenario: Logging enabled across runtimes
- **WHEN** any Sentry config initializes
- **THEN** `enableLogs` SHALL be set to `true` in all three config files (client, server, edge)

### Requirement: Source Map Upload
The system SHALL upload source maps to Sentry during production builds to enable readable stack traces.

#### Scenario: Production build with auth token
- **WHEN** `SENTRY_AUTH_TOKEN` is set and `npm run build` is executed
- **THEN** source maps SHALL be uploaded to Sentry automatically via `withSentryConfig`

#### Scenario: Build without auth token
- **WHEN** `SENTRY_AUTH_TOKEN` is not set
- **THEN** the build SHALL succeed without uploading source maps (graceful degradation)

### Requirement: Graceful Degradation
The system SHALL function normally when Sentry DSN is not configured, with all Sentry features silently disabled.

#### Scenario: Missing DSN
- **WHEN** `NEXT_PUBLIC_SENTRY_DSN` environment variable is not set
- **THEN** Sentry SDK SHALL initialize without sending any events, and the application SHALL function normally
