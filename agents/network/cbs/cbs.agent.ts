/**
 * CBS Agent
 *
 * Queries Israeli Central Bureau of Statistics — statistical series,
 * price indices, CPI calculations, and locality dictionary.
 */

import { Agent } from '@mastra/core/agent';
import {
    browseCbsCatalog,
    getCbsSeriesData,
    browseCbsPriceIndices,
    getCbsPriceData,
    calculateCbsPriceIndex,
    searchCbsLocalities,
} from '@/lib/tools';
import { getModelId } from '../model';
import { CBS_AGENT_CONFIG } from './config';

export const cbsAgent = new Agent({
    id: 'cbs-agent',
    name: CBS_AGENT_CONFIG.name,
    description:
        'Queries Israeli Central Bureau of Statistics (CBS) — statistical series, price indices, CPI calculations, and locality dictionary.',
    instructions: CBS_AGENT_CONFIG.instructions,
    model: getModelId(),
    tools: {
        browseCbsCatalog,
        getCbsSeriesData,
        browseCbsPriceIndices,
        getCbsPriceData,
        calculateCbsPriceIndex,
        searchCbsLocalities,
    },
});
