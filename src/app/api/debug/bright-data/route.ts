/**
 * Bright Data Proxy Verification Route — TEMPORARY.
 *
 * Disposable diagnostic endpoint used to verify that `BRIGHT_DATA_PROXY_URL`
 * is correctly configured and that the three Israeli-egress-gated data-source
 * clients (Knesset OData, Shufersal, Rami Levy) actually route through the
 * Bright Data IL proxy zone.
 *
 * Runs four checks:
 *   1. `https://geo.brdtest.com/welcome.txt` via the proxy agent — confirms
 *      the exit IP is in Israel. This is the canonical Bright Data IP echo
 *      endpoint and returns the country/city/IP of the egress node.
 *   2. `knessetApi.searchBills('חוק', undefined, 1)` — confirms OData
 *      returns real JSON (not an Atom XML fallback and not HTML).
 *   3. `shufersalApi.searchProducts('חלב', 1)` — confirms the search API
 *      returns JSON `{ results: [...] }`.
 *   4. `ramiLevyApi.searchProducts('חלב', undefined, 1)` — confirms the
 *      catalog POST returns `{ data: [...] }`.
 *
 * Usage:
 *   GET /api/debug/bright-data
 *
 * Not behind auth. Remove this file (and this directory) once the Bright
 * Data rollout is verified in Production.
 */

import axios from 'axios';
import { NextResponse } from 'next/server';
import { knessetApi } from '@/data-sources/knesset/api/knesset.client';
import { shufersalApi } from '@/data-sources/shufersal/api/shufersal.client';
import { ramiLevyApi } from '@/data-sources/rami-levy/api/rami-levy.client';
import { getBrightDataProxyConfig, getBrightDataUnlockerProxyConfig } from '@/lib/proxy/bright-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CheckResult = {
    id: 'geo-brdtest-residential' | 'geo-brdtest-unlocker' | 'knesset' | 'shufersal' | 'rami-levy';
    ok: boolean;
    durationMs: number;
    summary: Record<string, unknown> | null;
    error: { name: string; message: string } | null;
};

async function timeIt<T>(fn: () => Promise<T>): Promise<{ value?: T; error?: Error; durationMs: number }> {
    const started = Date.now();
    try {
        const value = await fn();
        return { value, durationMs: Date.now() - started };
    } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        return { error, durationMs: Date.now() - started };
    }
}

async function checkGeoBrdTest(
    id: 'geo-brdtest-residential' | 'geo-brdtest-unlocker',
    proxy: ReturnType<typeof getBrightDataProxyConfig>,
): Promise<CheckResult> {
    if (proxy === false) {
        return {
            id,
            ok: false,
            durationMs: 0,
            summary: { note: 'proxy env var not set' },
            error: null,
        };
    }

    const { value, error, durationMs } = await timeIt(async () => {
        const res = await axios.get<string>('https://geo.brdtest.com/welcome.txt', {
            timeout: 15_000,
            responseType: 'text',
            transformResponse: (d: unknown) => (typeof d === 'string' ? d : String(d)),
            proxy,
        });
        return res.data;
    });

    if (error || value === undefined) {
        return {
            id,
            ok: false,
            durationMs,
            summary: null,
            error: error ? { name: error.name, message: error.message } : { name: 'Error', message: 'no data' },
        };
    }

    // Body shape from Bright Data is a short human-readable line containing
    // country and city, e.g.:
    //   "Country: IL\nCity: Tel Aviv\nIP: 31.154.x.x\nASN: AS1234 ..."
    const body = String(value);
    const country = /Country:\s*([A-Z]{2})/i.exec(body)?.[1] ?? null;
    const city = /City:\s*([^\n\r]+)/i.exec(body)?.[1]?.trim() ?? null;
    const ip = /IP:\s*([0-9a-fA-F.:]+)/i.exec(body)?.[1] ?? null;
    const asn = /ASN[^:]*:\s*([^\n\r]+)/i.exec(body)?.[1]?.trim() ?? null;

    // The residential zone has `-country-il` forced in its username so we
    // assert IL. The unlocker zone has no country targeting configured, so
    // Web Unlocker auto-selects based on the target domain — for generic
    // probes like geo.brdtest.com it may return any country. We still mark
    // the unlocker check as "ok" as long as a geo payload came back.
    const ok = id === 'geo-brdtest-residential' ? country === 'IL' : country !== null;

    const note =
        id === 'geo-brdtest-unlocker' && country !== 'IL'
            ? 'Web Unlocker has no country targeting — Web Unlocker auto-selects by target domain. Non-IL exit for a non-Israeli probe is expected; rami-levy.co.il traffic still gets an Israeli IP because the domain is .co.il.'
            : undefined;

    return {
        id,
        ok,
        durationMs,
        summary: {
            country,
            city,
            ip,
            asn,
            ...(note && { note }),
            rawBody: body.length > 500 ? `${body.slice(0, 500)}…` : body,
        },
        error: null,
    };
}

async function checkKnesset(): Promise<CheckResult> {
    const { value, error, durationMs } = await timeIt(() => knessetApi.searchBills('חוק', undefined, 1));
    if (error || !value) {
        return {
            id: 'knesset',
            ok: false,
            durationMs,
            summary: null,
            error: error ? { name: error.name, message: error.message } : { name: 'Error', message: 'no data' },
        };
    }
    const firstBillName = value.bills[0]?.Name ?? null;
    return {
        id: 'knesset',
        ok: value.totalFound > 0,
        durationMs,
        summary: {
            totalFound: value.totalFound,
            firstBillName,
        },
        error: null,
    };
}

async function checkShufersal(): Promise<CheckResult> {
    const { value, error, durationMs } = await timeIt(() => shufersalApi.searchProducts('חלב', 1));
    if (error || !value) {
        return {
            id: 'shufersal',
            ok: false,
            durationMs,
            summary: null,
            error: error ? { name: error.name, message: error.message } : { name: 'Error', message: 'no data' },
        };
    }
    const firstProductName = value.products[0]?.name ?? null;
    return {
        id: 'shufersal',
        ok: value.totalFound > 0,
        durationMs,
        summary: {
            totalFound: value.totalFound,
            firstProductName,
        },
        error: null,
    };
}

async function checkRamiLevy(): Promise<CheckResult> {
    const { value, error, durationMs } = await timeIt(() => ramiLevyApi.searchProducts('חלב', undefined, 1));
    if (error || !value) {
        return {
            id: 'rami-levy',
            ok: false,
            durationMs,
            summary: null,
            error: error ? { name: error.name, message: error.message } : { name: 'Error', message: 'no data' },
        };
    }
    const firstProductName = value.products[0]?.name ?? null;
    return {
        id: 'rami-levy',
        ok: value.products.length > 0,
        durationMs,
        summary: {
            total: value.total,
            returned: value.products.length,
            firstProductName,
        },
        error: null,
    };
}

export async function GET(): Promise<NextResponse> {
    const residentialUrl = process.env.BRIGHT_DATA_PROXY_URL;
    const unlockerUrl = process.env.BRIGHT_DATA_UNLOCKER_URL;
    const residentialConfigured = typeof residentialUrl === 'string' && residentialUrl.trim().length > 0;
    const unlockerConfigured = typeof unlockerUrl === 'string' && unlockerUrl.trim().length > 0;

    const residentialProxy = getBrightDataProxyConfig();
    const unlockerProxy = getBrightDataUnlockerProxyConfig();

    const checks = await Promise.all([
        checkGeoBrdTest('geo-brdtest-residential', residentialProxy),
        checkGeoBrdTest('geo-brdtest-unlocker', unlockerProxy),
        checkKnesset(),
        checkShufersal(),
        checkRamiLevy(),
    ]);

    // A check is considered "passed" when ok === true. Unset-proxy checks
    // (ok === false with no error) are not counted as failures for allPassed
    // purposes when their zone isn't even configured.
    const allPassed = checks.every((c) => {
        if (c.id === 'geo-brdtest-residential' && !residentialConfigured) return true;
        if (c.id === 'geo-brdtest-unlocker' && !unlockerConfigured) return true;
        return c.ok;
    });

    return NextResponse.json(
        {
            probedAt: new Date().toISOString(),
            environment: {
                vercelEnv: process.env.VERCEL_ENV ?? null,
                vercelRegion: process.env.VERCEL_REGION ?? null,
                nodeEnv: process.env.NODE_ENV,
            },
            zones: {
                residentialConfigured,
                unlockerConfigured,
            },
            allPassed,
            checks,
        },
        { headers: { 'Cache-Control': 'no-store' } },
    );
}
