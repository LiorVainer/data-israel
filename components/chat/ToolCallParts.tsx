'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChainOfThought, ChainOfThoughtContent, ChainOfThoughtHeader } from '@/components/ai-elements/chain-of-thought';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { useAutoOpen } from './use-auto-open';
import type { UIMessage } from 'ai';
import type { ToolCallPart } from './types';
import { getToolStatus, isAgentDataPart } from './types';
import { getToolInfo } from './MessageToolCalls';
import { type GroupedToolCall, ToolCallStep, type ToolResource } from './ToolCallStep';

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function getString(obj: unknown, key: string): string | undefined {
    if (!isRecord(obj)) return undefined;
    const val = obj[key];
    return typeof val === 'string' && val.length > 0 ? val : undefined;
}

/**
 * Extracts a ToolResource from a tool call's input and output.
 *
 * Resolves a display name from (in priority order):
 *   1. output.searchedResourceName
 *   2. input.searchedResourceName
 *   3. input.query / input.q  (search tools)
 *   4. input.path             (catalog-by-path tools)
 *   5. output nested titles   (dataset.title, organization.title)
 */
function extractToolResource(input: unknown, output: unknown): ToolResource | null {
    const apiUrl = getString(output, 'apiUrl');

    const name =
        getString(output, 'searchedResourceName') ??
        getString(input, 'searchedResourceName') ??
        getString(input, 'query') ??
        getString(input, 'q') ??
        getString(input, 'path') ??
        getString(isRecord(output) ? output.dataset : undefined, 'title') ??
        getString(isRecord(output) ? output.organization : undefined, 'title');

    if (!apiUrl && !name) return null;

    return { url: apiUrl ?? '', name };
}

/**
 * Internal tool call made by a sub-agent (extracted from data-tool-agent parts).
 */
export interface AgentInternalToolCall {
    toolName: string;
    toolCallId: string;
    searchedResourceName?: string;
    success?: boolean;
    error?: string;
    /** Whether this tool call has completed (has a matching toolResult) */
    isComplete: boolean;
}

/**
 * Scans all message parts for `data-tool-agent` parts and builds a map
 * from agent name to its internal tool calls.
 *
 * `data-tool-agent` parts are emitted by Mastra's handleChatStream with agents.
 * They contain the sub-agent's toolCalls/toolResults/steps data.
 * Multiple parts may exist for the same agent (streaming updates) —
 * we keep the one with the most toolResults (the final "finished" one).
 */
function buildAgentInternalCallsMap(allParts: UIMessage['parts']): Map<string, AgentInternalToolCall[]> {
    const map = new Map<string, AgentInternalToolCall[]>();

    for (const part of allParts) {
        if (!isAgentDataPart(part)) continue;

        const { data } = part;
        const agentName = data.id;
        if (!agentName) continue;

        // Build set of completed tool call IDs for isComplete derivation
        const completedIds = new Set(data.toolResults.map((tr) => tr.toolCallId));

        const calls: AgentInternalToolCall[] = data.toolCalls.map((tc) => {
            // Find the matching result for this tool call
            const matchingResult = data.toolResults.find((tr) => tr.toolCallId === tc.toolCallId);
            const result = matchingResult?.result;

            return {
                toolName: tc.toolName,
                toolCallId: tc.toolCallId,
                searchedResourceName:
                    getString(result, 'searchedResourceName') ?? getString(tc.args, 'searchedResourceName'),
                success: typeof result?.success === 'boolean' ? result.success : undefined,
                error: getString(result, 'error'),
                isComplete: completedIds.has(tc.toolCallId),
            };
        });

        // Keep the part with the most tool calls (final "finished" state has all data)
        const existing = map.get(agentName);
        if (!existing || calls.length > existing.length) {
            map.set(agentName, calls);
        }
    }

    return map;
}

/**
 * Check if a tool call has an error — either AI SDK-level (state === 'output-error')
 * or business-level (output.success === false, e.g. API timeout).
 */
function isToolError(part: ToolCallPart): boolean {
    if (part.state === 'output-error') return true;
    if (part.state === 'output-available' && part.output != null) {
        const output = part.output as Record<string, unknown>;
        return output.success === false;
    }
    return false;
}

interface ToolCallStats {
    total: number;
    completed: number;
    failed: number;
    active: number;
}

/**
 * Calculate overall statistics from tool parts
 */
function calculateStats(toolParts: ReadonlyArray<{ part: ToolCallPart; index: number }>): ToolCallStats {
    return toolParts.reduce(
        (stats, { part }) => {
            const status = getToolStatus(part.state);
            const failed = isToolError(part);
            return {
                total: stats.total + 1,
                completed: stats.completed + (status === 'complete' && !failed ? 1 : 0),
                failed: stats.failed + (failed ? 1 : 0),
                active: stats.active + (status === 'active' ? 1 : 0),
            };
        },
        { total: 0, completed: 0, failed: 0, active: 0 },
    );
}

/**
 * Groups tool calls by tool name, tracking completed/failed/active counts.
 * For agent-* tools, looks up internal tool calls from the agentCallsMap
 * (built from data-tool-agent parts).
 */
function groupToolCalls(
    toolParts: ReadonlyArray<{ part: ToolCallPart; index: number }>,
    agentCallsMap: Map<string, AgentInternalToolCall[]>,
): GroupedToolCall[] {
    const groups = new Map<string, GroupedToolCall>();

    for (const { part } of toolParts) {
        const toolKey = part.type.replace('tool-', '');
        const status = getToolStatus(part.state);
        const isFailed = isToolError(part);
        const isActive = status === 'active';
        const isCompleted = status === 'complete' && !isFailed;

        // Extract resource from tool input + output
        const resource = extractToolResource(part.input, part.output);

        // Look up internal tool calls for sub-agent tools from data-tool-agent parts
        const agentName = toolKey.startsWith('agent-') ? toolKey.replace('agent-', '') : undefined;
        const internalCalls = agentName ? agentCallsMap.get(agentName) : undefined;

        const existing = groups.get(toolKey);

        if (existing) {
            existing.count += 1;
            existing.completedCount += isCompleted ? 1 : 0;
            existing.failedCount += isFailed ? 1 : 0;
            existing.isActive = existing.isActive || isActive;
            // Add resource if present and not already in the list (dedupe by name or URL)
            if (
                resource &&
                !existing.resources.some(
                    (r) => (r.url && r.url === resource.url) || (r.name && r.name === resource.name),
                )
            ) {
                existing.resources.push(resource);
            }
            // Merge internal calls (shouldn't normally happen - agents are called once)
            if (internalCalls?.length && !existing.internalCalls?.length) {
                existing.internalCalls = internalCalls;
            }
        } else {
            const { name, icon } = getToolInfo(toolKey);
            groups.set(toolKey, {
                toolKey,
                name,
                icon,
                count: 1,
                completedCount: isCompleted ? 1 : 0,
                failedCount: isFailed ? 1 : 0,
                isActive,
                resources: resource ? [resource] : [],
                internalCalls: internalCalls?.length ? internalCalls : undefined,
            });
        }
    }

    return Array.from(groups.values());
}

export interface ToolCallPartsProps {
    messageId: string;
    toolParts: Array<{ part: ToolCallPart; index: number }>;
    /** Full message parts array — used to find data-tool-agent companion parts for sub-agents */
    allParts: UIMessage['parts'];
    isProcessing: boolean;
    /** Whether this group should default to open (e.g. last meaningful segment in message) */
    defaultOpen?: boolean;
}

/**
 * Container component for rendering tool calls in a ChainOfThought timeline.
 * Tool calls are grouped by tool name with progress tracking.
 */
export function ToolCallParts({
    messageId,
    toolParts,
    allParts,
    isProcessing,
    defaultOpen = false,
}: ToolCallPartsProps) {
    const { isOpen, handleOpenChange } = useAutoOpen(isProcessing || defaultOpen);

    const processingLabels = useMemo(() => ['מחפש מידע...', 'מעבד נתונים...', 'מנתח תוצאות...'], []);
    const [labelIndex, setLabelIndex] = useState(0);

    useEffect(() => {
        if (!isProcessing) return;
        const interval = setInterval(() => {
            setLabelIndex((prev) => (prev + 1) % processingLabels.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [isProcessing, processingLabels]);

    const agentCallsMap = useMemo(() => buildAgentInternalCallsMap(allParts), [allParts]);

    const stats = useMemo(() => calculateStats(toolParts), [toolParts]);
    const groupedTools = useMemo(() => groupToolCalls(toolParts, agentCallsMap), [toolParts, agentCallsMap]);

    // Build header text - show only succeeded count
    const getHeaderContent = () => {
        // Still processing
        if (isProcessing && stats.active > 0) {
            return (
                <Shimmer as='span' duration={1.5}>
                    {processingLabels[labelIndex]}
                </Shimmer>
            );
        }

        // All done - show only succeeded count
        if (stats.failed > 0) {
            return (
                <span>
                    {stats.completed} פעולות הושלמו
                    <span className='text-error mr-1'> ({stats.failed} שגיאות)</span>
                </span>
            );
        }

        return `${stats.completed} פעולות הושלמו`;
    };

    return (
        <ChainOfThought open={isOpen} onOpenChange={handleOpenChange}>
            <ChainOfThoughtHeader>{getHeaderContent()}</ChainOfThoughtHeader>
            <ChainOfThoughtContent>
                {groupedTools.map((step) => (
                    <ToolCallStep key={`${messageId}-${step.toolKey}`} step={step} />
                ))}
            </ChainOfThoughtContent>
        </ChainOfThought>
    );
}
