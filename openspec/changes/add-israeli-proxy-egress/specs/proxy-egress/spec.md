# Proxy Egress Capability

## ADDED Requirements

### Requirement: Dual Proxy URL Environment Variables

The system SHALL expose exactly two environment variables for proxy configuration: `BRIGHT_DATA_PROXY_URL` (the residential zone, used for geo-gated targets) and `BRIGHT_DATA_UNLOCKER_URL` (the Web Unlocker zone, used for targets whose WAF blocks generic residential IPs). Each contains a full HTTP proxy URL with embedded basic-auth credentials. No additional environment variables (customer ID, zone name, password, host, port, country, enabled-flag) SHALL be defined to configure the same proxies.

#### Scenario: Both env vars unset disables proxying entirely
- **WHEN** both `BRIGHT_DATA_PROXY_URL` and `BRIGHT_DATA_UNLOCKER_URL` are unset or empty
- **THEN** the system SHALL treat proxying as disabled and all data-source clients SHALL egress directly (identical to pre-change behavior)

#### Scenario: Residential only — Knesset, Shufersal, and Rami Levy all use residential
- **WHEN** `BRIGHT_DATA_PROXY_URL` is set and `BRIGHT_DATA_UNLOCKER_URL` is unset
- **THEN** the Knesset and Shufersal clients SHALL use the residential zone
- **AND** the Rami Levy client SHALL fall back to the residential zone (and will fail with the same bot-detection error as before if the WAF blocks the IP)

#### Scenario: Unlocker only — Knesset and Shufersal egress directly, Rami Levy uses unlocker
- **WHEN** `BRIGHT_DATA_PROXY_URL` is unset and `BRIGHT_DATA_UNLOCKER_URL` is set
- **THEN** the Knesset and Shufersal clients SHALL egress directly (residential helper returns `false`)
- **AND** the Rami Levy client SHALL use the Web Unlocker zone

#### Scenario: Both set — recommended production configuration
- **WHEN** both `BRIGHT_DATA_PROXY_URL` and `BRIGHT_DATA_UNLOCKER_URL` are set
- **THEN** the Knesset and Shufersal clients SHALL use the residential zone
- **AND** the Rami Levy client SHALL use the Web Unlocker zone

#### Scenario: No secondary enable flag exists
- **WHEN** a developer searches the codebase for an enable/disable toggle for the proxy
- **THEN** the only configuration surface SHALL be the presence or absence of the two URL environment variables

### Requirement: Proxy Routing Registry

The system SHALL provide a declarative routing registry at `src/data-sources/proxy-routing.ts` that maps every `DataSource` ID to a `ProxyTier` (`'direct' | 'residential' | 'unlocker'`). The registry SHALL be the single source of truth for per-source proxy decisions — client files SHALL NOT hardcode their proxy selection logic.

#### Scenario: Registry covers every data source at compile time
- **WHEN** a new value is added to the `DataSource` union type
- **AND** no entry is added to `PROXY_ROUTING` for that new value
- **THEN** the TypeScript compiler SHALL fail with a `satisfies Record<DataSource, ProxyTier>` error
- **AND** the build SHALL fail

#### Scenario: Client files read their tier from the registry
- **WHEN** any data-source client file needs to configure its axios proxy
- **THEN** it SHALL import `PROXY_ROUTING` from `@/data-sources/proxy-routing` and `resolveProxyConfig` from `@/lib/proxy/bright-data`
- **AND** pass `resolveProxyConfig(PROXY_ROUTING['<source-id>'])` into `axios.create({ proxy })`
- **AND** SHALL NOT directly call `getBrightDataProxyConfig` / `getBrightDataUnlockerProxyConfig`, hardcode fallback logic, or reference the proxy env vars directly

#### Scenario: Changing a tier is a one-line edit in the registry
- **WHEN** an operator decides to change a data source's proxy tier (e.g., from `direct` to `residential` because the upstream started geo-gating)
- **THEN** the change SHALL consist of editing a single value in `PROXY_ROUTING`
- **AND** SHALL NOT require edits to the client file

### Requirement: Classification CLI Script

The system SHALL provide a CLI script at `src/scripts/classify-source.ts` (invoked via `pnpm classify-source`) that probes a given URL through four egress paths in parallel and recommends a `ProxyTier`. The script SHALL require a third dev-only environment variable `BRIGHT_DATA_PROBE_URL` that points to a Bright Data proxy URL forced to a non-Israeli country — this simulates Vercel's non-Israeli egress from a developer's local Israeli machine without requiring physical non-IL access.

#### Scenario: Script runs four probes in parallel
- **WHEN** `pnpm classify-source --url=<url>` is invoked
- **THEN** the script SHALL issue four concurrent HTTP requests to the target URL:
  1. `direct` — no proxy (local machine)
  2. `non-il` — through `BRIGHT_DATA_PROBE_URL`
  3. `residential` — through `BRIGHT_DATA_PROXY_URL`
  4. `unlocker` — through `BRIGHT_DATA_UNLOCKER_URL`
- **AND** SHALL report each probe's status, content-type, body size, body snippet, duration, and bot-block detection result

#### Scenario: Script recommends a tier via fuzzy comparison
- **WHEN** all four probes complete
- **THEN** the script SHALL classify the upstream using these rules (in order):
  - direct fails                                      → `unreachable-from-baseline`
  - BRIGHT_DATA_PROBE_URL not set                     → `unreachable` (cannot test non-IL)
  - direct equivalent to non-il                       → `direct`
  - residential equivalent to direct                  → `residential`
  - unlocker equivalent to direct                     → `unlocker`
  - nothing matches                                   → `unreachable`
- **AND** "equivalent" SHALL mean same HTTP status class, body size ratio within [0.33, 3.0], same content-type family, and no bot-block signatures in the body

#### Scenario: Script supports POST with body and custom headers
- **WHEN** `pnpm classify-source --url=<url> --method=POST --body='<json>' --headers='<json>'` is invoked
- **THEN** the script SHALL forward the body and headers to all four probes
- **AND** the body SHALL be parsed as JSON when possible, falling back to raw string

#### Scenario: Script outputs a paste-ready PROXY_ROUTING entry
- **WHEN** the classification result is `direct`, `residential`, or `unlocker`
- **THEN** the script SHALL print a one-line `'<your-source-id>': '<tier>',` entry the developer can paste into `PROXY_ROUTING`
- **WHEN** the classification result is unreachable
- **THEN** the script SHALL exit with a non-zero exit code and print a rationale listing the possible causes

#### Scenario: Probe env var is dev-only
- **WHEN** production code (any file under `src/` except `src/scripts/`) is inspected
- **THEN** no reference to `BRIGHT_DATA_PROBE_URL` SHALL exist outside of `src/scripts/classify-source.ts` and documentation files

### Requirement: Bright Data Proxy Config Helpers

The system SHALL provide a module `src/lib/proxy/bright-data.ts` that exports three functions: `getBrightDataProxyConfig()` (reads `ENV.BRIGHT_DATA_PROXY_URL`, the residential zone), `getBrightDataUnlockerProxyConfig()` (reads `ENV.BRIGHT_DATA_UNLOCKER_URL`, the Web Unlocker zone), and `resolveProxyConfig(tier: ProxyTier)` (central dispatcher). The URL helpers SHALL unconditionally return a cached `AxiosProxyConfig` object; neither helper SHALL return `false` — the env vars are required by `src/lib/env.ts` at startup, so their presence is guaranteed server-side. `resolveProxyConfig` SHALL map a `ProxyTier` value to the appropriate config by calling the underlying URL helpers, except in the browser bundle where it SHALL no-op to `false` to avoid reading undefined client-side env vars. These SHALL be the only construction points for Bright Data proxy configurations used anywhere in the application. The module SHALL contain zero imports of Node-only packages (no `https-proxy-agent`, no `http`, no `net`, no `tls`) so that it remains safe to include in a client-reachable module graph.

#### Scenario: Env vars are required at startup
- **WHEN** `BRIGHT_DATA_PROXY_URL` or `BRIGHT_DATA_UNLOCKER_URL` is unset on the server
- **THEN** `src/lib/env.ts`'s Zod schema validation SHALL fail
- **AND** the Next.js app SHALL refuse to start with a clear error message
- **AND** neither helper SHALL ever be reached with an undefined env var server-side

#### Scenario: Each helper returns a cached AxiosProxyConfig
- **WHEN** either helper is called server-side
- **AND** the corresponding helper is called two or more times in the same process
- **THEN** the function SHALL return the same `AxiosProxyConfig` object on every call (cached at module scope)
- **AND** the two helpers SHALL maintain independent caches

#### Scenario: Parses the URL via the standard URL API
- **WHEN** either helper is called for the first time
- **THEN** the function SHALL use the global `URL` constructor to parse the env var
- **AND** SHALL decode percent-encoded username and password via `decodeURIComponent`
- **AND** SHALL populate an `AxiosProxyConfig` with `protocol` (scheme minus the colon), `host`, `port`, and `auth: { username, password }`

#### Scenario: Malformed URL surfaces loudly
- **WHEN** either env var is present but not a valid URL
- **THEN** the first call to the corresponding helper SHALL throw an error originating from the `URL` constructor
- **AND** the system SHALL NOT silently fall back to direct egress

#### Scenario: Helper is fully isomorphic
- **WHEN** the helper module is included in a client bundle via the data-source registry chain
- **THEN** the bundler SHALL NOT attempt to resolve any Node-only module (`net`, `tls`, `http`, `https`, `https-proxy-agent`, `agent-base`, etc.)
- **AND** the build SHALL succeed

#### Scenario: resolveProxyConfig maps every tier to a valid value
- **WHEN** `resolveProxyConfig('direct')` is called server-side
- **THEN** it SHALL return `false`
- **WHEN** `resolveProxyConfig('residential')` is called server-side
- **THEN** it SHALL return the result of `getBrightDataProxyConfig()`, which is always a valid `AxiosProxyConfig` (env var is required at startup)
- **WHEN** `resolveProxyConfig('unlocker')` is called server-side
- **THEN** it SHALL return the result of `getBrightDataUnlockerProxyConfig()`, which is always a valid `AxiosProxyConfig` (env var is required at startup)

#### Scenario: resolveProxyConfig no-ops in the client bundle
- **WHEN** `resolveProxyConfig` is called in a browser context (`typeof window !== 'undefined'`)
- **THEN** it SHALL return `false` regardless of the tier argument
- **AND** SHALL NOT read any proxy environment variables
- **AND** this SHALL prevent the client bundle from throwing at module load on `new URL(undefined)` when data-source registry imports transitively pull `bright-data.ts`

### Requirement: Selective Client Opt-In via Routing Registry

Only data-source clients whose tier in `PROXY_ROUTING` is not `direct` SHALL incur proxy routing at runtime. Client files SHALL read their tier from `PROXY_ROUTING` and call `resolveProxyConfig` — they SHALL NOT import the underlying URL helpers (`getBrightDataProxyConfig`, `getBrightDataUnlockerProxyConfig`) or reference proxy env vars directly. All other data-source clients whose tier is `direct` SHALL NOT import `resolveProxyConfig` or `PROXY_ROUTING` at all.

#### Scenario: Clients whose tier is `direct` never reference the proxy module
- **WHEN** the CBS, DataGov, Budget, GovMap, or Health client file is inspected
- **THEN** it SHALL NOT import from `@/lib/proxy/bright-data` or `@/data-sources/proxy-routing`
- **AND** its outbound HTTP requests SHALL NOT traverse `brd.superproxy.io`

#### Scenario: Proxied clients use resolveProxyConfig uniformly
- **WHEN** the Knesset, Shufersal, or Rami Levy client file is inspected
- **THEN** it SHALL import `resolveProxyConfig` from `@/lib/proxy/bright-data` and `PROXY_ROUTING` from `@/data-sources/proxy-routing`
- **AND** SHALL set its axios `proxy` field to `resolveProxyConfig(PROXY_ROUTING['<its-source-id>'])`
- **AND** SHALL NOT directly call `getBrightDataProxyConfig` or `getBrightDataUnlockerProxyConfig`

#### Scenario: Rami Levy's tier is `unlocker`
- **WHEN** the Rami Levy client is initialized
- **AND** `PROXY_ROUTING['rami-levy']` is `'unlocker'`
- **THEN** its axios proxy config SHALL be the parsed `BRIGHT_DATA_UNLOCKER_URL`
- **AND** there SHALL be no residential fallback (both env vars are required at startup, so misconfiguration fails fast instead of silently degrading)

#### Scenario: Adding a new proxied client is a one-line registry edit
- **WHEN** a future data source is identified as needing Israeli egress
- **THEN** enabling the proxy for it SHALL consist of (a) adding the source ID to `PROXY_ROUTING` with the recommended tier from `pnpm classify-source`, and (b) using `resolveProxyConfig(PROXY_ROUTING['<new-source>'])` in the client file
- **AND** SHALL NOT require importing `getBrightDataProxyConfig` / `getBrightDataUnlockerProxyConfig` directly
- **AND** SHALL NOT happen via a centralized allowlist, hostname match, or middleware interception

### Requirement: Axios Native Proxy Integration Pattern

When a data-source client uses the Bright Data proxy, it SHALL pass the return value of `getBrightDataProxyConfig()` directly to axios's native `proxy` field inside `axios.create()`. The client SHALL NOT use `httpsAgent`, `httpAgent`, or any variant of `https-proxy-agent` — that package statically imports Node built-ins (`net`, `tls`) and would leak into the client bundle through the data-source registry import chain.

#### Scenario: Proxy field set directly
- **WHEN** the proxy wiring is added to a client
- **THEN** the client's axios instance SHALL be configured with `proxy: getBrightDataProxyConfig()` and nothing else (no `httpsAgent`, no `httpAgent`)

#### Scenario: Existing client options preserved
- **WHEN** the proxy wiring is added to an existing client
- **THEN** the client's existing `baseURL`, `timeout`, `headers`, retry wrapper, and rate-limit wrapper SHALL remain unchanged

#### Scenario: No https-proxy-agent dependency
- **WHEN** the project dependency tree is inspected
- **THEN** `https-proxy-agent` SHALL NOT appear in `package.json` runtime dependencies introduced by this change

### Requirement: Credential Hygiene

The `BRIGHT_DATA_PROXY_URL` value SHALL NOT be committed to the repository under any circumstances and SHALL be documented as a placeholder in `.env.example` with a comment indicating the URL-encoding rule for special characters in the password.

#### Scenario: .env.example contains only placeholders
- **WHEN** `.env.example` is inspected
- **THEN** it SHALL contain both `BRIGHT_DATA_PROXY_URL=` and `BRIGHT_DATA_UNLOCKER_URL=` entries with empty values
- **AND** SHALL include comments referencing the URL-encoding requirement for `@`, `:`, `#`, `/`, and `?` in passwords
- **AND** SHALL explain which data sources use each zone (Knesset/Shufersal → residential; Rami Levy → unlocker with residential fallback)

#### Scenario: .env.local is git-ignored
- **WHEN** `.env.local` exists with a real `BRIGHT_DATA_PROXY_URL`
- **THEN** `git status` SHALL NOT show `.env.local` as tracked or staged

### Requirement: Pre-Deploy Verification Route

The system SHALL provide a disposable Next.js App Router route handler at `src/app/api/debug/bright-data/route.ts` that verifies proxy configuration end-to-end against any running environment (local, Preview, Production). The route SHALL use `runtime = 'nodejs'` and `dynamic = 'force-dynamic'`, mirror the diagnostic style of `src/app/api/debug/upstream-probe/route.ts`, and be documented in its header as temporary — safe to delete once the rollout is verified.

#### Scenario: Route verifies Israeli egress
- **WHEN** the route is called with `BRIGHT_DATA_PROXY_URL` set in the current environment
- **THEN** it SHALL make a request to `https://geo.brdtest.com/welcome.txt` through axios with `proxy: getBrightDataProxyConfig()`
- **AND** the JSON response SHALL include the raw body and a parsed country code that operators can inspect to confirm egress originates from Israel

#### Scenario: Route verifies each proxied client
- **WHEN** the Israeli-egress check completes (regardless of outcome)
- **THEN** the route SHALL additionally execute one real request against each of the Knesset, Shufersal, and Rami Levy clients
- **AND** SHALL return for each client a per-check object containing status, duration, a short success/error summary, and a sample of the returned data shape

#### Scenario: Route degrades gracefully when proxy is missing
- **WHEN** the route is called with `BRIGHT_DATA_PROXY_URL` unset or empty
- **THEN** the JSON response SHALL clearly indicate `proxyConfigured: false`
- **AND** SHALL still attempt each of the four checks so the operator can compare direct-egress behavior

#### Scenario: Route is not cached
- **WHEN** the route is invoked repeatedly
- **THEN** each invocation SHALL perform fresh HTTP requests
- **AND** the response SHALL include a `Cache-Control: no-store` header

### Requirement: Rollback Without Code Change

Reverting the proxy SHALL NOT require a code change or a revert commit. Clearing the `BRIGHT_DATA_PROXY_URL` environment variable in the running environment and triggering a redeploy SHALL restore direct egress for all three affected clients.

#### Scenario: Clearing env var in Vercel restores direct egress
- **WHEN** an operator removes `BRIGHT_DATA_PROXY_URL` from the Vercel project settings and redeploys
- **THEN** the three clients SHALL resume making requests without traversing Bright Data infrastructure
- **AND** no code change, tag, or revert commit SHALL be required
