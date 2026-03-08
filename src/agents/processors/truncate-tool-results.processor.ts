/**
 * TruncateToolResults Processor
 *
 * Strips large tool result payloads down to only the fields
 * needed by the UI (source URLs, success/error, metadata).
 * Runs as an output processor on sub-agents before results
 * are stored in memory.
 */

import type { Processor } from '@mastra/core/processors';
import type { MastraDBMessage } from '@mastra/core/agent/message-list';
import { pick } from 'es-toolkit';
import {
    TOOL_RESULT_KEEP_FIELDS,
    TOOL_RESULT_KEEP_NESTED,
    TOOL_ARGS_KEEP_FIELDS,
} from '@/constants/tool-result-fields';

/**
 * Strip a tool result to only UI-required fields.
 * Exported for reuse in enrichWithSubAgentData (safety net).
 */
export function stripToolResult(result: Record<string, unknown>): Record<string, unknown> {
    // Pick scalar fields (spread to get mutable array from as-const)
    const stripped: Record<string, unknown> = pick(result, [...TOOL_RESULT_KEEP_FIELDS]);

    // Pick nested object sub-fields (dataset.title, organization.name, etc.)
    for (const [key, allowedKeys] of Object.entries(TOOL_RESULT_KEEP_NESTED)) {
        const nested = result[key];
        if (typeof nested === 'object' && nested !== null) {
            stripped[key] = pick(nested as Record<string, unknown>, [...allowedKeys]);
        }
    }

    return stripped;
}

const ARGS_KEEP_SET = new Set<string>(TOOL_ARGS_KEEP_FIELDS);

/** Strip tool call args to only UI-required fields */
export function stripToolArgs(args: Record<string, unknown>): Record<string, unknown> {
    const stripped: Record<string, unknown> = {};
    for (const key of Object.keys(args)) {
        if (ARGS_KEEP_SET.has(key)) stripped[key] = args[key];
    }
    return stripped;
}

/**
 * Strip tool results AND args from a content.parts array (format v2 messages).
 * Handles tool-invocation parts and data-tool-agent parts.
 *
 * Each data-tool-agent part has a unique `id` (UUID) representing a separate delegation.
 * Multiple parts with the same `data.id` (agent name) but different part `id` are
 * distinct delegations and must ALL be preserved.
 */
function stripPartsToolData(parts: unknown[]): void {
    // Strip data from all parts
    for (const part of parts) {
        if (typeof part !== 'object' || part === null) continue;
        const p = part as Record<string, unknown>;

        // Handle tool-invocation parts (sub-agent tool calls)
        // Skip agent delegation results (tool-agent-*) — they're small and
        // contain subAgentThreadId needed by enrichWithSubAgentData on recall.
        if (p.type === 'tool-invocation') {
            const inv = p.toolInvocation as Record<string, unknown> | undefined;
            if (inv?.state === 'result' && inv.result != null && typeof inv.result === 'object') {
                const toolName = inv.toolName as string | undefined;
                if (!toolName?.startsWith('agent-')) {
                    inv.result = stripToolResult(inv.result as Record<string, unknown>);
                }
            }
        }

        // Handle data-tool-agent parts (routing agent stores sub-agent streaming data)
        if (p.type === 'data-tool-agent' || p.type === 'data') {
            const data = (p.data ?? p) as Record<string, unknown>;

            // Strip toolCalls args
            if (Array.isArray(data.toolCalls)) {
                for (const tc of data.toolCalls as Record<string, unknown>[]) {
                    if (tc.args != null && typeof tc.args === 'object') {
                        tc.args = stripToolArgs(tc.args as Record<string, unknown>);
                    }
                }
            }

            // Strip toolResults args + result
            if (Array.isArray(data.toolResults)) {
                for (const tr of data.toolResults as Record<string, unknown>[]) {
                    if (tr.result != null && typeof tr.result === 'object') {
                        tr.result = stripToolResult(tr.result as Record<string, unknown>);
                    }
                    if (tr.args != null && typeof tr.args === 'object') {
                        tr.args = stripToolArgs(tr.args as Record<string, unknown>);
                    }
                }
            }

            // Strip steps array (not needed for UI — only toolCalls/toolResults matter)
            if (Array.isArray(data.steps)) {
                data.steps = [];
            }
        }
    }
}

export class TruncateToolResultsProcessor implements Processor {
    readonly id = 'truncate-tool-results';

    async processOutputResult({
        messages,
    }: {
        messages: MastraDBMessage[];
        abort: (reason?: string) => never;
    }): Promise<MastraDBMessage[]> {
        for (const msg of messages) {
            if (msg.role !== 'assistant') continue;

            // Handle content.toolInvocations (legacy/compat field)
            const invocations = msg.content?.toolInvocations;
            if (Array.isArray(invocations)) {
                for (const inv of invocations) {
                    if (inv.state === 'result' && inv.result != null && typeof inv.result === 'object') {
                        const toolName = inv.toolName as string | undefined;
                        if (!toolName?.startsWith('agent-')) {
                            inv.result = stripToolResult(inv.result as Record<string, unknown>);
                        }
                    }
                }
            }

            // Handle content.parts (format v2 — tool-invocation and data-tool-agent parts)
            const parts = msg.content?.parts;
            if (Array.isArray(parts)) {
                stripPartsToolData(parts);
            }
        }
        return messages;
    }
}
