/**
 * Mastra Instance
 *
 * Central entry point registering all agents for the API route.
 * Uses ConvexStore as instance-level storage — all agents inherit it automatically.
 */

import { Mastra } from '@mastra/core';
import { ConvexStore } from '@mastra/convex';
import { routingAgent, cbsAgent, datagovAgent } from './network';
import { ENV } from '@/lib/env';

const convexUrl = ENV.NEXT_PUBLIC_CONVEX_URL;
const convexAdminKey = ENV.CONVEX_ADMIN_KEY;

const storage =
    convexUrl && convexAdminKey
        ? new ConvexStore({
              id: 'convex-storage',
              deploymentUrl: convexUrl,
              adminAuthToken: convexAdminKey,
          })
        : undefined;

export const agents = { routingAgent, cbsAgent, datagovAgent };

export const mastra = new Mastra({
    agents,
    ...(storage && { storage }),
});
