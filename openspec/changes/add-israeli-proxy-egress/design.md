## Context

Three of eight data-source clients call APIs that only respond reliably from Israeli egress IPs:
- **Knesset OData** (`https://knesset.gov.il/Odata/ParliamentInfo.svc/`) — measured 30 KB/call
- **Shufersal** (`https://www.shufersal.co.il/online/he/search/results`) — ~15 KB/call
- **Rami Levy** (`https://www.rami-levy.co.il/api/catalog`) — ~20 KB/call

The other five clients (CBS, DataGov, Budget, GovMap, Drugs, Health) work fine from any region and must not pay the ~150–300 ms proxy-hop tax.

The app is deployed on Vercel. Fluid Compute runs full Node.js, so any Node-native HTTP proxy library works without edge-runtime gymnastics. Bright Data residential proxies provide Israel country-targeting free at $4/GB pay-as-you-go with a $5 signup credit — enough to cover the first several months of realistic chat-app traffic.

## Goals / Non-Goals

**Goals**
- One env var. The dev copies a single URL into `.env.local` and the app auto-detects it.
- Zero code touch for non-Israeli data sources.
- Kill switch: unsetting the env var reverts to direct egress with no redeploy semantics beyond a normal Vercel env update.
- Minimum code footprint — target is a single helper file (~30 lines) plus three two-line edits.
- Minimum operational complexity — no infra, no routing tier, no separate service.

**Non-Goals**
- No generalized proxy framework (multi-region, per-request country, rotating pools).
- No proxy for other data sources unless/until they exhibit the same symptom.
- No automatic fallback to direct egress on proxy error — if Bright Data is misconfigured the three clients fail loudly, because silently bypassing the proxy would hide geo-block errors and make debugging harder.
- No request-level instrumentation or per-provider bandwidth accounting in this change; Bright Data's dashboard is the source of truth for usage.
- No CI enforcement of the smoke-test script in this change.

## Decisions

### Decision 1: Single `BRIGHT_DATA_PROXY_URL` env var, not a split config

The proxy URL has the form:

```
http://brd-customer-<id>-zone-<zone>-country-il:<password>@brd.superproxy.io:33335
```

All six components are meaningful together and none are swapped independently. Splitting them into six env vars (`BRIGHTDATA_CUSTOMER_ID`, `BRIGHTDATA_ZONE`, `BRIGHTDATA_ZONE_PASSWORD`, `BRIGHTDATA_COUNTRY`, `BRIGHTDATA_HOST`, `BRIGHTDATA_PORT`) adds surface area for misconfiguration (e.g., password set but zone missing = silent direct egress) and burdens the developer with six dashboard lookups.

**One URL, one atomic truth.** If the URL is present, proxy on. If absent, proxy off. No partial state is possible.

**Alternatives considered:**
- *Six split vars, all required*: rejected — high misconfiguration risk, more code, same information content.
- *Six split vars + a derived `BRIGHT_DATA_PROXY_URL`*: rejected — two ways to configure the same thing is worse than one.
- *Config file (`proxy.config.ts`)*: rejected — credentials in config files leak via commits.

**Trade-off:** URL-encoding rules are now the developer's responsibility. Passwords containing `@`, `:`, `#`, `/`, `?` must be percent-encoded. This is documented in `.env.example` and in the helper's JSDoc. Bright Data zone passwords are typically alphanumeric so this is rarely a real issue, but the spec states it explicitly.

### Decision 2: Presence of the env var is the kill switch — no separate `BRIGHT_DATA_ENABLED`

Rationale: two env vars for one boolean is one too many. The first version of this design had both, and that created the failure mode "URL is set but ENABLED=false → developer thinks proxy is on, wonders why traffic is direct." Reducing to one var eliminates that class of mistake.

To temporarily disable the proxy in a running deployment, the operator sets `BRIGHT_DATA_PROXY_URL=` (empty string) in Vercel and redeploys, or deletes the var. The helper treats empty and undefined identically.

**Alternatives considered:**
- *Separate `BRIGHT_DATA_ENABLED`*: rejected — see above.
- *Treat any non-empty string as "on" including obvious junk*: the helper does not validate the URL beyond "non-empty"; `new URL(...)` inside `HttpsProxyAgent` will throw on malformed input and the error surfaces on first request, which is the correct failure mode (loud, early).

### Decision 3: Opt-in at each client, not global

Only the three problematic clients import `getBrightDataAgent()` and wire it into their axios instance. The other data-source clients never touch the helper. This guarantees:
- No accidental proxying of CBS / DataGov / Budget / GovMap / Drugs / Health.
- No central "proxy routing" table to maintain.
- The decision "this client needs Israeli egress" lives in the same file as the client itself, which is the obvious place to look for it.

**Alternatives considered:**
- *Global fetch interceptor that routes by hostname*: rejected — magic behavior at a distance, hard to reason about, risk of accidental match on wrong hosts.
- *A `proxyClients.ts` allowlist*: rejected — same information as the imports, one more file to keep in sync.

### Decision 4: Cache the `HttpsProxyAgent` instance

`getBrightDataAgent()` caches the agent in a module-level `let` on first call. Reasons:
- `HttpsProxyAgent` maintains a connection pool internally; re-creating it per request defeats keep-alive.
- The three client modules are imported once per Node process; they call `getBrightDataAgent()` during `axios.create()` at module load. One creation per process is correct.
- The cache is reset on fresh Fluid Compute cold starts, which is fine — Bright Data's CONNECT handshake is ~100 ms, negligible compared to the first cold-start cost anyway.

### Decision 5: `proxy: false` is mandatory alongside `httpsAgent`

Confirmed from axios docs (via Context7): when supplying a custom `httpsAgent`, axios still runs its own proxy layer unless `proxy: false` is set explicitly. Without it, axios would try to layer its default proxy config (from `HTTP_PROXY` env var, for example) on top of our `HttpsProxyAgent`, producing unpredictable routing. The spec requires all three modified clients to spread `{ httpsAgent, httpAgent, proxy: false }` together as an atomic unit.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Bright Data zone credentials leak into a commit | Env var, `.env.local` is gitignored (verify in task), `.env.example` uses placeholder |
| Proxy outage breaks Knesset/Shufersal/Rami Levy | Intentional loud failure; operator clears the env var in Vercel to revert to direct egress (which will also fail for Knesset due to geo-block, but that's a pre-existing state) |
| Bandwidth blowup via bulk scraping | This change does not add bulk scraping. Any future cron that hits Shufersal `PriceFull` XML dumps must not reuse the proxied axios instance — call it out in the helper's JSDoc and in `tasks.md` |
| Rami Levy POST through CONNECT tunnel fails in some environments | Smoke-test script specifically tests the Rami Levy POST; failures surface in Phase 4, before production deploy |
| URL-encoding mistake in zone password | `.env.example` notes the rule; `geo.brdtest.com` smoke test catches auth failures immediately with a clear error |
| Vercel env var not mirrored to Preview | Tasks explicitly enumerate all three environments (Development, Preview, Production) |

## Migration Plan

1. Ship the helper + three client edits behind an absent env var (no behavioral change).
2. Set `BRIGHT_DATA_PROXY_URL` in Vercel Preview only.
3. Run smoke tests against the preview URL.
4. If preview is healthy after one query of each affected agent, set the var in Production.
5. Rollback: unset the var in Vercel and redeploy. Code change stays in place; direct egress resumes.

## Open Questions

None. The residential-vs-datacenter product choice lives outside the repo (Bright Data dashboard); from the code's perspective it's the same URL shape.
