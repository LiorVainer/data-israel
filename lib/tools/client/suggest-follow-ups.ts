/**
 * Suggest Follow-Ups Tool (Client-Side)
 *
 * Displays context-aware follow-up suggestions to the user after each agent response.
 * The agent calls this tool with 2-4 Hebrew suggestions relevant to the conversation.
 */

import { tool } from 'ai';
import { z } from 'zod';

export const suggestFollowUpsInputSchema = z.object({
    suggestions: z
        .array(z.string())
        .min(2)
        .max(4)
        .describe('Follow-up suggestions in Hebrew for the user to continue the conversation'),
});

export const suggestFollowUpsOutputSchema = z.object({
    suggestions: z.array(z.string()),
});

export type SuggestFollowUpsInput = z.infer<typeof suggestFollowUpsInputSchema>;
export type SuggestFollowUpsOutput = z.infer<typeof suggestFollowUpsOutputSchema>;

export const suggestFollowUps = tool({
    description:
        'Display follow-up suggestions to the user. MUST be called at the end of every response with 2-4 relevant Hebrew suggestions.',
    inputSchema: suggestFollowUpsInputSchema,
    execute: async (input) => ({ suggestions: input.suggestions }),
});
