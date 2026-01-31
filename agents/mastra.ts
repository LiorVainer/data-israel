/**
 * Mastra Instance
 *
 * Central entry point registering all agents for the API route.
 */

import { Mastra } from '@mastra/core';
import { routingAgent } from './network';

export const agents = { routingAgent };

export const mastra = new Mastra({
    agents,
});
