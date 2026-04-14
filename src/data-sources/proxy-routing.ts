/**
 * Proxy Routing Registry — declarative map of which Bright Data zone each
 * data source should egress through.
 *
 * This file is the single source of truth for proxy routing decisions.
 * Adding a new data source requires adding exactly one entry here; the
 * TypeScript `satisfies` check below guarantees that every `DataSource`
 * ID has an explicit routing tier, so forgetting a source becomes a
 * compile error.
 *
 * ## Tiers
 *
 * - **`direct`** — no proxy. Default. Use when the upstream API works from
 *   any egress (most data sources: CBS, DataGov, Budget, GovMap, Health).
 *
 * - **`residential`** — route through `BRIGHT_DATA_PROXY_URL` (Israeli
 *   residential zone). Use when the upstream geo-gates non-Israeli egress
 *   but accepts clean Israeli residential IPs. Currently: Knesset OData,
 *   Shufersal online store.
 *
 * - **`unlocker`** — route through `BRIGHT_DATA_UNLOCKER_URL` (Web
 *   Unlocker zone). Use when the residential zone passes the geo gate
 *   but the upstream's WAF flags Bright Data residential IPs (symptom:
 *   HTTP 402, Cloudflare challenge page, "Access Denied" HTML). Both
 *   env vars are required at startup (see `src/lib/env.ts`), so there
 *   is no fallback to residential — if the unlocker config is wrong,
 *   the app fails at startup rather than silently degrading.
 *   Currently: Rami Levy.
 *
 * ## How to pick the right tier for a new data source
 *
 * Run the classification script from your local machine:
 *
 *     pnpm classify-source --url=https://api.example.gov.il/endpoint
 *
 * The script probes the URL through four paths (direct from your machine,
 * non-IL Bright Data proxy to simulate Vercel egress, IL residential, and
 * Web Unlocker) and recommends a tier. Paste the result into this file.
 *
 * See `src/data-sources/CLAUDE.md` Step 0 for the full workflow.
 */

import type { DataSource } from './types/display.types';

export type ProxyTier = 'direct' | 'residential' | 'unlocker';

export const PROXY_ROUTING = {
    cbs: 'direct',
    datagov: 'direct',
    budget: 'direct',
    govmap: 'direct',
    health: 'direct',
    knesset: 'residential',
    shufersal: 'residential',
    'rami-levy': 'unlocker',
} as const satisfies Record<DataSource, ProxyTier>;

/**
 * Look up the proxy tier for a data source. Type-safe — the parameter
 * type is the `DataSource` union, and TypeScript will reject an unknown
 * source ID at compile time.
 */
export function getProxyTier(source: DataSource): ProxyTier {
    return PROXY_ROUTING[source];
}
