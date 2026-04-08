/**
 * Bright Data Proxy Agent — Israeli egress for geo-gated APIs.
 *
 * This module exists to route a narrow set of data-source clients (Knesset
 * OData, Shufersal, Rami Levy) through a Bright Data proxy zone whose exit
 * nodes live in Israel. All other data-source clients MUST continue to egress
 * directly and MUST NOT import this helper.
 *
 * ## Configuration
 *
 * A single environment variable drives everything:
 *
 *   BRIGHT_DATA_PROXY_URL=http://brd-customer-<id>-zone-<zone>-country-il:<password>@brd.superproxy.io:33335
 *
 * Presence of the variable is the kill switch:
 * - Unset or empty → `getBrightDataAgent()` returns `null` and clients egress directly.
 * - Set           → `getBrightDataAgent()` returns a cached `HttpsProxyAgent` singleton.
 *
 * There is no separate enable flag, no split customer-id / zone / password
 * variables, and no runtime validation of URL shape beyond non-emptiness.
 * Malformed URLs surface loudly on the first proxied request, which is the
 * correct failure mode for a geo-unblocking helper — silent direct egress
 * would mask the original geo-block error we are trying to fix.
 *
 * ## URL encoding
 *
 * The password portion of the URL is inside userinfo and therefore must have
 * any of the following characters percent-encoded: `@` `:` `#` `/` `?`.
 * Bright Data zone passwords are normally plain alphanumeric, but this is the
 * user's responsibility if they set a custom password.
 *
 * ## Axios usage
 *
 * When wiring this agent into an axios instance, all three of `httpsAgent`,
 * `httpAgent`, and `proxy: false` MUST be set together:
 *
 *   const agent = getBrightDataAgent();
 *   axios.create({
 *     baseURL: ...,
 *     ...(agent && { httpsAgent: agent, httpAgent: agent, proxy: false as const }),
 *   });
 *
 * Without `proxy: false` axios would attempt to layer its own proxy resolution
 * on top of our `HttpsProxyAgent`, producing unpredictable routing.
 *
 * ## Allowed callers
 *
 * - `src/data-sources/knesset/api/knesset.client.ts`
 * - `src/data-sources/shufersal/api/shufersal.client.ts`
 * - `src/data-sources/rami-levy/api/rami-levy.client.ts`
 * - `src/app/api/debug/bright-data/route.ts` (disposable verification route)
 *
 * Do not import this helper from any other module.
 */

import { HttpsProxyAgent } from 'https-proxy-agent';

let cachedAgent: HttpsProxyAgent<string> | null | undefined;

/**
 * Return a cached `HttpsProxyAgent` built from `BRIGHT_DATA_PROXY_URL`, or
 * `null` when the env var is unset / empty.
 *
 * The result is cached at module scope so that:
 * - The `HttpsProxyAgent` connection pool persists across requests in a
 *   single Node process (Vercel Fluid Compute warm instances).
 * - Misconfiguration is detected on first construction, not on every call.
 */
export function getBrightDataAgent(): HttpsProxyAgent<string> | null {
    if (cachedAgent !== undefined) {
        return cachedAgent;
    }

    const url = process.env.BRIGHT_DATA_PROXY_URL;
    if (!url || url.trim().length === 0) {
        cachedAgent = null;
        return cachedAgent;
    }

    cachedAgent = new HttpsProxyAgent(url);
    return cachedAgent;
}
