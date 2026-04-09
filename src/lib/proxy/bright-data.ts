/**
 * Bright Data Proxy Config — Israeli egress for geo-gated APIs.
 *
 * This module returns axios-native proxy configs parsed from the Bright
 * Data URLs declared in `src/lib/env.ts`. It reads those URLs directly
 * from `process.env` at use-site (not through the `ENV` export of
 * `@/lib/env`) so that tests which mock `@/lib/env` don't break the proxy
 * path — see the per-function docs below. It exists to route a narrow set
 * of data-source clients (Knesset OData, Shufersal, Rami Levy) through
 * Bright Data zones whose exit nodes live in Israel. All other data-source
 * clients MUST continue to egress directly and MUST NOT import from here.
 *
 * ## Two zones
 *
 * 1. **Residential zone** (`BRIGHT_DATA_PROXY_URL`)
 *    Generic Israeli residential IP pool — cheapest ($4/GB PAYG). Used for
 *    geo-gated targets that only check the IP's country: Knesset OData,
 *    Shufersal online store.
 *
 * 2. **Web Unlocker zone** (`BRIGHT_DATA_UNLOCKER_URL`)
 *    Bot-detection bypass product — higher per-request cost but handles
 *    TLS fingerprinting, Cloudflare clearance, JS challenges, and IP
 *    reputation rotation server-side. Used exclusively for targets whose
 *    bot detection blocks generic residential IPs — currently Rami Levy.
 *
 *    The unlocker zone is ALSO accessible via the same `brd.superproxy.io:33335`
 *    endpoint as the residential zone, just with a different zone name in
 *    the username. The helper shape is therefore identical — only the env
 *    var it reads is different.
 *
 * ## Env guarantees
 *
 * Both `BRIGHT_DATA_PROXY_URL` and `BRIGHT_DATA_UNLOCKER_URL` are **required**
 * in `src/lib/env.ts`. If either is missing, the app fails to start with a
 * clear error — there is no silent "direct egress" fallback. This is
 * intentional: a missing proxy env var would mask geo-block failures and
 * make debugging harder.
 *
 * As a result, the helpers in this module unconditionally return an
 * `AxiosProxyConfig` (not `AxiosProxyConfig | false`). The only way to opt
 * out of proxying is to assign a client the `'direct'` tier in
 * `src/data-sources/proxy-routing.ts`.
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
 * ## URL encoding
 *
 * The password portion of each URL is inside userinfo and therefore must
 * have any of the following characters percent-encoded: `@` `:` `#` `/` `?`.
 * Bright Data zone passwords are normally plain alphanumeric. The helpers
 * call `decodeURIComponent` on both username and password so axios receives
 * the decoded credentials (axios base64-encodes them verbatim into the
 * `Proxy-Authorization` header).
 *
 * ## Usage
 *
 *   import { resolveProxyConfig } from '@/lib/proxy/bright-data';
 *   import { PROXY_ROUTING } from '@/data-sources/proxy-routing';
 *
 *   axios.create({
 *     baseURL: ...,
 *     proxy: resolveProxyConfig(PROXY_ROUTING['my-source-id']),
 *   });
 *
 * Do not combine the result with `httpsAgent`/`httpAgent` — axios will
 * ignore the `proxy` field when a custom `httpsAgent` is set.
 *
 * ## Allowed callers
 *
 * - `src/data-sources/knesset/api/knesset.client.ts`    (via PROXY_ROUTING.knesset)
 * - `src/data-sources/shufersal/api/shufersal.client.ts` (via PROXY_ROUTING.shufersal)
 * - `src/data-sources/rami-levy/api/rami-levy.client.ts` (via PROXY_ROUTING['rami-levy'])
 * - `src/app/api/debug/bright-data/route.ts`             (direct, for verification)
 *
 * Do not import from any other module.
 */

import type { AxiosProxyConfig } from 'axios';
import type { ProxyTier } from '@/data-sources/proxy-routing';

let cachedResidentialConfig: AxiosProxyConfig | undefined;
let cachedUnlockerConfig: AxiosProxyConfig | undefined;

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
 * (the residential zone). The env var is required at startup (validated by
 * `src/lib/env.ts`), so this function always returns a valid `AxiosProxyConfig`
 * in production. The result is cached at module scope — parsed once per
 * Node process.
 *
 * Reads `process.env` directly rather than `ENV` from `@/lib/env` so that
 * tests which mock `@/lib/env` don't accidentally blank out the proxy URL
 * here. `vitest.config.ts` loads `.env` into `process.env` at startup, so
 * the test suite picks up the real values without needing per-test mocks.
 */
export function getBrightDataProxyConfig(): AxiosProxyConfig {
    if (cachedResidentialConfig !== undefined) {
        return cachedResidentialConfig;
    }
    const url = process.env.BRIGHT_DATA_PROXY_URL;
    if (!url) {
        throw new Error(
            'BRIGHT_DATA_PROXY_URL is missing from process.env — src/lib/env.ts validation should have caught this at startup',
        );
    }
    cachedResidentialConfig = parseProxyUrl(url);
    return cachedResidentialConfig;
}

/**
 * Return a cached axios proxy config parsed from `BRIGHT_DATA_UNLOCKER_URL`
 * (the Web Unlocker zone). Same contract as `getBrightDataProxyConfig` —
 * reads `process.env` directly to stay out of the `@/lib/env` mock path
 * used by tests.
 */
export function getBrightDataUnlockerProxyConfig(): AxiosProxyConfig {
    if (cachedUnlockerConfig !== undefined) {
        return cachedUnlockerConfig;
    }
    const url = process.env.BRIGHT_DATA_UNLOCKER_URL;
    if (!url) {
        throw new Error(
            'BRIGHT_DATA_UNLOCKER_URL is missing from process.env — src/lib/env.ts validation should have caught this at startup',
        );
    }
    cachedUnlockerConfig = parseProxyUrl(url);
    return cachedUnlockerConfig;
}

/**
 * Resolve a `ProxyTier` (from `src/data-sources/proxy-routing.ts`) into an
 * axios `proxy` field value. Central dispatcher so data-source clients
 * don't need to know which env var corresponds to which tier — they just
 * look up their tier in `PROXY_ROUTING` and pass it here.
 *
 * Tier semantics:
 * - `direct`      → `false`                         (axios proxy disabled)
 * - `residential` → BRIGHT_DATA_PROXY_URL config    (always defined server-side, env-guaranteed)
 * - `unlocker`    → BRIGHT_DATA_UNLOCKER_URL config (always defined server-side, env-guaranteed)
 *
 * ## Client-bundle safety
 *
 * This function no-ops when called in a browser context (`typeof window !== 'undefined'`)
 * and returns `false`. Reasoning:
 *
 * 1. Data-source axios clients call `resolveProxyConfig` at **module load**
 *    inside `axios.create({ proxy: ... })`. They have to, because axios's
 *    native `proxy` field is set once per instance.
 * 2. The data-source registry (`src/data-sources/registry.ts`) is imported
 *    by client components (e.g. `ChatThread.tsx`) for tool metadata. This
 *    transitively pulls every data-source client into the browser bundle.
 * 3. On the server, `process.env.BRIGHT_DATA_PROXY_URL` and
 *    `process.env.BRIGHT_DATA_UNLOCKER_URL` are guaranteed present by
 *    `src/lib/env.ts` validation at startup.
 * 4. On the client, Next.js only exposes `NEXT_PUBLIC_*` env vars to the
 *    browser. Both proxy URLs are undefined in the client bundle, which
 *    would make `parseProxyUrl(undefined)` throw at module load.
 *
 * The guard makes this moot: client-side the helper returns `false`, axios
 * instances get `proxy: false`, and no env read ever happens in the browser.
 * Proxying only matters for server-side HTTP calls anyway, so this is the
 * correct semantic behavior, not just a workaround.
 */
export function resolveProxyConfig(tier: ProxyTier): AxiosProxyConfig | false {
    if (typeof window !== 'undefined') {
        return false;
    }
    switch (tier) {
        case 'direct':
            return false;
        case 'residential':
            return getBrightDataProxyConfig();
        case 'unlocker':
            return getBrightDataUnlockerProxyConfig();
    }
}
