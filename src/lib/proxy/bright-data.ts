/**
 * Bright Data Proxy Config — Israeli egress for geo-gated APIs.
 *
 * This module returns an axios-native proxy config built from a single
 * environment variable. It exists to route a narrow set of data-source
 * clients (Knesset OData, Shufersal, Rami Levy) through a Bright Data
 * proxy zone whose exit nodes live in Israel. All other data-source
 * clients MUST continue to egress directly and MUST NOT import this helper.
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
 * is silently ignored. This helper is therefore fully isomorphic.
 *
 * ## Configuration
 *
 * A single environment variable drives everything:
 *
 *   BRIGHT_DATA_PROXY_URL=http://brd-customer-<id>-zone-<zone>-country-il:<password>@brd.superproxy.io:33335
 *
 * Presence of the variable is the kill switch:
 * - Unset or empty → returns `false` (axios's "disabled proxy" sentinel).
 * - Set           → returns a parsed `AxiosProxyConfig`.
 *
 * There is no separate enable flag, no split customer-id / zone / password
 * variables, and no runtime validation beyond "is parseable as a URL".
 * Malformed URLs throw on first call (via `new URL(...)`), which is the
 * correct failure mode for a geo-unblocking helper — silent direct egress
 * would mask the original geo-block error we are trying to fix.
 *
 * ## URL encoding
 *
 * The password portion of the URL is inside userinfo and therefore must have
 * any of the following characters percent-encoded: `@` `:` `#` `/` `?`.
 * Bright Data zone passwords are normally plain alphanumeric. This helper
 * calls `decodeURIComponent` on both username and password so axios receives
 * the decoded credentials (axios base64-encodes them verbatim into the
 * `Proxy-Authorization` header).
 *
 * ## Axios usage
 *
 *   import { getBrightDataProxyConfig } from '@/lib/proxy/bright-data';
 *
 *   const proxy = getBrightDataProxyConfig();
 *   axios.create({
 *     baseURL: ...,
 *     proxy,          // `false` disables, AxiosProxyConfig enables
 *   });
 *
 * Do not combine this with `httpsAgent`/`httpAgent` — axios will ignore the
 * `proxy` field when a custom `httpsAgent` is set.
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

import type { AxiosProxyConfig } from 'axios';

let cachedConfig: AxiosProxyConfig | false | undefined;

/**
 * Return a cached axios proxy config parsed from `BRIGHT_DATA_PROXY_URL`,
 * or `false` when the env var is unset / empty. `false` is axios's native
 * sentinel for "disable proxying", so callers can spread the return value
 * into `axios.create({ proxy })` unconditionally.
 *
 * The result is cached at module scope so the URL is parsed once per Node
 * process (Vercel Fluid Compute warm instances).
 */
export function getBrightDataProxyConfig(): AxiosProxyConfig | false {
    if (cachedConfig !== undefined) {
        return cachedConfig;
    }

    const url = process.env.BRIGHT_DATA_PROXY_URL;
    if (!url || url.trim().length === 0) {
        cachedConfig = false;
        return cachedConfig;
    }

    const parsed = new URL(url);
    const protocol = parsed.protocol.replace(':', '');
    const port = parsed.port.length > 0 ? Number(parsed.port) : protocol === 'https' ? 443 : 80;

    cachedConfig = {
        protocol,
        host: parsed.hostname,
        port,
        auth: {
            username: decodeURIComponent(parsed.username),
            password: decodeURIComponent(parsed.password),
        },
    };
    return cachedConfig;
}
