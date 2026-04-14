/**
 * Chat Message Utilities
 *
 * Helpers for extracting and working with UIMessage content.
 */

import type { UIMessage } from 'ai';

/** Extracts the text content from a UIMessage (content string or first text part). */
export function extractUserText(message: UIMessage): string | undefined {
    const msg = message as UIMessage & { content?: string };
    if (typeof msg.content === 'string' && msg.content) return msg.content;
    return msg.parts?.find((p): p is { type: 'text'; text: string } => p.type === 'text')?.text;
}
