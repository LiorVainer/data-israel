/**
 * Upstream Probe — Diagnostic endpoint for every data-source upstream API.
 *
 * Hits one minimal representative endpoint for every distinct upstream host used
 * by `src/data-sources/*` and returns the full request + response metadata
 * (status, headers, body snippet, parsed summary) — regardless of success or
 * failure.
 *
 * Purpose: confirm from Vercel preview / any non-Israeli environment whether
 * upstream APIs are geo-blocking, WAF-challenging, or silently degrading
 * (e.g. Knesset OData falling back to Atom XML when JSON isn't forced).
 *
 * Covered hosts:
 *   • data.gov.il            (datagov CKAN)
 *   • apis.cbs.gov.il        (CBS Series)
 *   • api.cbs.gov.il         (CBS Price Index + Dictionary)
 *   • knesset.gov.il         (Knesset OData)
 *   • www.govmap.gov.il      (GovMap / Nadlan)
 *   • israeldrugs.health.gov.il (MoH Drug Registry)
 *   • datadashboard.health.gov.il (MoH Dashboard)
 *   • www.rami-levy.co.il    (Rami Levy catalog)
 *   • www.shufersal.co.il    (Shufersal online)
 *   • next.obudget.org       (BudgetKey MCP)
 *
 * Usage:
 *   GET /api/debug/upstream-probe
 *   GET /api/debug/upstream-probe?only=knesset,cbs-series   (filter subset)
 *
 * NOTE: Not behind auth. Remove once diagnosis is done.
 */

import { NextResponse, type NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// A realistic desktop browser UA — WAFs commonly block bot-ish User-Agent strings.
const BROWSER_UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const PER_PROBE_TIMEOUT_MS = 20_000;
const BODY_SNIPPET_LIMIT = 800;

// ============================================================================
// Types
// ============================================================================

type ProbeConfig = {
    id: string;
    source: string;
    description: string;
    url: string;
    init: RequestInit;
    /** Optional parser summary — only runs if response body is valid JSON. */
    summarize?: (parsed: unknown) => unknown;
};

type ProbeResult = {
    id: string;
    source: string;
    description: string;
    request: {
        method: string;
        url: string;
        headers: Record<string, string>;
        body?: unknown;
    };
    response?: {
        status: number;
        statusText: string;
        ok: boolean;
        headers: Record<string, string>;
        bodySnippet: string;
        bodyWasJson: boolean;
        parsedSummary?: unknown;
        diagnosedBlockType: BlockDiagnosis;
        elapsedMs: number;
    };
    error?: {
        name: string;
        message: string;
        elapsedMs: number;
    };
};

type BlockDiagnosis = 'ok' | 'geo-403' | 'geo-451' | 'waf-challenge' | 'xml-fallback' | 'server-error' | 'unknown';

// ============================================================================
// Helpers
// ============================================================================

function headersToObject(headers: Headers): Record<string, string> {
    const out: Record<string, string> = {};
    headers.forEach((value, key) => {
        out[key] = value;
    });
    return out;
}

function safeJsonParse(raw: string): { parsed: unknown; ok: boolean } {
    try {
        return { parsed: JSON.parse(raw), ok: true };
    } catch {
        return { parsed: raw, ok: false };
    }
}

function isWafChallenge(body: string, contentType: string | undefined): boolean {
    if (contentType && contentType.includes('text/html')) {
        const lower = body.slice(0, 2000).toLowerCase();
        return (
            lower.includes('just a moment') ||
            lower.includes('access denied') ||
            lower.includes('attention required') ||
            lower.includes('cf-ray') ||
            lower.includes('cloudflare') ||
            lower.includes('akamai')
        );
    }
    return false;
}

function isXmlBody(body: string): boolean {
    const trimmed = body.trimStart();
    return trimmed.startsWith('<?xml') || trimmed.startsWith('<feed');
}

function diagnose(status: number, body: string, contentType: string | undefined): BlockDiagnosis {
    if (status === 403) return 'geo-403';
    if (status === 451) return 'geo-451';
    if (status >= 500) return 'server-error';
    if (isWafChallenge(body, contentType)) return 'waf-challenge';
    if (isXmlBody(body) && contentType?.includes('xml')) return 'xml-fallback';
    if (status >= 200 && status < 400) return 'ok';
    return 'unknown';
}

async function runProbe(cfg: ProbeConfig): Promise<ProbeResult> {
    const started = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PER_PROBE_TIMEOUT_MS);

    const request: ProbeResult['request'] = {
        method: cfg.init.method ?? 'GET',
        url: cfg.url,
        headers: (cfg.init.headers as Record<string, string> | undefined) ?? {},
        body: typeof cfg.init.body === 'string' ? safeJsonParse(cfg.init.body).parsed : undefined,
    };

    try {
        const res = await fetch(cfg.url, {
            ...cfg.init,
            signal: controller.signal,
            redirect: 'manual',
        });
        const rawBody = await res.text();
        const elapsedMs = Date.now() - started;
        const contentType = res.headers.get('content-type') ?? undefined;
        const { parsed, ok: bodyWasJson } = safeJsonParse(rawBody);

        return {
            id: cfg.id,
            source: cfg.source,
            description: cfg.description,
            request,
            response: {
                status: res.status,
                statusText: res.statusText,
                ok: res.ok,
                headers: headersToObject(res.headers),
                bodySnippet:
                    rawBody.length > BODY_SNIPPET_LIMIT
                        ? `${rawBody.slice(0, BODY_SNIPPET_LIMIT)}…[truncated ${rawBody.length - BODY_SNIPPET_LIMIT} more chars]`
                        : rawBody,
                bodyWasJson,
                parsedSummary: bodyWasJson && cfg.summarize ? cfg.summarize(parsed) : undefined,
                diagnosedBlockType: diagnose(res.status, rawBody, contentType),
                elapsedMs,
            },
        };
    } catch (error) {
        const elapsedMs = Date.now() - started;
        const err = error instanceof Error ? error : new Error(String(error));
        return {
            id: cfg.id,
            source: cfg.source,
            description: cfg.description,
            request,
            error: { name: err.name, message: err.message, elapsedMs },
        };
    } finally {
        clearTimeout(timeout);
    }
}

// ============================================================================
// Probe definitions — one per distinct upstream host
// ============================================================================

function buildProbes(): ProbeConfig[] {
    const commonBrowserHeaders = {
        'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8',
        'User-Agent': BROWSER_UA,
    };

    return [
        {
            id: 'datagov',
            source: 'datagov',
            description: 'CKAN status_show — smallest public endpoint',
            url: 'https://data.gov.il/api/3/action/status_show',
            init: {
                method: 'GET',
                headers: { Accept: 'application/json', ...commonBrowserHeaders },
            },
            summarize: (p) => {
                const o = p as { success?: boolean; result?: { ckan_version?: string } };
                return { success: o.success, ckanVersion: o.result?.ckan_version };
            },
        },
        {
            id: 'cbs-series',
            source: 'cbs',
            description: 'CBS Series catalog level=1',
            url: 'https://apis.cbs.gov.il/series/catalog/level?format=json&id=1&lang=he&page=1&pagesize=5',
            init: {
                method: 'GET',
                headers: { Accept: 'application/json', ...commonBrowserHeaders },
            },
            summarize: (p) => {
                const o = p as { items?: unknown[]; rc?: number };
                return { rc: o.rc, itemsLength: Array.isArray(o.items) ? o.items.length : null };
            },
        },
        {
            id: 'cbs-price-index',
            source: 'cbs',
            description: 'CBS Price Index catalog',
            url: 'https://api.cbs.gov.il/index/catalog/catalog?format=json&lang=he',
            init: {
                method: 'GET',
                headers: { Accept: 'application/json', ...commonBrowserHeaders },
            },
            summarize: (p) => {
                const o = p as Record<string, unknown>;
                return { topLevelKeys: Object.keys(o).slice(0, 10) };
            },
        },
        {
            id: 'cbs-dictionary',
            source: 'cbs',
            description: 'CBS Dictionary geo/localities search',
            url: 'https://api.cbs.gov.il/dictionary/geo/localities?format=json&q=%D7%AA%D7%9C',
            init: {
                method: 'GET',
                headers: { Accept: 'application/json', ...commonBrowserHeaders },
            },
            summarize: (p) => {
                const o = p as Record<string, unknown>;
                return { topLevelKeys: Object.keys(o).slice(0, 10) };
            },
        },
        {
            id: 'knesset-odata',
            source: 'knesset',
            description: 'Knesset OData KNS_Committee — forces $format=json to avoid Atom XML fallback',
            url: 'https://knesset.gov.il/Odata/ParliamentInfo.svc/KNS_Committee()?%24format=json&%24filter=KnessetNum%20eq%2025&%24top=1',
            init: {
                method: 'GET',
                headers: { Accept: 'application/json', ...commonBrowserHeaders },
            },
            summarize: (p) => {
                const o = p as { value?: unknown[] };
                return {
                    valueLength: Array.isArray(o.value) ? o.value.length : null,
                    topLevelKeys: p && typeof p === 'object' ? Object.keys(p) : null,
                };
            },
        },
        {
            id: 'knesset-odata-no-format',
            source: 'knesset',
            description: 'Knesset OData WITHOUT $format=json — reproduces the Atom XML fallback seen on Vercel',
            url: 'https://knesset.gov.il/Odata/ParliamentInfo.svc/KNS_Committee()?%24filter=KnessetNum%20eq%2025&%24top=1',
            init: {
                method: 'GET',
                headers: { Accept: 'application/json', ...commonBrowserHeaders },
            },
            summarize: (p) => {
                const o = p as { value?: unknown[] };
                return {
                    valueLength: Array.isArray(o.value) ? o.value.length : null,
                };
            },
        },
        {
            id: 'govmap',
            source: 'govmap',
            description: 'GovMap search-service autocomplete (POST)',
            url: 'https://www.govmap.gov.il/api/search-service/autocomplete',
            init: {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Origin: 'https://www.govmap.gov.il',
                    Referer: 'https://www.govmap.gov.il/',
                    ...commonBrowserHeaders,
                },
                body: JSON.stringify({
                    searchText: 'תל אביב',
                    language: 'he',
                    isAccurate: false,
                    maxResults: 5,
                }),
            },
            summarize: (p) => {
                const o = p as { results?: unknown[] };
                return { resultsLength: Array.isArray(o.results) ? o.results.length : null };
            },
        },
        {
            id: 'drugs',
            source: 'drugs',
            description: 'MoH IsraelDrugs SearchBoxAutocomplete (POST)',
            url: 'https://israeldrugs.health.gov.il/GovServiceList/IDRServer/SearchBoxAutocomplete',
            init: {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Origin: 'https://israeldrugs.health.gov.il',
                    Referer: 'https://israeldrugs.health.gov.il/',
                    ...commonBrowserHeaders,
                },
                body: JSON.stringify({
                    val: 'אקמ',
                    isSearchTradeName: '1',
                    isSearchTradeMarkiv: '0',
                }),
            },
            summarize: (p) => {
                if (Array.isArray(p)) return { arrayLength: p.length };
                const o = p as Record<string, unknown>;
                return { topLevelKeys: Object.keys(o).slice(0, 10) };
            },
        },
        {
            id: 'health-dashboard',
            source: 'health',
            description: 'MoH datadashboard subject metadata (beaches)',
            url: 'https://datadashboard.health.gov.il/api/content/dashboard/beaches',
            init: {
                method: 'GET',
                headers: { Accept: 'application/json', ...commonBrowserHeaders },
            },
            summarize: (p) => {
                const o = p as Record<string, unknown>;
                return { topLevelKeys: Object.keys(o).slice(0, 10) };
            },
        },
        {
            id: 'rami-levy',
            source: 'rami-levy',
            description: 'Rami Levy catalog search (POST)',
            url: 'https://www.rami-levy.co.il/api/catalog',
            init: {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json;charset=UTF-8',
                    Accept: 'application/json, text/plain, */*',
                    Origin: 'https://www.rami-levy.co.il',
                    Referer: 'https://www.rami-levy.co.il/he/online/search',
                    locale: 'he',
                    ...commonBrowserHeaders,
                },
                body: JSON.stringify({ q: 'חלב', store: '331', aggs: 1 }),
            },
            summarize: (p) => {
                const o = p as { data?: unknown[]; total?: number };
                return {
                    total: o.total ?? null,
                    dataLength: Array.isArray(o.data) ? o.data.length : null,
                };
            },
        },
        {
            id: 'shufersal',
            source: 'shufersal',
            description: 'Shufersal online search (GET)',
            url: 'https://www.shufersal.co.il/online/he/search/results?q=%D7%97%D7%9C%D7%91&limit=5',
            init: {
                method: 'GET',
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    Origin: 'https://www.shufersal.co.il',
                    Referer: 'https://www.shufersal.co.il/online/he/search',
                    'x-requested-with': 'XMLHttpRequest',
                    ...commonBrowserHeaders,
                },
            },
            summarize: (p) => {
                const o = p as { results?: unknown[] };
                return { resultsLength: Array.isArray(o.results) ? o.results.length : null };
            },
        },
        {
            id: 'budget-mcp',
            source: 'budget',
            description: 'BudgetKey MCP endpoint reachability',
            url: 'https://next.obudget.org/mcp',
            init: {
                method: 'GET',
                headers: { Accept: 'application/json, text/event-stream', ...commonBrowserHeaders },
            },
        },
    ];
}

// ============================================================================
// Handler
// ============================================================================

export async function GET(req: NextRequest) {
    const onlyParam = req.nextUrl.searchParams.get('only');
    const only = onlyParam ? new Set(onlyParam.split(',').map((s) => s.trim())) : null;

    const probes = buildProbes().filter((p) => (only ? only.has(p.id) || only.has(p.source) : true));

    const results = await Promise.all(probes.map(runProbe));

    // Summary: count by diagnosis so a human can skim the output
    const diagnosis: Record<string, string[]> = {};
    for (const r of results) {
        const key = r.error ? `error:${r.error.name}` : (r.response?.diagnosedBlockType ?? 'unknown');
        if (!diagnosis[key]) diagnosis[key] = [];
        diagnosis[key].push(r.id);
    }

    return NextResponse.json(
        {
            probedAt: new Date().toISOString(),
            environment: {
                vercelEnv: process.env.VERCEL_ENV ?? null,
                vercelRegion: process.env.VERCEL_REGION ?? null,
                nodeEnv: process.env.NODE_ENV,
            },
            summary: {
                total: results.length,
                diagnosis,
            },
            results,
        },
        { headers: { 'Cache-Control': 'no-store' } },
    );
}
