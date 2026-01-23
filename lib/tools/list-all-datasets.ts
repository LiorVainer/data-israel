/**
 * List All Datasets Tool
 *
 * AI SDK tool for getting all dataset IDs on data.gov.il
 */

import { tool } from 'ai';
import { z } from 'zod';
import { dataGovApi } from '@/lib/api/data-gov/client';

export const listAllDatasets = tool({
  description:
    'Get a list of all dataset IDs (names) available on data.gov.il. Use when user needs a complete list of datasets or wants to know the total count.',
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const datasetIds = await dataGovApi.dataset.list();

      return {
        success: true,
        count: datasetIds.length,
        datasetIds,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
