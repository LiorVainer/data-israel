/**
 * Convex Analytics Query Functions
 *
 * Provides aggregated metrics for the admin analytics dashboard.
 * All queries accept an optional `sinceTimestamp` (Unix ms) for time-range filtering.
 * When undefined, returns all-time data.
 *
 * Note: createdAt in mastra_threads and mastra_messages is an ISO string (timestamp type).
 *       createdAt in thread_billing is a Unix ms number.
 */

import { query } from './_generated/server';
import { v } from 'convex/values';

// ---------------------------------------------------------------------------
// Prompt card strings inlined from src/constants/prompt-cards.ts
// Convex functions run in a separate runtime and cannot import from src/
// ---------------------------------------------------------------------------

interface PromptCardEntry {
    label: string;
    prompt: string;
}

const PROMPT_CARD_ENTRIES: PromptCardEntry[] = [
    {
        label: 'מחירים ומדדים',
        prompt: 'איך השתנה סל יוקר המחיה בישראל בעשור האחרון, ואילו סעיפים התייקרו הכי הרבה?',
    },
    {
        label: 'רכבת ישראל',
        prompt: 'מה אחוז הדיוק של רכבת ישראל בחודשים האחרונים, ובאילו תחנות יש הכי הרבה איחורים?',
    },
    {
        label: 'בנייה ודיור',
        prompt: 'מה מגמת התחלות הבנייה בישראל בשנים האחרונות, ובאילו אזורים הבנייה הכי פעילה?',
    },
    {
        label: 'מחירי דירות',
        prompt: 'איך השתנה מדד מחירי הדירות בישראל בשנה האחרונה, ומה המגמה לעומת מדד המחירים לצרכן?',
    },
    {
        label: 'טיסות מנתבג',
        prompt: 'אילו יעדים מופעלים היום משדה התעופה בן גוריון, ואילו חברות תעופה פועלות?',
    },
    {
        label: 'תאונות דרכים',
        prompt: 'מה המגמה בתאונות דרכים עם נפגעים בישראל לפי סוג דרך וחומרת התאונה?',
    },
    {
        label: 'סחר חוץ',
        prompt: 'מה הגירעון המסחרי של ישראל, ואילו קבוצות סחורות מובילות ביבוא וביצוא?',
    },
    {
        label: 'איכות אוויר',
        prompt: 'מה מצב איכות האוויר היום באזורים השונים בישראל?',
    },
];

// ---------------------------------------------------------------------------
// Helper: convert sinceTimestamp (Unix ms number) to ISO string
// used for comparing against mastra table createdAt (ISO string) fields
// ---------------------------------------------------------------------------

function toIsoString(ts: number): string {
    return new Date(ts).toISOString();
}

/** Extract user message text from mastra_messages content field. */
function extractMessageText(content: unknown): string {
    if (typeof content !== 'string') return '';
    try {
        const parsed: unknown = JSON.parse(content);
        if (typeof parsed === 'string') return parsed;
        if (parsed !== null && typeof parsed === 'object') {
            const obj = parsed as Record<string, unknown>;
            if (Array.isArray(obj.parts)) {
                const textPart = (obj.parts as Array<{ type?: string; text?: string }>).find(
                    (p) => p.type === 'text',
                );
                return textPart?.text ?? '';
            } else if (Array.isArray(parsed)) {
                const textPart = (parsed as Array<{ type?: string; text?: string }>).find(
                    (p) => p.type === 'text',
                );
                return textPart?.text ?? '';
            } else if (typeof obj.text === 'string') {
                return obj.text;
            }
        }
    } catch {
        return content;
    }
    return '';
}

/** Filter out sub-agent threads and internal threads (resourceId "routingAgent"). */
function isMainThread(thread: Record<string, unknown>): boolean {
    const resourceId = thread.resourceId as string;
    return (
        !resourceId.endsWith('-datagovAgent') &&
        !resourceId.endsWith('-cbsAgent') &&
        resourceId !== 'routingAgent'
    );
}

// ---------------------------------------------------------------------------
// getOverviewStats
// ---------------------------------------------------------------------------

export interface OverviewStats {
    totalThreads: number;
    emptyThreads: number;
    totalMessages: number;
    uniqueActiveUsers: number;
    totalRegisteredUsers: number;
    totalGuests: number;
    registeredWhoOpenedThreads: number;
    guestsWhoOpenedThreads: number;
    registeredConversionPct: number;
    guestConversionPct: number;
    avgThreadsPerUser: number;
    avgThreadsPerGuest: number;
    avgMessagesPerUser: number;
    avgMessagesPerGuest: number;
    avgMessagesPerThread: number;
}

export const getOverviewStats = query({
    args: {
        sinceTimestamp: v.optional(v.number()),
    },
    handler: async (ctx, { sinceTimestamp }): Promise<OverviewStats> => {
        const sinceIso = sinceTimestamp !== undefined ? toIsoString(sinceTimestamp) : undefined;

        // --- Threads in range (main threads only, excluding sub-agent & internal) ---
        const allThreads =
            sinceIso !== undefined
                ? await ctx.db
                      .query('mastra_threads')
                      .withIndex('by_created', (q) => q.gte('createdAt', sinceIso))
                      .collect()
                : await ctx.db.query('mastra_threads').collect();

        const threads = allThreads.filter(isMainThread);
        const totalThreads = threads.length;

        // --- Count messages from thread_usage (lightweight) instead of mastra_messages ---
        // mastra_messages has huge content fields that exceed Convex's 16MB read limit.
        // thread_usage has one small record per agent turn ≈ one user message.
        let totalMessages = 0;
        let emptyThreads = 0;
        const messagesByResourceId = new Map<string, number>();
        const activeThreads: typeof threads = [];

        for (const thread of threads) {
            const usageRecords = await ctx.db
                .query('thread_usage')
                .withIndex('by_thread', (q) => q.eq('threadId', thread.id))
                .collect();
            const turnCount = usageRecords.length;
            if (turnCount > 0) {
                activeThreads.push(thread);
                totalMessages += turnCount;
                const prev = messagesByResourceId.get(thread.resourceId) ?? 0;
                messagesByResourceId.set(thread.resourceId, prev + turnCount);
            } else {
                emptyThreads++;
            }
        }

        // --- Unique active users (distinct resourceId across ALL threads, including empty) ---
        const activeResourceIds = new Set(threads.map((t) => t.resourceId));
        const uniqueActiveUsers = activeResourceIds.size;

        // --- Total registered users & guests (all-time counts) ---
        const allUsers = await ctx.db.query('users').collect();
        const allGuests = await ctx.db.query('guests').collect();
        const totalRegisteredUsers = allUsers.length;
        const totalGuests = allGuests.length;

        // --- Classify active resourceIds as registered vs guest ---
        // Registered users: their resourceId matches a clerkId in the users table.
        // Guests: their resourceId matches a sessionId in the guests table.
        const registeredClerkIds = new Set(allUsers.map((u) => u.clerkId));
        const guestSessionIds = new Set(allGuests.map((g) => g.sessionId));

        const registeredActiveIds = new Set<string>();
        const guestActiveIds = new Set<string>();

        for (const resourceId of activeResourceIds) {
            if (registeredClerkIds.has(resourceId)) {
                registeredActiveIds.add(resourceId);
            } else if (guestSessionIds.has(resourceId)) {
                guestActiveIds.add(resourceId);
            } else {
                // Unknown resourceId — treat as guest
                guestActiveIds.add(resourceId);
            }
        }

        const registeredWhoOpenedThreads = registeredActiveIds.size;
        const guestsWhoOpenedThreads = guestActiveIds.size;

        const registeredConversionPct =
            totalRegisteredUsers > 0 ? Math.round((registeredWhoOpenedThreads / totalRegisteredUsers) * 100) : 0;
        const guestConversionPct = totalGuests > 0 ? Math.round((guestsWhoOpenedThreads / totalGuests) * 100) : 0;

        // --- Per-user averages (thread counts split by user type) ---
        let registeredThreadCount = 0;
        let guestThreadCount = 0;

        for (const thread of activeThreads) {
            if (registeredClerkIds.has(thread.resourceId)) {
                registeredThreadCount++;
            } else {
                guestThreadCount++;
            }
        }

        // Sum messages by user type from the resourceId→msgCount map
        let registeredMsgSum = 0;
        let guestMsgSum = 0;
        for (const [resourceId, msgCount] of messagesByResourceId.entries()) {
            if (registeredClerkIds.has(resourceId)) {
                registeredMsgSum += msgCount;
            } else {
                guestMsgSum += msgCount;
            }
        }

        const avgThreadsPerUser =
            registeredActiveIds.size > 0 ? Math.round((registeredThreadCount / registeredActiveIds.size) * 10) / 10 : 0;
        const avgThreadsPerGuest =
            guestActiveIds.size > 0 ? Math.round((guestThreadCount / guestActiveIds.size) * 10) / 10 : 0;
        const avgMessagesPerUser =
            registeredActiveIds.size > 0 ? Math.round((registeredMsgSum / registeredActiveIds.size) * 10) / 10 : 0;
        const avgMessagesPerGuest =
            guestActiveIds.size > 0 ? Math.round((guestMsgSum / guestActiveIds.size) * 10) / 10 : 0;
        const activeThreadCount = activeThreads.length;
        const avgMessagesPerThread = activeThreadCount > 0 ? Math.round((totalMessages / activeThreadCount) * 10) / 10 : 0;

        return {
            totalThreads,
            emptyThreads,
            totalMessages,
            uniqueActiveUsers,
            totalRegisteredUsers,
            totalGuests,
            registeredWhoOpenedThreads,
            guestsWhoOpenedThreads,
            registeredConversionPct,
            guestConversionPct,
            avgThreadsPerUser,
            avgThreadsPerGuest,
            avgMessagesPerUser,
            avgMessagesPerGuest,
            avgMessagesPerThread,
        };
    },
});

// ---------------------------------------------------------------------------
// getThreadOrigins
// ---------------------------------------------------------------------------

export interface ThreadOriginEntry {
    label: string;
    count: number;
}

export const getThreadOrigins = query({
    args: {
        sinceTimestamp: v.optional(v.number()),
    },
    handler: async (ctx, { sinceTimestamp }): Promise<ThreadOriginEntry[]> => {
        const sinceIso = sinceTimestamp !== undefined ? toIsoString(sinceTimestamp) : undefined;

        const allThreads =
            sinceIso !== undefined
                ? await ctx.db
                      .query('mastra_threads')
                      .withIndex('by_created', (q) => q.gte('createdAt', sinceIso))
                      .collect()
                : await ctx.db.query('mastra_threads').collect();

        const threads = allThreads.filter(isMainThread);

        // Build a label→count map, initialised with all prompt card labels + free text
        const counts = new Map<string, number>(PROMPT_CARD_ENTRIES.map((c) => [c.label, 0]));
        const FREE_TEXT_LABEL = 'שאילתה חופשית';
        counts.set(FREE_TEXT_LABEL, 0);

        // Build prompt→label lookup for O(1) matching
        const promptToLabel = new Map<string, string>(PROMPT_CARD_ENTRIES.map((c) => [c.prompt, c.label]));

        for (const thread of threads) {
            // Find the earliest user message in this thread
            const firstMsg = await ctx.db
                .query('mastra_messages')
                .withIndex('by_thread_created', (q) => q.eq('thread_id', thread.id))
                .filter((q) => q.eq(q.field('role'), 'user'))
                .order('asc')
                .first();

            if (!firstMsg) {
                // Skip empty/abandoned threads — no user message means no real conversation
                continue;
            }

            const messageText = extractMessageText(firstMsg.content);

            const label = promptToLabel.get(messageText);
            if (label !== undefined) {
                counts.set(label, (counts.get(label) ?? 0) + 1);
            } else {
                counts.set(FREE_TEXT_LABEL, (counts.get(FREE_TEXT_LABEL) ?? 0) + 1);
            }
        }

        // Return only entries with count > 0, sorted descending
        return Array.from(counts.entries())
            .filter(([, count]) => count > 0)
            .sort((a, b) => b[1] - a[1])
            .map(([label, count]) => ({ label, count }));
    },
});

// ---------------------------------------------------------------------------
// getThreadsOverTime
// ---------------------------------------------------------------------------

export interface ThreadsBucketEntry {
    bucket: string;
    count: number;
}

export const getThreadsOverTime = query({
    args: {
        sinceTimestamp: v.optional(v.number()),
        bucketSize: v.union(v.literal('hour'), v.literal('day')),
    },
    handler: async (ctx, { sinceTimestamp, bucketSize }): Promise<ThreadsBucketEntry[]> => {
        const sinceIso = sinceTimestamp !== undefined ? toIsoString(sinceTimestamp) : undefined;

        const allThreads =
            sinceIso !== undefined
                ? await ctx.db
                      .query('mastra_threads')
                      .withIndex('by_created', (q) => q.gte('createdAt', sinceIso))
                      .collect()
                : await ctx.db.query('mastra_threads').collect();

        const threads = allThreads.filter(isMainThread);

        // Group threads by time bucket (skip empty/abandoned threads)
        const bucketCounts = new Map<string, number>();

        for (const thread of threads) {
            // Skip threads with no messages
            const hasMessage = await ctx.db
                .query('thread_usage')
                .withIndex('by_thread', (q) => q.eq('threadId', thread.id))
                .first();
            if (!hasMessage) continue;

            const d = new Date(thread.createdAt as string);
            let bucket: string;

            if (bucketSize === 'hour') {
                // "YYYY-MM-DDTHH:00:00.000Z"
                bucket = new Date(
                    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), 0, 0, 0),
                ).toISOString();
            } else {
                // "YYYY-MM-DDT00:00:00.000Z"
                bucket = new Date(
                    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0),
                ).toISOString();
            }

            bucketCounts.set(bucket, (bucketCounts.get(bucket) ?? 0) + 1);
        }

        // Return sorted by bucket ascending
        return Array.from(bucketCounts.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([bucket, count]) => ({ bucket, count }));
    },
});

// ---------------------------------------------------------------------------
// getTokenUsageByModel
// ---------------------------------------------------------------------------

export interface TokenUsageByModelEntry {
    model: string;
    promptTokens: number;
    completionTokens: number;
}

export const getTokenUsageByModel = query({
    args: {
        sinceTimestamp: v.optional(v.number()),
    },
    handler: async (ctx, { sinceTimestamp }): Promise<TokenUsageByModelEntry[]> => {
        // thread_billing.createdAt is a Unix ms number (not ISO string)
        const billingRecords =
            sinceTimestamp !== undefined
                ? await ctx.db
                      .query('thread_billing')
                      .filter((q) => q.gte(q.field('createdAt'), sinceTimestamp))
                      .collect()
                : await ctx.db.query('thread_billing').collect();

        const modelTotals = new Map<string, { promptTokens: number; completionTokens: number }>();

        for (const record of billingRecords) {
            const existing = modelTotals.get(record.model) ?? {
                promptTokens: 0,
                completionTokens: 0,
            };
            modelTotals.set(record.model, {
                promptTokens: existing.promptTokens + (record.usage.promptTokens ?? 0),
                completionTokens: existing.completionTokens + (record.usage.completionTokens ?? 0),
            });
        }

        return Array.from(modelTotals.entries())
            .map(([model, totals]) => ({
                model,
                promptTokens: totals.promptTokens,
                completionTokens: totals.completionTokens,
            }))
            .sort((a, b) => b.promptTokens + b.completionTokens - (a.promptTokens + a.completionTokens));
    },
});

// ---------------------------------------------------------------------------
// getAgentDelegationBreakdown
// ---------------------------------------------------------------------------

export interface AgentDelegationEntry {
    label: string;
    count: number;
}

const AGENT_LABELS = {
    DATAGOV: 'data.gov.il',
    CBS: 'הלמ\u05f3ס',
} as const;

export const getAgentDelegationBreakdown = query({
    args: {
        sinceTimestamp: v.optional(v.number()),
    },
    handler: async (ctx, { sinceTimestamp }): Promise<AgentDelegationEntry[]> => {
        const sinceIso = sinceTimestamp !== undefined ? toIsoString(sinceTimestamp) : undefined;

        const threads =
            sinceIso !== undefined
                ? await ctx.db
                      .query('mastra_threads')
                      .withIndex('by_created', (q) => q.gte('createdAt', sinceIso))
                      .collect()
                : await ctx.db.query('mastra_threads').collect();

        // Count sub-agent threads by resourceId suffix.
        // Each sub-agent thread represents one delegation call to that agent.
        let datagovCount = 0;
        let cbsCount = 0;

        for (const thread of threads) {
            const resourceId = thread.resourceId as string;
            if (resourceId.endsWith('-datagovAgent')) {
                datagovCount++;
            } else if (resourceId.endsWith('-cbsAgent')) {
                cbsCount++;
            }
        }

        const results: AgentDelegationEntry[] = [];
        if (datagovCount > 0) results.push({ label: AGENT_LABELS.DATAGOV, count: datagovCount });
        if (cbsCount > 0) results.push({ label: AGENT_LABELS.CBS, count: cbsCount });

        return results.sort((a, b) => b.count - a.count);
    },
});

// ---------------------------------------------------------------------------
// getFreeTextPrompts
// ---------------------------------------------------------------------------

export interface FreeTextPromptEntry {
    text: string;
    createdAt: string;
}

export const getFreeTextPrompts = query({
    args: {
        sinceTimestamp: v.optional(v.number()),
    },
    handler: async (ctx, { sinceTimestamp }): Promise<FreeTextPromptEntry[]> => {
        const sinceIso = sinceTimestamp !== undefined ? toIsoString(sinceTimestamp) : undefined;

        const allThreads =
            sinceIso !== undefined
                ? await ctx.db
                      .query('mastra_threads')
                      .withIndex('by_created', (q) => q.gte('createdAt', sinceIso))
                      .collect()
                : await ctx.db.query('mastra_threads').collect();

        const threads = allThreads.filter(isMainThread);

        // Build prompt→label lookup for detecting prompt-card messages
        const promptCardTexts = new Set(PROMPT_CARD_ENTRIES.map((c) => c.prompt));

        const freeTexts: FreeTextPromptEntry[] = [];

        for (const thread of threads) {
            const firstMsg = await ctx.db
                .query('mastra_messages')
                .withIndex('by_thread_created', (q) => q.eq('thread_id', thread.id))
                .filter((q) => q.eq(q.field('role'), 'user'))
                .order('asc')
                .first();

            if (!firstMsg) continue;

            const messageText = extractMessageText(firstMsg.content);
            if (!messageText || promptCardTexts.has(messageText)) continue;

            freeTexts.push({
                text: messageText,
                createdAt: thread.createdAt as string,
            });
        }

        // Return sorted by createdAt descending (newest first)
        return freeTexts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
});
