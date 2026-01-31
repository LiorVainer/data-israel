/**
 * Mastra Instance
 *
 * Central entry point registering all agents for the API route.
 */

import { Mastra } from '@mastra/core';
import { cbsAgent, datagovAgent, routingAgent } from './network';

export const agents = { routingAgent, datagovAgent, cbsAgent };

export const mastra = new Mastra({
    agents,
});
