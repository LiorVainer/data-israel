/**
 * Agent Instance Cache
 *
 * Module-level LRU caches for Mastra Agent instances and MCP tool lists.
 * Persists across warm invocations in Vercel Fluid Compute — agents are
 * stateless (memory threads are external in Convex), so cross-request reuse is safe.
 */

import { LRUCache } from 'lru-cache';
import type { Agent } from '@mastra/core/agent';

/** Cache individual agents by composite key: `${agentId}:${modelId}` */
const agentCache = new LRUCache<string, Agent>({
    max: 20, // 8 agents × ~2-3 model variants
    ttl: 1000 * 60 * 5, // 5-minute TTL
});

/** Cache MCP tool lists separately (plain objects, not class instances) */
const mcpToolCache = new LRUCache<string, Record<string, unknown>>({
    max: 5, // one per MCP source
    ttl: 1000 * 60 * 10, // 10-minute TTL (tools change rarely)
});

/**
 * Returns a cached Agent instance or creates one via the factory.
 * Cache key is `${agentId}:${modelId}` — same model = same agent.
 */
export async function getOrCreateAgent(
    agentId: string,
    modelId: string,
    factory: (modelId: string) => Agent | Promise<Agent>,
): Promise<Agent> {
    const key = `${agentId}:${modelId}`;
    const cached = agentCache.get(key);
    if (cached) return cached;

    const agent = await factory(modelId);
    agentCache.set(key, agent);
    return agent;
}

/**
 * Returns cached MCP tools or fetches them via the provided function.
 * Keyed by MCP source ID (e.g., 'budgetkey').
 */
export async function getOrFetchMcpTools<T extends Record<string, unknown>>(
    sourceId: string,
    fetcher: () => Promise<T>,
): Promise<T> {
    const cached = mcpToolCache.get(sourceId);
    if (cached) return cached as T;

    const tools = await fetcher();
    mcpToolCache.set(sourceId, tools);
    return tools;
}
