/**
 * Mastra Instance
 *
 * Central entry point registering all agents for the API route.
 */

import { Mastra } from '@mastra/core';
import { routingAgent, datagovAgent, cbsAgent, visualizationAgent } from './network';

export const mastra = new Mastra({
    agents: { routingAgent, datagovAgent, cbsAgent, visualizationAgent },
});
