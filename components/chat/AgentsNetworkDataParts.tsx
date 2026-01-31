'use client';

import { useMemo, useState } from 'react';
import { ChainOfThought, ChainOfThoughtContent, ChainOfThoughtHeader } from '@/components/ai-elements/chain-of-thought';
import { Shimmer } from '@/components/ai-elements/shimmer';
import type { NetworkDataPart } from '@mastra/ai-sdk';
import { AgentNetworkDataStep, type GroupedStep } from './AgentNetworkDataStep';

const HIDDEN_STEP_NAMES = new Set(['routing-agent']);

function groupSteps(parts: ReadonlyArray<NetworkDataPart>): GroupedStep[] {
    const groupKey = (name: string, failed: boolean) => `${name}:${failed ? 'failed' : 'other'}` as const;

    return Array.from(
        parts
            .flatMap(({ data }) => data.steps)
            .filter((step) => !HIDDEN_STEP_NAMES.has(step.name))
            .reduce((groups, step) => {
                const failed = step.status === 'failed';
                const key = groupKey(step.name, failed);
                const existing = groups.get(key);

                groups.set(key, {
                    name: step.name,
                    failed,
                    count: (existing?.count ?? 0) + 1,
                    isActive: existing?.isActive || step.status === 'running',
                });

                return groups;
            }, new Map<string, GroupedStep>())
            .values(),
    );
}

export interface AgentsNetworkDataPartsProps {
    messageId: string;
    parts: Array<NetworkDataPart>;
    activeAgentLabel?: string;
}

/**
 * Component for rendering agent network steps in a ChainOfThought timeline.
 * Steps are grouped by agent name and status (failed vs non-failed).
 */
export function AgentsNetworkDataParts({ messageId, parts, activeAgentLabel }: AgentsNetworkDataPartsProps) {
    const [userWantsOpen, setUserWantsOpen] = useState(true);

    const hasActiveTools = parts.some(({ data }) => data.status === 'running');
    const groupedSteps = useMemo(() => groupSteps(parts), [parts]);
    const tokenUsage = useMemo(() => {
        return parts.reduce((total, { data }) => {
            return total + (data.usage?.totalTokens ?? 0);
        }, 0);
    }, [parts]);

    const handleOpenChange = (open: boolean) => {
        setUserWantsOpen(open);
    };

    return (
        <ChainOfThought open={userWantsOpen} onOpenChange={handleOpenChange}>
            <ChainOfThoughtHeader>
                {hasActiveTools ? (
                    <Shimmer as='span' duration={1.5}>
                        {activeAgentLabel ?? 'מבצע מחקר...'}
                    </Shimmer>
                ) : (
                    `${groupedSteps.length} פעולות הושלמו`
                )}
            </ChainOfThoughtHeader>
            <ChainOfThoughtContent>
                {groupedSteps.map((step) => (
                    <AgentNetworkDataStep
                        key={`${messageId}-${step.name}-${step.failed ? 'failed' : 'ok'}`}
                        step={step}
                        tokenUsage={tokenUsage}
                    />
                ))}
            </ChainOfThoughtContent>
        </ChainOfThought>
    );
}
