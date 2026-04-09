/**
 * classify-source — classify a data-source upstream API into a PROXY_ROUTING tier.
 *
 * Runs four probes against the given URL and recommends which tier to declare
 * in `src/data-sources/proxy-routing.ts` for a new data source. Runs locally
 * (from an Israeli ISP, presumably), using a second Bright Data proxy URL
 * with NON-Israeli country targeting to simulate what the upstream sees from
 * Vercel production — since you can't just "be outside Israel" on demand.
 *
 * ## Usage
 *
 *   pnpm classify-source --url=https://api.example.gov.il/v1/resource
 *   pnpm classify-source --url=https://www.rami-levy.co.il/api/catalog \
 *       --method=POST \
 *       --body='{"q":"חלב","store":"331","aggs":1}' \
 *       --headers='{"locale":"he"}'
 *
 * ## Required env vars (loaded and validated by src/lib/env.ts)
 *
 * All three must be set in `.env` before running the script. The script
 * asserts their presence at startup and throws with a clear error if any
 * are missing — no silent fallbacks, no per-probe "env var not set" branches.
 *
 * - BRIGHT_DATA_PROXY_URL    — residential IL zone (required by the app too)
 * - BRIGHT_DATA_UNLOCKER_URL — Web Unlocker zone (required by the app too)
 * - BRIGHT_DATA_PROBE_URL    — dev-only: a Bright Data proxy URL with a
 *                              NON-Israeli country suffix (e.g.
 *                              `...zone-<residential>-country-us:...`),
 *                              used to simulate Vercel's non-Israeli egress.
 *
 * ## The four probes
 *
 * 1. `direct`      — no proxy (your local Israeli ISP). Baseline "what the
 *                    correct answer looks like."
 * 2. `non-il`      — through BRIGHT_DATA_PROBE_URL (non-Israeli country).
 *                    Simulates what Vercel production sees.
 * 3. `residential` — through BRIGHT_DATA_PROXY_URL (IL residential zone).
 *                    Tests whether IL geo-gating is enough.
 * 4. `unlocker`    — through BRIGHT_DATA_UNLOCKER_URL (Web Unlocker zone).
 *                    Tests whether bot-bypass is needed.
 *
 * ## Classification logic
 *
 *   direct fails                                → 'unreachable-from-baseline'
 *   direct ≡ non-il                             → 'direct'     (not geo-gated)
 *   direct !≡ non-il, direct ≡ residential      → 'residential' (geo-gated only)
 *   direct !≡ residential, direct ≡ unlocker    → 'unlocker'    (WAF-protected)
 *   nothing matches                             → 'unreachable' (manual investigation)
 *
 * "≡" is a fuzzy comparison: same HTTP status class (2xx vs 4xx), body
 * size ratio within a reasonable range, and no bot-block signatures in
 * the body (Cloudflare challenge page, "Access Denied" HTML, etc.).
 */

import axios, { type AxiosProxyConfig } from 'axios';
import { parseArgs } from 'node:util';
import { ENV } from '@/lib/env';

// ============================================================================
// Types
// ============================================================================

type ProbeId = 'direct' | 'non-il' | 'residential' | 'unlocker';

type ProbeResult = {
    id: ProbeId;
    label: string;
    ok: boolean;
    status: number | null;
    contentType: string | null;
    bodySize: number;
    bodySnippet: string;
    durationMs: number;
    error: string | null;
    botBlockDetected: boolean;
};

type Classification = 'direct' | 'residential' | 'unlocker' | 'unreachable' | 'unreachable-from-baseline';

// ============================================================================
// Proxy URL parsing (duplicated from src/lib/proxy/bright-data.ts so the
// script's import graph stays minimal — tsx loads env.ts and this file only)
// ============================================================================

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

// ============================================================================
// Bot-block signature detection
// ============================================================================

const BOT_BLOCK_SIGNATURES = [
    'just a moment',
    'access denied',
    'attention required',
    'cf-ray',
    'cloudflare',
    'akamai',
    'error 1020',
    'bot detection',
    'forbidden',
    'please enable cookies',
];

function isBotBlockHtml(body: string, contentType: string | null): boolean {
    if (!contentType?.toLowerCase().includes('text/html')) return false;
    const lower = body.slice(0, 2000).toLowerCase();
    return BOT_BLOCK_SIGNATURES.some((sig) => lower.includes(sig));
}

// ============================================================================
// Single probe
// ============================================================================

async function runProbe(
    id: ProbeId,
    label: string,
    proxy: AxiosProxyConfig | false,
    url: string,
    method: string,
    body: unknown,
    headers: Record<string, string> | undefined,
): Promise<ProbeResult> {
    const started = Date.now();

    try {
        const res = await axios.request<string>({
            url,
            method,
            data: body,
            headers,
            timeout: 20_000,
            proxy,
            validateStatus: () => true, // accept 4xx/5xx, don't throw
            responseType: 'text',
            transformResponse: (d: unknown) => (typeof d === 'string' ? d : String(d)),
        });

        const bodyStr = typeof res.data === 'string' ? res.data : String(res.data);
        const contentType = (res.headers['content-type'] as string | undefined) ?? null;

        return {
            id,
            label,
            ok: res.status >= 200 && res.status < 300,
            status: res.status,
            contentType,
            bodySize: bodyStr.length,
            bodySnippet: bodyStr.slice(0, 200),
            durationMs: Date.now() - started,
            error: null,
            botBlockDetected: isBotBlockHtml(bodyStr, contentType),
        };
    } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        return {
            id,
            label,
            ok: false,
            status: null,
            contentType: null,
            bodySize: 0,
            bodySnippet: '',
            durationMs: Date.now() - started,
            error,
            botBlockDetected: false,
        };
    }
}

// ============================================================================
// Fuzzy equivalence — does probe B look like the same "successful answer" as baseline A?
// ============================================================================

function isEquivalentToBaseline(baseline: ProbeResult, probe: ProbeResult): boolean {
    if (!baseline.ok || !probe.ok) return false;
    if (probe.botBlockDetected) return false;

    // Same status class
    const baselineStatusClass = Math.floor((baseline.status ?? 0) / 100);
    const probeStatusClass = Math.floor((probe.status ?? 0) / 100);
    if (baselineStatusClass !== probeStatusClass) return false;

    // Body size ratio within [0.33, 3.0] — wide enough to tolerate differing
    // product counts or cache variance, narrow enough to flag a small error
    // page vs a full JSON response.
    if (baseline.bodySize === 0 || probe.bodySize === 0) return false;
    const ratio = probe.bodySize / baseline.bodySize;
    if (ratio < 0.33 || ratio > 3.0) return false;

    // Same content-type family (json vs html vs text)
    const baselineFamily = getContentTypeFamily(baseline.contentType);
    const probeFamily = getContentTypeFamily(probe.contentType);
    if (baselineFamily !== probeFamily) return false;

    return true;
}

function getContentTypeFamily(ct: string | null): string {
    if (!ct) return 'unknown';
    const lower = ct.toLowerCase();
    if (lower.includes('json')) return 'json';
    if (lower.includes('html')) return 'html';
    if (lower.includes('xml')) return 'xml';
    if (lower.includes('text')) return 'text';
    return 'other';
}

// ============================================================================
// Classification
// ============================================================================

function classify(probes: ProbeResult[]): { tier: Classification; rationale: string } {
    const direct = probes.find((p) => p.id === 'direct')!;
    const nonIl = probes.find((p) => p.id === 'non-il')!;
    const residential = probes.find((p) => p.id === 'residential')!;
    const unlocker = probes.find((p) => p.id === 'unlocker')!;

    if (!direct.ok) {
        return {
            tier: 'unreachable-from-baseline',
            rationale:
                'The direct probe (local machine) failed — cannot establish a baseline "successful" response to compare against. Check the URL, headers, and body manually before classifying.',
        };
    }

    // Step 1: is it geo-gated?
    if (isEquivalentToBaseline(direct, nonIl)) {
        return {
            tier: 'direct',
            rationale:
                'Direct probe and non-IL probe returned equivalent responses — the upstream is reachable from any egress, no proxy needed.',
        };
    }

    // Geo-gated. Does residential work?
    if (isEquivalentToBaseline(direct, residential)) {
        return {
            tier: 'residential',
            rationale:
                'The non-IL probe failed or returned a different response, but the IL residential probe matches the baseline — a plain Israeli residential IP is sufficient to access this upstream.',
        };
    }

    // Residential also failed. Does unlocker work?
    if (isEquivalentToBaseline(direct, unlocker)) {
        return {
            tier: 'unlocker',
            rationale:
                "Both non-IL and IL residential probes failed — the upstream's WAF flags generic Bright Data residential IPs. The Web Unlocker zone (with TLS fingerprinting and bot-score rotation) successfully matches the baseline.",
        };
    }

    return {
        tier: 'unreachable',
        rationale:
            'None of the four probes match the baseline direct response. Possible causes: (a) the upstream has a harder bot-detection tier than Web Unlocker handles, (b) rate-limiting on your IP, or (c) the request body/headers are incorrect. Inspect the raw probe results above and investigate manually.',
    };
}

// ============================================================================
// Output
// ============================================================================

function formatProbe(probe: ProbeResult): string {
    if (probe.error) {
        return `  ❌ ${probe.label.padEnd(40)} error: ${probe.error} (${probe.durationMs}ms)`;
    }
    const statusIcon = probe.ok ? '✅' : '⚠️';
    const botFlag = probe.botBlockDetected ? ' 🤖 bot-block signatures detected' : '';
    const sizeKb = (probe.bodySize / 1024).toFixed(1);
    const ct = probe.contentType?.split(';')[0] ?? '?';
    return `  ${statusIcon} ${probe.label.padEnd(40)} HTTP ${probe.status}  ${sizeKb.padStart(6)} KB  ${ct.padEnd(24)} ${probe.durationMs}ms${botFlag}`;
}

function printResults(
    probes: ProbeResult[],
    cls: { tier: Classification; rationale: string },
    url: string,
    method: string,
): void {
    console.log(`\n📡 classify-source: ${method} ${url}\n`);
    console.log('Probes:');
    for (const probe of probes) {
        console.log(formatProbe(probe));
    }

    console.log('\nBody snippets (first 200 bytes):');
    for (const probe of probes) {
        if (!probe.bodySnippet) continue;
        const snippet = probe.bodySnippet.replace(/\s+/g, ' ').slice(0, 200);
        console.log(`  ${probe.id.padEnd(12)} │ ${snippet}`);
    }

    console.log(`\n📊 Recommended tier: ${cls.tier}`);
    console.log(`\n   ${cls.rationale}\n`);

    if (cls.tier === 'direct' || cls.tier === 'residential' || cls.tier === 'unlocker') {
        console.log('Paste into src/data-sources/proxy-routing.ts:\n');
        console.log(`    '<your-source-id>': '${cls.tier}',\n`);
    }
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
    // ENV.BRIGHT_DATA_PROXY_URL and ENV.BRIGHT_DATA_UNLOCKER_URL are REQUIRED in
    // env.ts — their presence is already guaranteed by env.ts parsing at import
    // time. BRIGHT_DATA_PROBE_URL is dev-only and optional there, so we assert
    // its presence here with a clear error message.
    if (!ENV.BRIGHT_DATA_PROBE_URL || ENV.BRIGHT_DATA_PROBE_URL.trim().length === 0) {
        console.error(
            'BRIGHT_DATA_PROBE_URL is required to run classify-source.\n' +
                '\n' +
                'This variable should be a Bright Data proxy URL forced to a NON-Israeli\n' +
                'country (e.g. `...zone-<residential>-country-us:<password>@brd.superproxy.io:33335`).\n' +
                'It simulates what Vercel production sees from outside Israel, so the\n' +
                'script can classify an upstream API from your local Israeli dev machine.\n' +
                '\n' +
                'Add it to .env and re-run. See .env.example for the exact shape.',
        );
        process.exit(1);
    }

    const { values } = parseArgs({
        options: {
            url: { type: 'string' },
            method: { type: 'string', default: 'GET' },
            body: { type: 'string' },
            headers: { type: 'string' },
        },
        allowPositionals: false,
    });

    if (!values.url) {
        console.error(
            'Usage: pnpm classify-source --url=<url> [--method=GET|POST] [--body=<json>] [--headers=<json>]',
        );
        process.exit(1);
    }

    const url = values.url;
    const method = (values.method ?? 'GET').toUpperCase();

    let body: unknown = undefined;
    if (values.body) {
        try {
            body = JSON.parse(values.body);
        } catch {
            body = values.body; // fall back to raw string
        }
    }

    let headers: Record<string, string> | undefined;
    if (values.headers) {
        try {
            headers = JSON.parse(values.headers);
        } catch (e) {
            console.error(
                `Failed to parse --headers as JSON: ${e instanceof Error ? e.message : String(e)}`,
            );
            process.exit(1);
        }
    }

    // All three proxy URLs are guaranteed present at this point:
    // - BRIGHT_DATA_PROXY_URL    — required in env.ts
    // - BRIGHT_DATA_UNLOCKER_URL — required in env.ts
    // - BRIGHT_DATA_PROBE_URL    — checked at the top of main()
    const probeProxy = parseProxyUrl(ENV.BRIGHT_DATA_PROBE_URL);
    const residentialProxy = parseProxyUrl(ENV.BRIGHT_DATA_PROXY_URL);
    const unlockerProxy = parseProxyUrl(ENV.BRIGHT_DATA_UNLOCKER_URL);

    console.log(`\n🔍 Probing ${method} ${url} through four tiers…`);

    const probes = await Promise.all([
        runProbe('direct', 'direct (local machine)', false, url, method, body, headers),
        runProbe('non-il', 'non-IL probe (BRIGHT_DATA_PROBE_URL)', probeProxy, url, method, body, headers),
        runProbe('residential', 'IL residential (BRIGHT_DATA_PROXY_URL)', residentialProxy, url, method, body, headers),
        runProbe('unlocker', 'Web Unlocker (BRIGHT_DATA_UNLOCKER_URL)', unlockerProxy, url, method, body, headers),
    ]);

    const cls = classify(probes);
    printResults(probes, cls, url, method);

    // Exit non-zero if we couldn't classify, so CI or scripts can branch on it.
    if (cls.tier === 'unreachable' || cls.tier === 'unreachable-from-baseline') {
        process.exit(2);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
