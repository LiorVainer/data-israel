# Change: Route Israel-gated data-source clients through a single proxy URL

## Why

Three data-source clients (Knesset OData, Shufersal, Rami Levy) return empty, HTML error pages, or time out when called from non-Israeli egress IPs (Vercel's default regions). The app needs Israeli egress for those specific clients only, while the other six data sources (CBS, DataGov, Budget, GovMap, Drugs, Health) must continue to egress directly with zero added latency.

The rest of the solution (signing up with Bright Data, choosing pay-as-you-go residential IL, creating a zone) happens outside the repo. The in-repo surface should be **one environment variable** — a full proxy URL — that developers paste once and forget.

## What Changes

- **ADDED** a new `proxy-egress` capability that owns the rule for how data-source clients opt into proxy egress.
- **ADDED** a single environment variable `BRIGHT_DATA_PROXY_URL` (full URL with embedded credentials, e.g. `http://brd-customer-hl_xxx-zone-residential_il-country-il:PASSWORD@brd.superproxy.io:33335`). No separate `BRIGHTDATA_CUSTOMER_ID`, `BRIGHTDATA_ZONE_PASSWORD`, `BRIGHTDATA_HOST`, etc.
- **ADDED** a shared helper `src/lib/proxy/bright-data.ts` exporting two functions:
  - `getBrightDataProxyConfig()` — reads `BRIGHT_DATA_PROXY_URL` (the residential zone, used by Knesset and Shufersal).
  - `getBrightDataUnlockerProxyConfig()` — reads `BRIGHT_DATA_UNLOCKER_URL` (the Web Unlocker zone, used by Rami Levy).

  Both helpers return `false` (axios's "disabled proxy" sentinel) when their env var is unset or empty, and a cached `AxiosProxyConfig` (parsed from the URL via the isomorphic `URL` API) when set. Auto-enable — presence of each URL is its own kill switch. No separate `BRIGHT_DATA_ENABLED` flag.
- **ADDED** opt-in wiring inside three existing axios instances:
  - `src/data-sources/knesset/api/knesset.client.ts` — `knessetInstance` uses `getBrightDataProxyConfig()`
  - `src/data-sources/shufersal/api/shufersal.client.ts` — `shufersalInstance` uses `getBrightDataProxyConfig()`
  - `src/data-sources/rami-levy/api/rami-levy.client.ts` — `ramiLevyInstance` **prefers** `getBrightDataUnlockerProxyConfig()` and **falls back** to `getBrightDataProxyConfig()` when the unlocker env var is unset. This is needed because rami-levy's WAF flags generic Bright Data residential IPs with HTTP 402 even when the geo check passes; the Web Unlocker zone handles TLS fingerprinting and IP reputation rotation server-side.

  **All other data-source clients remain untouched.**
- **NO new runtime dependencies.** Uses axios's native `proxy` field — no `https-proxy-agent`. That package transitively imports Node built-ins (`net`, `tls`), which Turbopack cannot keep out of the client bundle because the data-source registry is imported by client components, so any static reference to `https-proxy-agent` in a client-reachable module breaks the build.
- **ADDED** a disposable Next.js App Router route handler `src/app/api/debug/bright-data/route.ts` that verifies `geo.brdtest.com/welcome.txt` returns an Israeli IP and that each of the three clients returns a real response. Mirrors the style of the existing `src/app/api/debug/upstream-probe/route.ts`. Marked as temporary in its header and deleted after rollout is verified.

## Impact

- **Affected specs:** new capability `proxy-egress`. No modifications to `agent-tools`.
- **Affected code:**
  - New: `src/lib/proxy/bright-data.ts`, `src/app/api/debug/bright-data/route.ts` (temporary)
  - Modified: `src/data-sources/knesset/api/knesset.client.ts`, `src/data-sources/shufersal/api/shufersal.client.ts`, `src/data-sources/rami-levy/api/rami-levy.client.ts`
  - `package.json` — no new dependency (uses built-in axios `proxy` field)
  - `.env.example` — document `BRIGHT_DATA_PROXY_URL`
- **Affected infra:** Vercel env var `BRIGHT_DATA_PROXY_URL` must be set in Preview + Production. Absence of the var means clients egress directly (same behavior as today).
- **Cost:** Bright Data pay-as-you-go pricing. Residential zone (Knesset, Shufersal, rami-levy fallback) ≤ 1 GB/month = ≤ $4/month. Web Unlocker zone (rami-levy primary) at $1.50 per 1,000 successful requests — realistic chat-app usage is a handful per day = pennies per month. $5 signup credit covers both through initial testing.
- **Non-goals:** No broader proxy framework, no routing middleware, no per-request country switching, no proxy for non-Israeli APIs. Single URL, three clients, auto-detect.
