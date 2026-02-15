/**
 * Sync to Convex Script
 *
 * Fetches all datasets from data.gov.il and uploads them to Convex
 * with RAG indexing for semantic search
 *
 * Usage: npx tsx scripts/sync-to-convex.ts
 */

import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { dataGovApi } from '@/lib/api/data-gov/client';
import type { Id } from '@/convex/_generated/dataModel';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://dynamic-egret-97.eu-west-1.convex.cloud';
const BATCH_SIZE = 20; // Process datasets in batches
const DELAY_BETWEEN_BATCHES_MS = 2000; // Wait between batches to avoid rate limits

const convex = new ConvexHttpClient(CONVEX_URL);

async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function syncDatasets(): Promise<void> {
    console.log('🚀 Starting Convex sync...\n');
    console.log(`📡 Convex URL: ${CONVEX_URL}\n`);

    // Step 1: Get all dataset IDs from data.gov.il
    console.log('📋 Fetching list of all dataset IDs from data.gov.il...');
    const datasetIds = await dataGovApi.dataset.list();
    console.log(`✅ Found ${datasetIds.length} datasets\n`);

    // Step 2: Fetch and sync each dataset
    let synced = 0;
    let indexedDatasets = 0;
    let indexedResources = 0;
    const errors: Array<{ id: string; error: string }> = [];
    const totalBatches = Math.ceil(datasetIds.length / BATCH_SIZE);

    for (let i = 0; i < datasetIds.length; i += BATCH_SIZE) {
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        const batch = datasetIds.slice(i, i + BATCH_SIZE);

        console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} datasets)...`);

        for (const datasetId of batch) {
            try {
                // Fetch full dataset details from CKAN
                const dataset = await dataGovApi.dataset.show(datasetId);

                // Upsert dataset to Convex
                const convexDatasetId = await convex.mutation(api.datasets.upsert, {
                    ckanId: dataset.id,
                    title: dataset.title,
                    name: dataset.name,
                    notes: dataset.notes || undefined,
                    organizationId: dataset.organization?.id,
                    organizationTitle: dataset.organization?.title,
                    tags: dataset.tags.map((t) => t.name),
                    metadataCreated: dataset.metadata_created,
                    metadataModified: dataset.metadata_modified,
                    author: dataset.author || undefined,
                    maintainer: dataset.maintainer || undefined,
                    licenseTitle: dataset.license_title || undefined,
                });

                // Sync and index resources
                for (const resource of dataset.resources) {
                    try {
                        await convex.mutation(api.resources.upsert, {
                            ckanId: resource.id,
                            datasetId: convexDatasetId as Id<'datasets'>,
                            datasetCkanId: dataset.id,
                            name: resource.name || undefined,
                            url: resource.url,
                            format: resource.format || 'UNKNOWN',
                            description: resource.description || undefined,
                            size: resource.size || undefined,
                            created: resource.created || undefined,
                            lastModified: resource.last_modified || undefined,
                        });

                        // Index resource for RAG search
                        try {
                            const result = await convex.action(api.search.indexResource, {
                                ckanId: resource.id,
                                name: resource.name || undefined,
                                description: resource.description || undefined,
                                format: resource.format || 'UNKNOWN',
                                datasetCkanId: dataset.id,
                            });
                            if (result.success) {
                                indexedResources++;
                            }
                        } catch (indexError) {
                            // Log but don't fail on index errors
                            console.warn(
                                `   ⚠️ Resource index error for ${resource.id}:`,
                                indexError instanceof Error ? indexError.message : String(indexError),
                            );
                        }
                    } catch (resourceError) {
                        // Log but don't fail on individual resource errors
                        console.warn(
                            `   ⚠️ Resource ${resource.id} error:`,
                            resourceError instanceof Error ? resourceError.message : String(resourceError),
                        );
                    }
                }

                // Index dataset for RAG search
                try {
                    await convex.action(api.search.indexDataset, {
                        ckanId: dataset.id,
                        title: dataset.title,
                        notes: dataset.notes || undefined,
                        tags: dataset.tags.map((t) => t.name),
                        organizationId: dataset.organization?.id,
                        organizationTitle: dataset.organization?.title,
                    });
                    indexedDatasets++;
                } catch (indexError) {
                    console.warn(
                        `   ⚠️ Index error for ${dataset.id}:`,
                        indexError instanceof Error ? indexError.message : String(indexError),
                    );
                }

                synced++;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                errors.push({ id: datasetId, error: errorMessage });
            }
        }

        console.log(
            `   ✅ Synced: ${synced}/${datasetIds.length}, Datasets indexed: ${indexedDatasets}, Resources indexed: ${indexedResources}`,
        );

        // Wait between batches
        if (i + BATCH_SIZE < datasetIds.length) {
            await sleep(DELAY_BETWEEN_BATCHES_MS);
        }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Sync Summary:');
    console.log(`   Total datasets synced: ${synced}`);
    console.log(`   Datasets indexed for RAG: ${indexedDatasets}`);
    console.log(`   Resources indexed for RAG: ${indexedResources}`);
    console.log(`   Errors: ${errors.length}`);
    console.log('='.repeat(50));

    if (errors.length > 0) {
        console.log('\n⚠️ Errors encountered:');
        errors.slice(0, 10).forEach(({ id, error }) => {
            console.log(`   - ${id}: ${error}`);
        });
        if (errors.length > 10) {
            console.log(`   ... and ${errors.length - 10} more errors`);
        }
    }
}

// Run the script
syncDatasets()
    .then(() => {
        console.log('\n✅ Sync completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Sync failed:', error);
        process.exit(1);
    });
