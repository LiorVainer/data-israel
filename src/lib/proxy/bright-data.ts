/**
 * Bright Data Proxy Config — Israeli egress for geo-gated APIs.
 *
 * This module returns axios-native proxy configs built from environment
 * variables. It exists to route a narrow set of data-source clients
 * (Knesset OData, Shufersal, Rami Levy) through Bright Data zones whose
 * exit nodes live in Israel. All other data-source clients MUST continue
 * to egress directly and MUST NOT import this helper.
 *
 * ## Two zones, two helpers
 *
 * 1. **Residential zone** (`BRIGHT_DATA_PROXY_URL` → `getBrightDataProxyConfig`)
 *    Generic Israeli residential IP pool — cheapest ($4/GB PAYG). Used for
 *    geo-gated targets that only check the IP's country: Knesset OData,
 *    Shufersal online store, and as a fallback for Rami Levy.
 *
 * 2. **Web Unlocker zone** (`BRIGHT_DATA_UNLOCKER_URL` → `getBrightDataUnlockerProxyConfig`)
 *    Bot-detection bypass product — higher per-request cost but handles
 *    TLS fingerprinting, Cloudflare clearance, JS challenges, and IP
 *    reputation rotation server-side. Used exclusively for targets whose
 *    bot detection blocks generic residential IPs — currently Rami Levy.
 *
 *    The unlocker zone is ALSO accessible via the same `brd.superproxy.io:33335`
 *    endpoint as the residential zone, just with a different zone name in
 *    the username. The helper shape is therefore identical to the
 *    residential one — only the env var it reads is different.
 *
 * ## Why axios's native `proxy` option (and not HttpsProxyAgent)
 *
 * `https-proxy-agent` statically imports Node built-ins (`net`, `tls`) at
 * the top of its dist, which Turbopack cannot tree-shake out of the client
 * bundle. Because `registry.ts` transitively pulls data-source API clients
 * into the browser bundle (for client-side tool metadata), any static
 * import of `https-proxy-agent` in a client module breaks the build.
 *
 * Axios's native `proxy: { host, port, auth }` option is pure data. Axios's
 * Node adapter handles HTTPS-over-HTTP CONNECT tunneling internally when
 * the library runs server-side; in the browser adapter the `proxy` field
 * is silently ignored. This module is therefore fully isomorphic.
 *
 * ## Configuration
 *
 *   BRIGHT_DATA_PROXY_URL=http://brd-customer-<id>-zone-<residential-zone>-country-il:<password>@brd.superproxy.io:33335
 *   BRIGHT_DATA_UNLOCKER_URL=http://brd-customer-<id>-zone-<unlocker-zone>:<password>@brd.superproxy.io:33335
 *
 * Presence of each variable is its own kill switch:
 * - Unset or empty → the corresponding helper returns `false` (axios's "disabled proxy" sentinel).
 * - Set           → the helper returns a parsed `AxiosProxyConfig`.
 *
 * There is no separate enable flag, no split customer-id / zone / password
 * variables, and no runtime validation beyond "is parseable as a URL".
 * Malformed URLs throw on first call (via `new URL(...)`), which is the
 * correct failure mode for a geo-unblocking helper — silent direct egress
 * would mask the original geo-block error we are trying to fix.
 *
 * ## URL encoding
 *
 * The password portion of each URL is inside userinfo and therefore must
 * have any of the following characters percent-encoded: `@` `:` `#` `/` `?`.
 * Bright Data zone passwords are normally plain alphanumeric. The helpers
 * call `decodeURIComponent` on both username and password so axios receives
 * the decoded credentials (axios base64-encodes them verbatim into the
 * `Proxy-Authorization` header).
 *
 * ## Axios usage
 *
 *   import { getBrightDataProxyConfig, getBrightDataUnlockerProxyConfig } from '@/lib/proxy/bright-data';
 *
 *   // Residential (Knesset, Shufersal):
 *   axios.create({ baseURL: ..., proxy: getBrightDataProxyConfig() });
 *
 *   // Unlocker with residential fallback (Rami Levy):
 *   const unlocker = getBrightDataUnlockerProxyConfig();
 *   const proxy = unlocker !== false ? unlocker : getBrightDataProxyConfig();
 *   axios.create({ baseURL: ..., proxy });
 *
 * Do not combine this with `httpsAgent`/`httpAgent` — axios will ignore the
 * `proxy` field when a custom `httpsAgent` is set.
 *
 * ## Allowed callers
 *
 * - `src/data-sources/knesset/api/knesset.client.ts`    (residential)
 * - `src/data-sources/shufersal/api/shufersal.client.ts` (residential)
 * - `src/data-sources/rami-levy/api/rami-levy.client.ts` (unlocker, fallback residential)
 * - `src/app/api/debug/bright-data/route.ts`             (both, for verification)
 *
 * Do not import this helper from any other module.
 */

import type { AxiosProxyConfig } from 'axios';

let cachedResidentialConfig: AxiosProxyConfig | false | undefined;
let cachedUnlockerConfig: AxiosProxyConfig | false | undefined;

function parseProxyUrl(url: string): AxiosProxyConfig {
    const parsed = new URL(url);
    const protocol = parsed.protocol.replace(':', '');
    const port = parsed.port.length > 0 ? Number(parsed.port) : protocol === 'https' ? 443 : 80;

    return {
        protocol,
        host: parsed.hostname,
        port,
        auth: {
            username: decodeURIComponent(parsed.username),
            password: decodeURIComponent(parsed.password),
        },
    };
}

/**
 * Return a cached axios proxy config parsed from `BRIGHT_DATA_PROXY_URL`
 * (the residential zone), or `false` when the env var is unset / empty.
 *
 * `false` is axios's native sentinel for "disable proxying", so callers
 * can spread the return value into `axios.create({ proxy })` unconditionally.
 *
 * The result is cached at module scope so the URL is parsed once per Node
 * process (Vercel Fluid Compute warm instances).
 */
export function getBrightDataProxyConfig(): AxiosProxyConfig | false {
    if (cachedResidentialConfig !== undefined) {
        return cachedResidentialConfig;
    }

    const url = process.env.BRIGHT_DATA_PROXY_URL;
    if (!url || url.trim().length === 0) {
        cachedResidentialConfig = false;
        return cachedResidentialConfig;
    }

    cachedResidentialConfig = parseProxyUrl(url);
    return cachedResidentialConfig;
}

/**
 * Return a cached axios proxy config parsed from `BRIGHT_DATA_UNLOCKER_URL`
 * (the Web Unlocker zone), or `false` when the env var is unset / empty.
 *
 * Used exclusively by `rami-levy.client.ts`, which falls back to
 * `getBrightDataProxyConfig()` when this returns `false`. That way the
 * unlocker is optional: if the operator hasn't provisioned the unlocker
 * zone, rami-levy still attempts the residential path (and will hit the
 * same bot-detection 402 as before, but the failure mode is identical to
 * the pre-unlocker state — no new breakage).
 *
 * The parse/cache behavior is identical to `getBrightDataProxyConfig`.
 */
export function getBrightDataUnlockerProxyConfig(): AxiosProxyConfig | false {
    if (cachedUnlockerConfig !== undefined) {
        return cachedUnlockerConfig;
    }

    const url = process.env.BRIGHT_DATA_UNLOCKER_URL;
    if (!url || url.trim().length === 0) {
        cachedUnlockerConfig = false;
        return cachedUnlockerConfig;
    }

    cachedUnlockerConfig = parseProxyUrl(url);
    return cachedUnlockerConfig;
}
