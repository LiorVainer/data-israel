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
import { buildRoutingInstructions, ROUTING_CONFIG } from './config';
import { AgentConfig } from '../agent.config';
import { AGENT_SCORERS } from '../evals/eval.config';
import { ContextCleanupProcessor } from '../processors/context-cleanup.processor';
import { ClientTools } from '@/lib/tools/client';
import { ENV } from '@/lib/env';
import { createCbsAgent } from '@/data-sources/cbs';
import { createDatagovAgent } from '@/data-sources/datagov';

/** Fast, cheap model for security classification processors */
const GUARD_MODEL = 'openrouter/google/gemini-2.5-flash-lite';

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

/** Factory: creates a routing agent with the given model and sub-agents */
export function createRoutingAgent(modelId: string, subAgents: Record<string, Agent>): Agent {
    // Build instructions listing only the actually-registered sub-agents
    const instructions = buildRoutingInstructions(Object.keys(subAgents));

    return new Agent({
        id: 'routingAgent',
        name: ROUTING_CONFIG.name,
        instructions,
        model: modelId,
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
        agents: subAgents,
        tools: {
            ...ClientTools,
        },
        scorers: AGENT_SCORERS,
        inputProcessors: [new ContextCleanupProcessor()],
        outputProcessors: [new ContextCleanupProcessor()],
    });
}

/** Static default sub-agents */
const cbsAgent = createCbsAgent(getMastraModelId('cbs'));
const datagovAgent = createDatagovAgent(getMastraModelId('datagov'));

/** Static default instance (backward compat) */
export const routingAgent = createRoutingAgent(getMastraModelId(), { datagovAgent, cbsAgent });
