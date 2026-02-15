/**
 * CBS Agent
 *
 * Queries Israeli Central Bureau of Statistics — statistical series,
 * price indices, CPI calculations, and locality dictionary.
 */

import { Agent } from '@mastra/core/agent';
import { getAiSdkModelId, getMastraModelId } from '../model';
import { CBS_AGENT_CONFIG } from './config';
import { Memory } from '@mastra/memory';
import { AgentConfig } from '../../agent.config';
import { CbsTools } from '@/lib/tools/cbs';
import { ToolResultSummarizerProcessor } from '../../processors/tool-result-summarizer.processor';
import { extractToolDescriptions } from '../../../lib/tools/tools.utils';

const { MEMORY } = AgentConfig;

export const cbsAgent = new Agent({
    id: 'cbsAgent',
    name: CBS_AGENT_CONFIG.name,
    description:
        'Queries Israeli Central Bureau of Statistics (CBS) — statistical price indices, CPI calculations, and locality dictionary.',
    instructions: CBS_AGENT_CONFIG.instructions,
    model: getMastraModelId(),
    tools: CbsTools,
    outputProcessors: [
        new ToolResultSummarizerProcessor(
            getAiSdkModelId(),
            CBS_AGENT_CONFIG.instructions,
            extractToolDescriptions(CbsTools),
        ),
    ],
    memory: new Memory({
        options: {
            lastMessages: MEMORY.LAST_MESSAGES,
            generateTitle: MEMORY.GENERATE_TITLE,
        },
    }),
});
