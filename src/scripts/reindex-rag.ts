/**
 * Re-index RAG Embeddings Script
 *
 * Reads existing datasets from Convex DB and re-indexes them for RAG search.
 * Does NOT re-fetch from CKAN — only re-embeds with current indexing logic
 * (cleaned tags: deduplicated, max 5).
 *
 * Usage: npx tsx scripts/reindex-rag.ts
 */

import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://dynamic-egret-97.eu-west-1.convex.cloud';
const BATCH_SIZE = 10;
const DELAY_BETWEEN_BATCHES_MS = 3000;

const convex = new ConvexHttpClient(CONVEX_URL);

async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function reindexDatasets(): Promise<void> {
    console.log('Starting RAG re-index...\n');
    console.log(`Convex URL: ${CONVEX_URL}\n`);

    // Step 1: Read all datasets from Convex (no CKAN calls)
    console.log('Reading existing datasets from Convex...');

    const rawDatasets = await convex.query(api.datasets.list, { limit: 2000 });
    const allDatasets = (rawDatasets as Array<Record<string, unknown>>).map((d) => ({
        ckanId: d.ckanId as string,
        title: d.title as string,
        notes: (d.notes as string) ?? undefined,
        tags: d.tags as string[],
        organizationId: (d.organizationId as string) ?? undefined,
        organizationTitle: (d.organizationTitle as string) ?? undefined,
    }));

    console.log(`Found ${allDatasets.length} datasets in Convex\n`);

    // Step 2: Re-index in batches
    let indexed = 0;
    let errors = 0;
    const totalBatches = Math.ceil(allDatasets.length / BATCH_SIZE);

    for (let i = 0; i < allDatasets.length; i += BATCH_SIZE) {
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        const batch = allDatasets.slice(i, i + BATCH_SIZE);

        process.stdout.write(`Batch ${batchNumber}/${totalBatches} (${indexed}/${allDatasets.length} indexed)...`);

        for (const dataset of batch) {
            try {
                await convex.action(api.search.indexDataset, {
                    ckanId: dataset.ckanId,
                    title: dataset.title,
                    notes: dataset.notes,
                    tags: dataset.tags,
                    organizationId: dataset.organizationId,
                    organizationTitle: dataset.organizationTitle,
                });
                indexed++;
            } catch (error) {
                errors++;
                const msg = error instanceof Error ? error.message : String(error);
                // Stop entirely on rate limit errors
                if (msg.includes('Key limit') || msg.includes('rate') || msg.includes('429')) {
                    console.error(`\n\nRate limit hit after ${indexed} datasets. Re-run later to continue.`);
                    console.log(`Indexed: ${indexed}, Errors: ${errors}`);
                    process.exit(1);
                }
            }
        }

        console.log(` done`);

        if (i + BATCH_SIZE < allDatasets.length) {
            await sleep(DELAY_BETWEEN_BATCHES_MS);
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log('RAG Re-index Summary:');
    console.log(`  Datasets re-indexed: ${indexed}`);
    console.log(`  Errors: ${errors}`);
    console.log('='.repeat(50));
}

reindexDatasets()
    .then(() => {
        console.log('\nRe-index completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\nRe-index failed:', error);
        process.exit(1);
    });
