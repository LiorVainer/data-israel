# Change: Route Israel-gated data-source clients through a single proxy URL

## Why

Three data-source clients (Knesset OData, Shufersal, Rami Levy) return empty, HTML error pages, or time out when called from non-Israeli egress IPs (Vercel's default regions). The app needs Israeli egress for those specific clients only, while the other six data sources (CBS, DataGov, Budget, GovMap, Drugs, Health) must continue to egress directly with zero added latency.

The rest of the solution (signing up with Bright Data, choosing pay-as-you-go residential IL, creating a zone) happens outside the repo. The in-repo surface should be **one environment variable** — a full proxy URL — that developers paste once and forget.

## What Changes

- **ADDED** a new `proxy-egress` capability that owns the rule for how data-source clients opt into proxy egress.
- **ADDED** a single environment variable `BRIGHT_DATA_PROXY_URL` (full URL with embedded credentials, e.g. `http://brd-customer-hl_xxx-zone-residential_il-country-il:PASSWORD@brd.superproxy.io:33335`). No separate `BRIGHTDATA_CUSTOMER_ID`, `BRIGHTDATA_ZONE_PASSWORD`, `BRIGHTDATA_HOST`, etc.
- **ADDED** a shared helper `src/lib/proxy/bright-data.ts` exporting three functions:
  - `getBrightDataProxyConfig()` — reads `BRIGHT_DATA_PROXY_URL` (the residential zone).
  - `getBrightDataUnlockerProxyConfig()` — reads `BRIGHT_DATA_UNLOCKER_URL` (the Web Unlocker zone).
  - `resolveProxyConfig(tier: ProxyTier)` — central dispatcher that takes a routing tier and returns the right `AxiosProxyConfig | false`. Handles the three tiers (`direct` / `residential` / `unlocker`). No-ops to `false` in the client bundle (`typeof window !== 'undefined'`) to avoid reading server-only env vars at client module load.

  The two URL helpers unconditionally return a cached `AxiosProxyConfig` parsed from their respective env vars. Both env vars are **required** by `src/lib/env.ts` validation at startup — missing values cause the app to fail fast with a clear error rather than silently fall back to direct egress. The only way to opt a data source out of proxying is to declare its tier as `'direct'` in `PROXY_ROUTING`.
- **ADDED** a declarative routing registry at `src/data-sources/proxy-routing.ts` that maps every `DataSource` ID to a `ProxyTier`. TypeScript's `satisfies Record<DataSource, ProxyTier>` check guarantees every data source has an explicit tier — forgetting one becomes a compile error. Client files read their tier from this registry rather than hardcoding proxy logic.
- **ADDED** a CLI classification script at `src/scripts/classify-source.ts` (run via `pnpm classify-source --url=... [--method=...] [--body=...] [--headers=...]`). The script probes the upstream through four egress paths in parallel and recommends a `PROXY_ROUTING` tier. Critical for development: uses a third dev-only environment variable `BRIGHT_DATA_PROBE_URL` — a Bright Data proxy URL forced to a **non-Israeli** country — to simulate Vercel's non-Israeli egress from the developer's local Israeli machine. Without the non-IL probe, testing from an Israeli home ISP falsely reports every geo-gated endpoint as "works fine." The probe variable is never read by production clients.
- **ADDED** opt-in wiring inside three existing axios instances. All three read their tier from `PROXY_ROUTING` and call `resolveProxyConfig` — they do NOT hardcode which env var or fallback logic to use:
  - `src/data-sources/knesset/api/knesset.client.ts` — `proxy: resolveProxyConfig(PROXY_ROUTING.knesset)` (tier = `residential`)
  - `src/data-sources/shufersal/api/shufersal.client.ts` — `proxy: resolveProxyConfig(PROXY_ROUTING.shufersal)` (tier = `residential`)
  - `src/data-sources/rami-levy/api/rami-levy.client.ts` — `proxy: resolveProxyConfig(PROXY_ROUTING['rami-levy'])` (tier = `unlocker`). The unlocker tier is needed because rami-levy's WAF flags generic Bright Data residential IPs with HTTP 402 even when the geo check passes; Web Unlocker handles TLS fingerprinting and IP reputation rotation server-side. No residential fallback exists — if `BRIGHT_DATA_UNLOCKER_URL` is misconfigured, the app fails at startup via env.ts validation, not at rami-levy request time.

  **All other data-source clients remain untouched.** Changing any client's tier is a one-line edit in `proxy-routing.ts`, not a client file edit.
- **NO new runtime dependencies.** Uses axios's native `proxy` field — no `https-proxy-agent`. That package transitively imports Node built-ins (`net`, `tls`), which Turbopack cannot keep out of the client bundle because the data-source registry is imported by client components, so any static reference to `https-proxy-agent` in a client-reachable module breaks the build.
- **ADDED** a disposable Next.js App Router route handler `src/app/api/debug/bright-data/route.ts` that verifies `geo.brdtest.com/welcome.txt` returns an Israeli IP and that each of the three clients returns a real response. Mirrors the style of the existing `src/app/api/debug/upstream-probe/route.ts`. Marked as temporary in its header and deleted after rollout is verified.

## Impact

- **Affected specs:** new capability `proxy-egress`. No modifications to `agent-tools`.
- **Affected code:**
  - New: `src/lib/proxy/bright-data.ts`, `src/data-sources/proxy-routing.ts`, `src/scripts/classify-source.ts`, `src/app/api/debug/bright-data/route.ts` (temporary)
  - Modified: `src/data-sources/knesset/api/knesset.client.ts`, `src/data-sources/shufersal/api/shufersal.client.ts`, `src/data-sources/rami-levy/api/rami-levy.client.ts`
  - `package.json` — no new dependency; adds `classify-source` npm script using existing `tsx`
  - `.env.example` — documents `BRIGHT_DATA_PROXY_URL`, `BRIGHT_DATA_UNLOCKER_URL`, and `BRIGHT_DATA_PROBE_URL` (the last is dev-only)
- **Affected infra:** Vercel env var `BRIGHT_DATA_PROXY_URL` must be set in Preview + Production. Absence of the var means clients egress directly (same behavior as today).
- **Cost:** Bright Data pay-as-you-go pricing. Residential zone (Knesset, Shufersal, rami-levy fallback) ≤ 1 GB/month = ≤ $4/month. Web Unlocker zone (rami-levy primary) at $1.50 per 1,000 successful requests — realistic chat-app usage is a handful per day = pennies per month. $5 signup credit covers both through initial testing.
- **Non-goals:** No broader proxy framework, no routing middleware, no per-request country switching, no proxy for non-Israeli APIs. Single URL, three clients, auto-detect.
