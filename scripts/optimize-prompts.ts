/**
 * Prompt Optimization Script
 *
 * Queries Convex for low-scoring eval results, groups failures by scorer,
 * builds a meta-prompt, calls a strong LLM to produce a revised prompt,
 * and saves the result to Convex and/or a local file.
 *
 * Usage:
 *   tsx scripts/optimize-prompts.ts routingAgent --local
 *   tsx scripts/optimize-prompts.ts routingAgent --local-only
 *   tsx scripts/optimize-prompts.ts routingAgent --threshold 0.5 --days 7
 *   tsx scripts/optimize-prompts.ts routingAgent --since 2026-03-04T18:00:00Z
 *
 * Flags:
 *   --local        Save to Convex + local file
 *   --local-only   Save to local file only (skip Convex)
 *   --threshold N  Score threshold (default: 0.7)
 *   --days N       Look back N days (default: 30)
 *   --since ISO    Only include scores after this ISO timestamp (overrides --days)
 */

import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { getAgentPrompt } from '@/agents/evals/optimizer/read-agent-config';
import { buildMetaPrompt, type FailureGroup } from '@/agents/evals/optimizer/meta-prompt';
import { EVAL_CONFIG } from '../agents/evals/eval.config';
import { generateText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseArgs(argv: string[]) {
    const args = argv.slice(2);
    const agentId = args[0];
    const localOnly = args.includes('--local-only');
    const saveLocal = localOnly || args.includes('--local');
    const saveConvex = !localOnly;

    const thresholdIdx = args.indexOf('--threshold');
    const threshold = thresholdIdx !== -1 ? parseFloat(args[thresholdIdx + 1] ?? '') : EVAL_CONFIG.SCORE_THRESHOLD;

    const daysIdx = args.indexOf('--days');
    const days = daysIdx !== -1 ? parseInt(args[daysIdx + 1] ?? '30', 10) : 30;

    // --since takes an ISO date string and overrides --days
    const sinceIdx = args.indexOf('--since');
    let since: number;
    if (sinceIdx !== -1 && args[sinceIdx + 1]) {
        const parsed = Date.parse(args[sinceIdx + 1]);
        if (Number.isNaN(parsed)) {
            console.error(`Invalid --since date: ${args[sinceIdx + 1]}. Use ISO format like 2026-03-04T18:00:00Z`);
            process.exit(1);
        }
        since = parsed;
    } else {
        since = Date.now() - days * MS_PER_DAY;
    }

    return { agentId, localOnly, saveLocal, saveConvex, threshold, since };
}

async function main() {
    const { agentId, saveLocal, saveConvex, threshold, since } = parseArgs(process.argv);

    if (!agentId) {
        console.error(
            'Usage: tsx scripts/optimize-prompts.ts <agentId> [--local] [--local-only] [--threshold N] [--days N] [--since ISO]',
        );
        process.exit(1);
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
        console.error('Missing NEXT_PUBLIC_CONVEX_URL environment variable');
        process.exit(1);
    }

    const client = new ConvexHttpClient(convexUrl);

    console.log(`Querying scores for ${agentId} since ${new Date(since).toISOString()} (threshold < ${threshold})`);

    // 1. Query low scores from Convex
    const lowScores = await client.query(api.scores.getLowScores, {
        entityId: agentId,
        maxScore: threshold,
        since,
        limit: 100,
    });

    if (lowScores.length === 0) {
        console.log(`No low scores found for ${agentId}. No optimization needed.`);
        return;
    }

    console.log(`Found ${lowScores.length} low-scoring results`);

    // 2. Group by scorer
    const groups = new Map<string, FailureGroup>();
    for (const row of lowScores) {
        const key = row.scorerId;
        if (!groups.has(key)) {
            groups.set(key, { scorerId: key, avgScore: 0, examples: [] });
        }
        const group = groups.get(key)!;
        group.examples.push({
            input: JSON.stringify(row.input).slice(0, 300),
            output: JSON.stringify(row.output).slice(0, 600),
            score: row.score,
            reason: row.reason ?? 'No reason provided',
        });
    }
    for (const group of groups.values()) {
        group.avgScore = group.examples.reduce((sum, e) => sum + e.score, 0) / group.examples.length;
    }

    // Print failure summary
    console.log('\n--- Failure Summary ---');
    for (const g of groups.values()) {
        console.log(`  ${g.scorerId}: avg ${g.avgScore.toFixed(2)} (${g.examples.length} failures)`);
    }
    console.log('----------------------\n');

    // 3. Read current prompt
    const currentPrompt = getAgentPrompt(agentId);

    // 4. Build & send meta-prompt
    const metaPrompt = buildMetaPrompt(agentId, currentPrompt, [...groups.values()]);

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        console.error('Missing OPENROUTER_API_KEY environment variable');
        process.exit(1);
    }

    const openrouter = createOpenRouter({ apiKey });
    const modelId = EVAL_CONFIG.OPTIMIZER_MODEL.replace('openrouter/', '');

    console.log(`Generating optimized prompt using ${modelId}...`);
    const { text: proposedPrompt } = await generateText({
        model: openrouter(modelId),
        prompt: metaPrompt,
    });

    // 5. Generate rationale + changelog in a single LLM call
    const failureSummary = [...groups.values()]
        .map((g) => `- ${g.scorerId}: avg score ${g.avgScore.toFixed(2)} (${g.examples.length} failures)`)
        .join('\n');

    console.log('Generating rationale and changelog...');
    const { text: analysis } = await generateText({
        model: openrouter(modelId),
        prompt: `You are reviewing a proposed revision to an AI agent's system prompt.

## Scorer Failures That Triggered This Revision
${failureSummary}

## Original Prompt
\`\`\`
${currentPrompt}
\`\`\`

## Revised Prompt
\`\`\`
${proposedPrompt}
\`\`\`

Write two sections:

### Rationale
Explain WHY these changes are needed based on the scorer failures. What specific problems were detected? Why is the current prompt insufficient? How will the changes address each failure category? Be specific — reference the scorer names and scores.

### Changelog
List ONLY what changed between original and revised. For each change:
- Which section was modified
- What was added/modified/removed (quote the text)
- Which scorer failure it addresses

Use concise markdown bullet points.`,
    });

    console.log('\n' + analysis + '\n');

    // 6. Output -- save to Convex, local file, or both
    const scoresSummary = Object.fromEntries(
        [...groups.entries()].map(([k, g]) => [k, { avgScore: g.avgScore, count: g.examples.length }]),
    );

    if (saveLocal) {
        const fs = await import('fs');
        const dir = 'agents/evals/proposed-prompts';
        fs.mkdirSync(dir, { recursive: true });
        const filename = `${dir}/${agentId}-${new Date().toISOString().slice(0, 10)}.md`;
        fs.writeFileSync(
            filename,
            [
                `# Proposed Prompt: ${agentId}`,
                '',
                '## Scores Summary',
                JSON.stringify(scoresSummary, null, 2),
                '',
                '## Analysis',
                analysis,
                '',
                '## Proposed Prompt',
                proposedPrompt,
            ].join('\n'),
        );
        console.log(`Written to ${filename}`);
    }

    if (saveConvex) {
        await client.mutation(api.promptRevisions.save, {
            agentId,
            currentPrompt,
            proposedPrompt,
            scoresSummary,
            failureCount: lowScores.length,
            model: EVAL_CONFIG.OPTIMIZER_MODEL,
        });
        console.log(`Saved prompt revision to Convex for ${agentId} (${lowScores.length} failures analyzed)`);
    }
}

main().catch(console.error);
