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

### Requirement: Bright Data Proxy Config Helpers

The system SHALL provide a module `src/lib/proxy/bright-data.ts` that exports two functions: `getBrightDataProxyConfig()` (reads `BRIGHT_DATA_PROXY_URL`, the residential zone) and `getBrightDataUnlockerProxyConfig()` (reads `BRIGHT_DATA_UNLOCKER_URL`, the Web Unlocker zone). Both SHALL return either a cached `AxiosProxyConfig` object or the literal `false`. These SHALL be the only construction points for Bright Data proxy configurations used anywhere in the application. The module SHALL contain zero imports of Node-only packages (no `https-proxy-agent`, no `http`, no `net`, no `tls`) so that it remains safe to include in a client-reachable module graph.

#### Scenario: Each helper returns false when its env var is absent
- **WHEN** `process.env.BRIGHT_DATA_PROXY_URL` is `undefined` or empty
- **THEN** `getBrightDataProxyConfig()` SHALL return the literal `false`
- **WHEN** `process.env.BRIGHT_DATA_UNLOCKER_URL` is `undefined` or empty
- **THEN** `getBrightDataUnlockerProxyConfig()` SHALL return the literal `false`

#### Scenario: Each helper returns a cached AxiosProxyConfig when its env var is present
- **WHEN** either env var is a non-empty string
- **AND** the corresponding helper is called two or more times in the same process
- **THEN** the function SHALL return the same `AxiosProxyConfig` object on every call (cached at module scope)
- **AND** the two helpers SHALL maintain independent caches (setting one env var SHALL NOT affect the other helper's return value)

#### Scenario: Parses the URL via the standard URL API
- **WHEN** either helper is called for the first time with a valid URL in its env var
- **THEN** the function SHALL use the global `URL` constructor to parse the value
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

### Requirement: Selective Client Opt-In

Only the three data-source clients whose upstream APIs require Israeli egress SHALL import the proxy helpers: Knesset (`src/data-sources/knesset/api/knesset.client.ts`) and Shufersal (`src/data-sources/shufersal/api/shufersal.client.ts`) import only `getBrightDataProxyConfig`; Rami Levy (`src/data-sources/rami-levy/api/rami-levy.client.ts`) imports BOTH helpers and prefers the unlocker with residential fallback. All other data-source clients (CBS, DataGov, Budget, GovMap, Drugs, Health) SHALL NOT import either helper.

#### Scenario: Non-Israeli clients never pay the proxy hop
- **WHEN** a chat query triggers the CBS, DataGov, Budget, GovMap, Drugs, or Health agent
- **THEN** the outbound HTTP request SHALL NOT traverse `brd.superproxy.io` or any Bright Data infrastructure
- **AND** request latency SHALL NOT be affected by proxy configuration

#### Scenario: Rami Levy prefers unlocker with residential fallback
- **WHEN** the Rami Levy client is initialized
- **THEN** it SHALL call `getBrightDataUnlockerProxyConfig()` first
- **AND** if the result is not `false`, use it as the axios `proxy` value
- **AND** if the result is `false`, fall back to `getBrightDataProxyConfig()` as the axios `proxy` value

#### Scenario: Knesset and Shufersal never use the unlocker zone
- **WHEN** the Knesset or Shufersal client is initialized
- **THEN** it SHALL only call `getBrightDataProxyConfig()` (residential)
- **AND** SHALL NOT import `getBrightDataUnlockerProxyConfig`

#### Scenario: Adding a new proxied client is an explicit edit
- **WHEN** a future data source is identified as needing Israeli egress
- **THEN** enabling the proxy for it SHALL require an explicit import of `getBrightDataProxyConfig` (or `getBrightDataUnlockerProxyConfig` for bot-protected targets) in that client's file
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
