/**
 * Grocery Price Feed Endpoint Definitions
 *
 * Chain feed URLs under the Israeli Price Transparency Law (2015).
 * Each chain publishes XML feeds (PricesFull, Stores, Promos) at a known base URL.
 */

// ============================================================================
// Chain Identifiers
// ============================================================================

/** Supported supermarket chain IDs */
export type ChainId = 'shufersal' | 'rami-levy' | 'yochananof' | 'victory' | 'osher-ad' | 'tiv-taam';

// ============================================================================
// Chain Feed Configuration
// ============================================================================

export interface ChainFeedConfig {
    /** Hebrew display name */
    name: string;
    /** Base URL where XML feeds are published */
    baseUrl: string;
    /** Chain identifier used in file naming */
    chainPrefix: string;
}

/** Feed configuration for each supported chain */
export const CHAIN_FEEDS: Readonly<Record<ChainId, ChainFeedConfig>> = {
    shufersal: {
        name: 'שופרסל',
        baseUrl: 'https://prices.shufersal.co.il',
        chainPrefix: 'Shufersal',
    },
    'rami-levy': {
        name: 'רמי לוי',
        baseUrl: 'https://prices.rframi.co.il',
        chainPrefix: 'RamiLevy',
    },
    yochananof: {
        name: 'יוחננוף',
        baseUrl: 'https://prices.ybitan.co.il',
        chainPrefix: 'Yochananof',
    },
    victory: {
        name: 'ויקטורי',
        baseUrl: 'https://prices.mega.co.il',
        chainPrefix: 'Victory',
    },
    'osher-ad': {
        name: 'אושר עד',
        baseUrl: 'https://prices.osherad.co.il',
        chainPrefix: 'OsherAd',
    },
    'tiv-taam': {
        name: 'טיב טעם',
        baseUrl: 'https://prices.tivtaam.co.il',
        chainPrefix: 'TivTaam',
    },
} as const;

// ============================================================================
// Feed Types
// ============================================================================

/** Types of XML feeds published by each chain */
export type FeedType = 'PricesFull' | 'Stores' | 'Promos';

// ============================================================================
// URL Builders
// ============================================================================

/**
 * Build the feed index page URL for a chain.
 * The index page lists all available XML files for that chain.
 */
export function buildFeedIndexUrl(chainId: ChainId): string {
    const config = CHAIN_FEEDS[chainId];
    return `${config.baseUrl}/FileObject/UpdateCategory`;
}

/**
 * Build a direct feed file download URL.
 * Feed files are gzipped XML published at predictable paths.
 */
export function buildFeedFileUrl(chainId: ChainId, fileName: string): string {
    const config = CHAIN_FEEDS[chainId];
    return `${config.baseUrl}/FileObject/UpdateCategory/${encodeURIComponent(fileName)}`;
}

/**
 * Build the chain's public-facing portal URL for source attribution.
 */
export function buildChainPortalUrl(chainId: ChainId): string {
    return CHAIN_FEEDS[chainId].baseUrl;
}

/** All supported chain IDs as an array */
export const ALL_CHAIN_IDS: readonly ChainId[] = Object.keys(CHAIN_FEEDS) as ChainId[];

/** Get Hebrew name for a chain ID */
export function getChainName(chainId: ChainId): string {
    return CHAIN_FEEDS[chainId].name;
}
