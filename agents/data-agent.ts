/**
 * @deprecated Use agents from '@/agents/network' directly.
 * This file exists for backward compatibility.
 */

import type { UIMessage } from 'ai';

export { routingAgent as dataAgent } from './network';

/** Message type for UI components */
export type DataAgentUIMessage = UIMessage;
