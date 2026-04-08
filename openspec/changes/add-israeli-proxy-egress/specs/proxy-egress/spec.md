# Proxy Egress Capability

## ADDED Requirements

### Requirement: Single Proxy URL Environment Variable

The system SHALL expose exactly one environment variable, `BRIGHT_DATA_PROXY_URL`, that contains a full HTTP proxy URL (including scheme, embedded basic-auth credentials, host, and port) used to egress Israel-gated data-source API calls. No additional environment variables (customer ID, zone name, password, host, port, country, enabled-flag) SHALL be defined to configure the same proxy.

#### Scenario: Unset env var disables proxy
- **WHEN** `BRIGHT_DATA_PROXY_URL` is unset or equal to the empty string
- **THEN** the system SHALL treat proxying as disabled and all data-source clients SHALL egress directly (identical to pre-change behavior)

#### Scenario: Set env var enables proxy for opt-in clients
- **WHEN** `BRIGHT_DATA_PROXY_URL` is set to a non-empty value
- **THEN** the system SHALL route only the Knesset, Shufersal, and Rami Levy clients through the configured proxy
- **AND** all other data-source clients SHALL continue to egress directly

#### Scenario: No secondary enable flag exists
- **WHEN** a developer searches the codebase for an enable/disable toggle for the proxy
- **THEN** the only configuration surface SHALL be the presence or absence of `BRIGHT_DATA_PROXY_URL`

### Requirement: Bright Data Proxy Config Helper

The system SHALL provide a module `src/lib/proxy/bright-data.ts` that exports a function `getBrightDataProxyConfig()` returning either a cached `AxiosProxyConfig` object or the literal `false`, and this function SHALL be the single construction point for the Bright Data proxy configuration used anywhere in the application. The helper SHALL contain zero imports of Node-only packages (no `https-proxy-agent`, no `http`, no `net`, no `tls`) so that it remains safe to include in a client-reachable module graph.

#### Scenario: Returns false when env var is absent
- **WHEN** `process.env.BRIGHT_DATA_PROXY_URL` is `undefined` or empty
- **THEN** `getBrightDataProxyConfig()` SHALL return the literal `false`

#### Scenario: Returns a cached AxiosProxyConfig when env var is present
- **WHEN** `process.env.BRIGHT_DATA_PROXY_URL` is a non-empty string
- **AND** `getBrightDataProxyConfig()` is called two or more times in the same process
- **THEN** the function SHALL return the same `AxiosProxyConfig` object on every call (cached at module scope)

#### Scenario: Parses the URL via the standard URL API
- **WHEN** `getBrightDataProxyConfig()` is called for the first time with a valid URL in the env var
- **THEN** the function SHALL use the global `URL` constructor to parse the value
- **AND** SHALL decode percent-encoded username and password via `decodeURIComponent`
- **AND** SHALL populate an `AxiosProxyConfig` with `protocol` (scheme minus the colon), `host`, `port`, and `auth: { username, password }`

#### Scenario: Malformed URL surfaces loudly
- **WHEN** `BRIGHT_DATA_PROXY_URL` is present but not a valid URL
- **THEN** the first call to `getBrightDataProxyConfig()` SHALL throw an error originating from the `URL` constructor
- **AND** the system SHALL NOT silently fall back to direct egress

#### Scenario: Helper is fully isomorphic
- **WHEN** the helper module is included in a client bundle via the data-source registry chain
- **THEN** the bundler SHALL NOT attempt to resolve any Node-only module (`net`, `tls`, `http`, `https`, `https-proxy-agent`, `agent-base`, etc.)
- **AND** the build SHALL succeed

### Requirement: Selective Client Opt-In

Only the three data-source clients whose upstream APIs require Israeli egress SHALL import `getBrightDataProxyConfig()`: Knesset (`src/data-sources/knesset/api/knesset.client.ts`), Shufersal (`src/data-sources/shufersal/api/shufersal.client.ts`), and Rami Levy (`src/data-sources/rami-levy/api/rami-levy.client.ts`). All other data-source clients (CBS, DataGov, Budget, GovMap, Drugs, Health) SHALL NOT import the helper.

#### Scenario: Non-Israeli clients never pay the proxy hop
- **WHEN** a chat query triggers the CBS, DataGov, Budget, GovMap, Drugs, or Health agent
- **THEN** the outbound HTTP request SHALL NOT traverse `brd.superproxy.io` or any Bright Data infrastructure
- **AND** request latency SHALL NOT be affected by proxy configuration

#### Scenario: Adding a new proxied client is an explicit edit
- **WHEN** a future data source is identified as needing Israeli egress
- **THEN** enabling the proxy for it SHALL require an explicit import of `getBrightDataProxyConfig` in that client's file
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

#### Scenario: .env.example contains only a placeholder
- **WHEN** `.env.example` is inspected
- **THEN** it SHALL contain a `BRIGHT_DATA_PROXY_URL=` entry with an obviously fake placeholder value (e.g., `http://brd-customer-XXX-zone-YYY-country-il:REPLACE_ME@brd.superproxy.io:33335`)
- **AND** SHALL include a comment referencing the URL-encoding requirement for `@`, `:`, `#`, `/`, and `?` in passwords

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
