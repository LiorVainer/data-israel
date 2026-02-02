/**
 * DataGov Search Agent
 *
 * Searches and explores Israeli open datasets from data.gov.il
 */

import { Agent } from '@mastra/core/agent';
import { getAiSdkModelId, getMastraModelId } from '../model';
import { DATAGOV_AGENT_CONFIG } from './config';
import { Memory } from '@mastra/memory';
import { DataGovTools } from '@/lib/tools/datagov';
import { ToolResultSummarizerProcessor } from '../../processors/tool-result-summarizer.processor';
import { extractToolDescriptions } from '../../../lib/tools/tools.utils';

export const datagovAgent = new Agent({
    id: 'datagovAgent',
    name: DATAGOV_AGENT_CONFIG.name,
    description:
        'Searches and explores Israeli open datasets from data.gov.il — datasets, organizations, groups, tags, resources, and DataStore queries.',
    instructions: DATAGOV_AGENT_CONFIG.instructions,
    model: getMastraModelId(),
    tools: DataGovTools,
    outputProcessors: [
        new ToolResultSummarizerProcessor(
            getAiSdkModelId(),
            DATAGOV_AGENT_CONFIG.instructions,
            extractToolDescriptions(DataGovTools),
        ),
    ],
    memory: new Memory({
        options: {
            lastMessages: 20,
            generateTitle: true,
        },
    }),
});
