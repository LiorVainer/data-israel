/**
 * Mastra Instance
 *
 * Central entry point registering all agents for the API route.
 */

import { Mastra } from '@mastra/core';
import { cbsAgent, datagovAgent, routingAgent, visualizationAgent } from './network';
import { VercelDeployer } from '@mastra/deployer-vercel';

export const mastra = new Mastra({
    deployer: new VercelDeployer(),
    agents: { routingAgent, datagovAgent, cbsAgent, visualizationAgent },
});
