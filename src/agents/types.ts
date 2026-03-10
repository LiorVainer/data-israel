import type { UIMessage } from 'ai';
import type { Tool } from '@mastra/core/tools';
import { agents } from './mastra';
import type { ClientTools } from '@/lib/tools/client';
import type { DataGovTools } from '@/lib/tools/datagov';
import type { CbsTools } from '@/lib/tools/cbs';

export type AgentName = keyof typeof agents;

/** Combined tools object type matching the routing agent's tools config */
type AllTools = typeof ClientTools & typeof DataGovTools & typeof CbsTools;

/** Extract input type from a Mastra Tool */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type InferMastraToolInput<T> = T extends Tool<infer TIn, any, any, any, any, any, any> ? TIn : never;

/** Extract output type from a Mastra Tool */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type InferMastraToolOutput<T> = T extends Tool<any, infer TOut, any, any, any, any, any> ? TOut : never;

/** Inferred UI tool types - each tool's input/output is fully typed */
export type AppUITools = {
    [K in keyof AllTools & string]: {
        input: InferMastraToolInput<AllTools[K]>;
        output: InferMastraToolOutput<AllTools[K]>;
    };
};

/**
 * Type-safe UIMessage for the entire app.
 * Pass to useChat<AppUIMessage>() for typed message.parts.
 *
 * With this type:
 * - part.type === 'tool-suggestFollowUps' narrows to typed part.input.suggestions
 * - part.type === 'tool-generateDataGovSourceUrl' narrows to typed part.output
 * - No more `as ToolCallPart` casts needed
 */
export type AppUIMessage = UIMessage<never, never, AppUITools>;
