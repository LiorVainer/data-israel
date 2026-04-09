---
paths:
  - "src/data-sources/**/*.client.ts"
  - "src/data-sources/proxy-routing.ts"
  - "src/lib/proxy/**"
  - "src/lib/env.ts"
---

# Data Sources — Proxy Tier Classification & Wiring

Rules for choosing and wiring the Bright Data proxy tier used by a data-source client file. Applies to **all** data-source clients, including nested multi-layer clients (e.g. `govmap/api/nadlan/nadlan.client.ts`, `health/api/drugs/drugs.client.ts`).

> The glob uses `**` (not `*/api/*`) intentionally — nested sub-API clients would otherwise be silently missed, which is the wrong failure mode for high-consequence proxy rules.

## Step 0 — Classify the upstream BEFORE writing any code

Before implementing or upgrading a data-source client, determine whether the upstream API requires proxying and — if so — which Bright Data zone. Use the **classification script** rather than guessing: it runs the same request through four egress paths in parallel and recommends a tier.

```bash
pnpm classify-source --url=https://api.example.gov.il/v1/resource

# For POST endpoints:
pnpm classify-source \
  --url=https://www.example.co.il/api/search \
  --method=POST \
  --body='{"q":"חלב"}' \
  --headers='{"locale":"he"}'
```

The script requires `BRIGHT_DATA_PROBE_URL` in `.env` — a Bright Data proxy URL forced to a **NON-Israeli** country (see `.env.example`). This is crucial because testing from your own Israeli home ISP would falsely report every geo-gated endpoint as "works fine" — the whole point of the probe is to **simulate Vercel's non-Israeli egress** without physically being outside Israel.

### The four probes

1. **`direct`** — from your local machine (establishes the baseline "correct" response)
2. **`non-il`** — through `BRIGHT_DATA_PROBE_URL` (simulates Vercel egress)
3. **`residential`** — through `BRIGHT_DATA_PROXY_URL` (IL residential zone)
4. **`unlocker`** — through `BRIGHT_DATA_UNLOCKER_URL` (Web Unlocker)

### Recommendation → PROXY_ROUTING tier

- `direct` → API works from any egress; no proxy needed
- `residential` → geo-gated only; IL residential zone is sufficient
- `unlocker` → bot-detection; needs Web Unlocker

Paste the recommended tier into `src/data-sources/proxy-routing.ts`. The routing registry is the single source of truth — data-source client files **never** hardcode their proxy config; they just call `resolveProxyConfig(PROXY_ROUTING['my-source'])`.

## Client file wiring — always reads from PROXY_ROUTING

Every data-source client that needs a proxy follows the same pattern — read its tier from the declarative `PROXY_ROUTING` registry and pass it through `resolveProxyConfig`. **Do NOT write per-client proxy logic.**

```typescript
// src/data-sources/{name}/api/{name}.client.ts
import axios, { type AxiosInstance } from 'axios';
import { resolveProxyConfig } from '@/lib/proxy/bright-data';
import { PROXY_ROUTING } from '@/data-sources/proxy-routing';
import { MY_BASE_URL } from './{name}.endpoints';

// Routing tier comes from the declarative PROXY_ROUTING registry.
// To change which zone this client uses, edit proxy-routing.ts — not this file.
const myInstance: AxiosInstance = axios.create({
    baseURL: MY_BASE_URL,
    timeout: 30_000,
    headers: { Accept: 'application/json', 'User-Agent': 'DataIsrael-Agent/1.0' },
    proxy: resolveProxyConfig(PROXY_ROUTING['my-source-id']),
});
```

`resolveProxyConfig` handles the three tiers transparently:

- `'direct'` → returns `false` (axios proxy disabled)
- `'residential'` → returns the `BRIGHT_DATA_PROXY_URL` config (guaranteed present — `env.ts` marks it required)
- `'unlocker'` → returns the `BRIGHT_DATA_UNLOCKER_URL` config (guaranteed present — `env.ts` marks it required)

Both env vars are **required at startup** by `src/lib/env.ts`. If either is missing, the app refuses to start — there is no silent "direct egress" fallback. This is intentional: a missing proxy env var in production would silently break rami-levy / knesset / shufersal and mask the misconfiguration.

## Hard rules

- **Only import `resolveProxyConfig` and `PROXY_ROUTING` in client files** — never from tools, agents, or UI code.
- **Do NOT use `httpsAgent`/`httpAgent` with `https-proxy-agent`** — that package statically imports Node `net`/`tls` and breaks the client bundle via the data-source registry chain. Stick to axios's native `proxy` field, which is isomorphic.
- **Start with the `direct` tier.** Only upgrade after `pnpm classify-source` recommends `residential` or `unlocker`.
- **Bright Data billing is per GB (residential) or per-request (unlocker).** Never proxy bulk-scraping endpoints (full XML price dumps, archive downloads, etc.) — call them out in the proposal and keep them on direct egress with a separate scraping path.
- **If `classify-source` says the API works fine from non-Israeli egress**, do **not** wire the proxy. The ~150–300 ms proxy hop is pure cost for no benefit.
- **When upgrading a client's tier because of an empirical failure**, add a comment above the `proxy:` field explaining *why* (e.g., `// HTTP 402 from residential pool — Rami-Levy's WAF flags Bright Data IPs`) so future maintainers don't revert the tier.
