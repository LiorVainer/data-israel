/**
 * Routing Agent (Orchestrator)
 *
 * Routes user queries to specialized sub-agents based on intent.
 * Memory is required for Mastra agent network execution.
 */

import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { ConvexVector } from '@mastra/convex';
import { openrouter } from '@openrouter/ai-sdk-provider';
import { getMastraModelId } from '../model';
import { ROUTING_CONFIG } from './config';
import { AgentConfig } from '../../agent.config';
import { ClientTools } from '@/lib/tools/client';
import { cbsAgent } from '../cbs';
import { datagovAgent } from '../datagov';
import { ENV } from '@/lib/env';

const { MEMORY } = AgentConfig;

const convexUrl = ENV.NEXT_PUBLIC_CONVEX_URL;
const convexAdminKey = ENV.CONVEX_ADMIN_KEY;

const vector =
    convexUrl && convexAdminKey
        ? new ConvexVector({
              id: 'convex-vector',
              deploymentUrl: convexUrl,
              adminAuthToken: convexAdminKey,
          })
        : undefined;

export const routingAgent = new Agent({
    id: 'routingAgent',
    name: ROUTING_CONFIG.name,
    instructions: ROUTING_CONFIG.instructions,
    model: getMastraModelId(),
    memory: new Memory({
        ...(vector && { vector }),
        embedder: openrouter.textEmbeddingModel(MEMORY.EMBEDDER_MODEL),
        options: {
            lastMessages: MEMORY.LAST_MESSAGES,
            semanticRecall: vector
                ? {
                      topK: MEMORY.SEMANTIC_RECALL.TOP_K,
                      messageRange: MEMORY.SEMANTIC_RECALL.MESSAGE_RANGE,
                      scope: 'resource',
                  }
                : false,
            generateTitle: MEMORY.GENERATE_TITLE,
        },
    }),
    agents: { datagovAgent, cbsAgent },
    tools: {
        ...ClientTools,
    },
});
