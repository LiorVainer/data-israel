import type { NetworkDataPart } from '@mastra/ai-sdk';
import { agents } from './mastra';

export type AgentsNetworkToolNames = `agent-${Extract<keyof typeof agents, string>}`;
export type AgentsNetworkData = NetworkDataPart['data'];

export type AgentName = keyof typeof agents;
