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

import { query, type QueryCtx } from './_generated/server';
import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';

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
                const textPart = (obj.parts as Array<{ type?: string; text?: string }>).find((p) => p.type === 'text');
                return textPart?.text ?? '';
            } else if (Array.isArray(parsed)) {
                const textPart = (parsed as Array<{ type?: string; text?: string }>).find((p) => p.type === 'text');
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
    return !resourceId.endsWith('-datagovAgent') && !resourceId.endsWith('-cbsAgent') && resourceId !== 'routingAgent';
}

/** Get the current authenticated user's resourceId (Clerk subject) to exclude from stats. */
async function getCallerResourceId(ctx: QueryCtx): Promise<string | null> {
    const identity = await ctx.auth.getUserIdentity();
    return identity?.subject ?? null;
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
        untilTimestamp: v.optional(v.number()),
    },
    handler: async (ctx, { sinceTimestamp, untilTimestamp }): Promise<OverviewStats> => {
        const sinceIso = sinceTimestamp !== undefined ? toIsoString(sinceTimestamp) : undefined;
        const untilIso = untilTimestamp !== undefined ? toIsoString(untilTimestamp) : undefined;
        const callerResourceId = await getCallerResourceId(ctx);

        // --- Threads in range (main threads only, excluding sub-agent, internal & current admin) ---
        const allThreads =
            sinceIso !== undefined
                ? await ctx.db
                      .query('mastra_threads')
                      .withIndex('by_created', (q) => q.gte('createdAt', sinceIso))
                      .collect()
                : await ctx.db.query('mastra_threads').collect();

        const threads = allThreads.filter(
            (t) =>
                isMainThread(t) &&
                t.resourceId !== callerResourceId &&
                (untilIso === undefined || (t.createdAt as string) <= untilIso),
        );
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

        // --- Total registered users & guests (all-time counts, excluding current admin) ---
        const allUsers = await ctx.db.query('users').collect();
        const allGuests = await ctx.db.query('guests').collect();
        const filteredUsers = callerResourceId ? allUsers.filter((u) => u.clerkId !== callerResourceId) : allUsers;
        const totalRegisteredUsers = filteredUsers.length;
        const totalGuests = allGuests.length;

        // --- Classify active resourceIds as registered vs guest ---
        // Registered users: their resourceId matches a clerkId in the users table.
        // Guests: their resourceId matches a sessionId in the guests table.
        const registeredClerkIds = new Set(filteredUsers.map((u) => u.clerkId));
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

        // --- Per-user averages (thread counts split by user type, including empty) ---
        let registeredThreadCount = 0;
        let guestThreadCount = 0;
        let registeredActiveThreadCount = 0;
        let guestActiveThreadCount = 0;

        for (const thread of threads) {
            const isActive = activeThreads.includes(thread);
            if (registeredClerkIds.has(thread.resourceId)) {
                registeredThreadCount++;
                if (isActive) registeredActiveThreadCount++;
            } else {
                guestThreadCount++;
                if (isActive) guestActiveThreadCount++;
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
        // Per-thread averages (messages / active threads) per user type — consistent with the KPI
        const avgMessagesPerUser =
            registeredActiveThreadCount > 0
                ? Math.round((registeredMsgSum / registeredActiveThreadCount) * 10) / 10
                : 0;
        const avgMessagesPerGuest =
            guestActiveThreadCount > 0 ? Math.round((guestMsgSum / guestActiveThreadCount) * 10) / 10 : 0;
        const activeThreadCount = activeThreads.length;
        const avgMessagesPerThread =
            activeThreadCount > 0 ? Math.round((totalMessages / activeThreadCount) * 10) / 10 : 0;

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
        const callerResourceId = await getCallerResourceId(ctx);

        const allThreads =
            sinceIso !== undefined
                ? await ctx.db
                      .query('mastra_threads')
                      .withIndex('by_created', (q) => q.gte('createdAt', sinceIso))
                      .collect()
                : await ctx.db.query('mastra_threads').collect();

        const threads = allThreads.filter((t) => isMainThread(t) && t.resourceId !== callerResourceId);

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
        const callerResourceId = await getCallerResourceId(ctx);

        const allThreads =
            sinceIso !== undefined
                ? await ctx.db
                      .query('mastra_threads')
                      .withIndex('by_created', (q) => q.gte('createdAt', sinceIso))
                      .collect()
                : await ctx.db.query('mastra_threads').collect();

        const threads = allThreads.filter((t) => isMainThread(t) && t.resourceId !== callerResourceId);

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

// ---------------------------------------------------------------------------
// getAnswersOverTime
// ---------------------------------------------------------------------------

export const getAnswersOverTime = query({
    args: {
        sinceTimestamp: v.optional(v.number()),
        untilTimestamp: v.optional(v.number()),
        bucketSize: v.union(v.literal('hour'), v.literal('day')),
    },
    handler: async (ctx, { sinceTimestamp, untilTimestamp, bucketSize }): Promise<ThreadsBucketEntry[]> => {
        const allAnswers = await ctx.db.query('answers').withIndex('by_created').order('asc').collect();
        const answers = allAnswers.filter(
            (a) =>
                (sinceTimestamp === undefined || a.createdAt >= sinceTimestamp) &&
                (untilTimestamp === undefined || a.createdAt <= untilTimestamp),
        );

        const bucketCounts = new Map<string, number>();

        for (const answer of answers) {
            const d = new Date(answer.createdAt);
            let bucket: string;

            if (bucketSize === 'hour') {
                bucket = new Date(
                    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), 0, 0, 0),
                ).toISOString();
            } else {
                bucket = new Date(
                    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0),
                ).toISOString();
            }

            bucketCounts.set(bucket, (bucketCounts.get(bucket) ?? 0) + 1);
        }

        return Array.from(bucketCounts.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([bucket, count]) => ({ bucket, count }));
    },
});

// Agent suffix → display label mapping.
// Must be inlined here — Convex functions cannot import from src/.
const AGENT_SUFFIX_LABELS: Record<string, string> = {
    datagovAgent: 'data.gov.il',
    cbsAgent: 'הלמ"ס',
    budgetAgent: 'תקציב המדינה',
    govmapAgent: 'מערכת המפות הממשלתית',
    healthAgent: 'משרד הבריאות',
    knessetAgent: 'הכנסת',
    ramiLevyAgent: 'רמי לוי',
    shufersalAgent: 'שופרסל',
};

export const getAgentDelegationBreakdown = query({
    args: {
        sinceTimestamp: v.optional(v.number()),
        untilTimestamp: v.optional(v.number()),
    },
    handler: async (ctx, { sinceTimestamp, untilTimestamp }): Promise<AgentDelegationEntry[]> => {
        const sinceIso = sinceTimestamp !== undefined ? toIsoString(sinceTimestamp) : undefined;
        const untilIso = untilTimestamp !== undefined ? toIsoString(untilTimestamp) : undefined;
        const callerResourceId = await getCallerResourceId(ctx);

        const allThreads =
            sinceIso !== undefined
                ? await ctx.db
                      .query('mastra_threads')
                      .withIndex('by_created', (q) => q.gte('createdAt', sinceIso))
                      .collect()
                : await ctx.db.query('mastra_threads').collect();

        const threads =
            untilIso !== undefined ? allThreads.filter((t) => (t.createdAt as string) <= untilIso) : allThreads;

        // Count sub-agent threads by resourceId suffix.
        // Each sub-agent thread represents one delegation call to that agent.
        // Exclude sub-agent threads belonging to the current admin user.
        const counts = new Map<string, number>();

        for (const thread of threads) {
            const resourceId = thread.resourceId as string;
            if (callerResourceId && resourceId.startsWith(callerResourceId)) continue;

            for (const suffix of Object.keys(AGENT_SUFFIX_LABELS)) {
                if (resourceId.endsWith(`-${suffix}`)) {
                    counts.set(suffix, (counts.get(suffix) ?? 0) + 1);
                    break;
                }
            }
        }

        return Array.from(counts.entries())
            .map(([suffix, count]) => ({ label: AGENT_SUFFIX_LABELS[suffix]!, count }))
            .sort((a, b) => b.count - a.count);
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
        const callerResourceId = await getCallerResourceId(ctx);

        const allThreads =
            sinceIso !== undefined
                ? await ctx.db
                      .query('mastra_threads')
                      .withIndex('by_created', (q) => q.gte('createdAt', sinceIso))
                      .collect()
                : await ctx.db.query('mastra_threads').collect();

        const threads = allThreads.filter((t) => isMainThread(t) && t.resourceId !== callerResourceId);

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

// ---------------------------------------------------------------------------
// getAnswerRatingStats
// ---------------------------------------------------------------------------

export interface AnswerRatingStats {
    totalAnswers: number;
    totalRated: number;
    goodCount: number;
    badCount: number;
}

export const getAnswerRatingStats = query({
    args: {
        sinceTimestamp: v.optional(v.number()),
        untilTimestamp: v.optional(v.number()),
    },
    handler: async (ctx, { sinceTimestamp, untilTimestamp }): Promise<AnswerRatingStats> => {
        const allAnswers = await ctx.db.query('answers').collect();
        const answers = allAnswers.filter(
            (a) =>
                (sinceTimestamp === undefined || a.createdAt >= sinceTimestamp) &&
                (untilTimestamp === undefined || a.createdAt <= untilTimestamp),
        );

        const allRatings = await ctx.db.query('answer_ratings').collect();
        const ratings = allRatings.filter(
            (r) =>
                (sinceTimestamp === undefined || r.createdAt >= sinceTimestamp) &&
                (untilTimestamp === undefined || r.createdAt <= untilTimestamp),
        );

        let goodCount = 0;
        let badCount = 0;
        for (const rating of ratings) {
            if (rating.rating === 'good') goodCount++;
            else badCount++;
        }

        return {
            totalAnswers: answers.length,
            totalRated: ratings.length,
            goodCount,
            badCount,
        };
    },
});

// ---------------------------------------------------------------------------
// getAnswersList
// ---------------------------------------------------------------------------

export interface AnswerEntry {
    answerId: Id<'answers'>;
    threadId: string;
    userPrompt: string;
    assistantResponse: string;
    createdAt: number;
    rating: 'good' | 'bad' | null;
}

export const getAnswersList = query({
    args: {
        sinceTimestamp: v.optional(v.number()),
        untilTimestamp: v.optional(v.number()),
    },
    handler: async (ctx, { sinceTimestamp, untilTimestamp }): Promise<AnswerEntry[]> => {
        const allAnswers = await ctx.db.query('answers').withIndex('by_created').order('desc').take(200);
        const answers = allAnswers.filter(
            (a) =>
                (sinceTimestamp === undefined || a.createdAt >= sinceTimestamp) &&
                (untilTimestamp === undefined || a.createdAt <= untilTimestamp),
        );

        // Single scan of answer_ratings → Map<answerId, rating>
        const allRatings = await ctx.db.query('answer_ratings').collect();
        const ratingMap = new Map<string, 'good' | 'bad'>();
        for (const r of allRatings) {
            // Keep only the latest rating per answer (last write wins)
            ratingMap.set(r.answerId, r.rating);
        }

        return answers.slice(0, 100).map((a) => ({
            answerId: a._id,
            threadId: a.threadId,
            userPrompt: a.userPrompt,
            assistantResponse: a.assistantResponse,
            createdAt: a.createdAt,
            rating: ratingMap.get(a._id) ?? null,
        }));
    },
});
