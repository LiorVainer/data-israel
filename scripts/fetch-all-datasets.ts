/**
 * Fetch All Datasets Script
 *
 * Fetches all dataset IDs from data.gov.il, then retrieves full details
 * for each dataset and saves to data/datasets.json
 *
 * Usage: npx tsx scripts/fetch-all-datasets.ts
 */

import { dataGovApi } from '../lib/api/data-gov/client';
import { Dataset } from '../lib/api/data-gov/types';
import * as fs from 'fs';
import * as path from 'path';

const BATCH_SIZE = 50; // Process datasets in batches to avoid overwhelming the API
const DELAY_BETWEEN_BATCHES_MS = 1000; // Wait between batches

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchAllDatasets(): Promise<void> {
  console.log('🚀 Starting dataset fetch...\n');

  // Step 1: Get all dataset IDs
  console.log('📋 Fetching list of all dataset IDs...');
  const datasetIds = await dataGovApi.dataset.list();
  console.log(`✅ Found ${datasetIds.length} datasets\n`);

  // Step 2: Fetch details for each dataset in batches
  const allDatasets: Dataset[] = [];
  const errors: Array<{ id: string; error: string }> = [];

  const totalBatches = Math.ceil(datasetIds.length / BATCH_SIZE);

  for (let i = 0; i < datasetIds.length; i += BATCH_SIZE) {
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const batch = datasetIds.slice(i, i + BATCH_SIZE);

    console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} datasets)...`);

    const batchPromises = batch.map(async (id) => {
      try {
        const dataset = await dataGovApi.dataset.show(id);
        return { success: true as const, dataset };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false as const, id, error: errorMessage };
      }
    });

    const results = await Promise.all(batchPromises);

    for (const result of results) {
      if (result.success) {
        allDatasets.push(result.dataset);
      } else {
        errors.push({ id: result.id, error: result.error });
      }
    }

    console.log(`   ✅ Completed: ${allDatasets.length}/${datasetIds.length} datasets`);

    // Wait between batches to avoid rate limiting
    if (i + BATCH_SIZE < datasetIds.length) {
      await sleep(DELAY_BETWEEN_BATCHES_MS);
    }
  }

  // Step 3: Save to JSON file
  const outputDir = path.join(process.cwd(), 'data');
  const outputPath = path.join(outputDir, 'datasets.json');

  // Create data directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const output = {
    fetchedAt: new Date().toISOString(),
    totalDatasets: allDatasets.length,
    totalErrors: errors.length,
    datasets: allDatasets,
    errors: errors.length > 0 ? errors : undefined,
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log(`   Total datasets fetched: ${allDatasets.length}`);
  console.log(`   Errors: ${errors.length}`);
  console.log(`   Output saved to: ${outputPath}`);
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
fetchAllDatasets()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
