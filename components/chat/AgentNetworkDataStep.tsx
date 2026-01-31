'use client';

import { ActivityIcon, BarChart2Icon, DatabaseIcon, type LucideIcon, PieChartIcon } from 'lucide-react';
import { ChainOfThoughtStep } from '@/components/ai-elements/chain-of-thought';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { Badge } from '@/components/ui/badge';
import type { AgentName } from '@/agents/types';
import { isProduction } from '@/lib/env.utis';

const AgentsDisplayMap: Record<AgentName, { label: string; icon: LucideIcon }> = {
    datagovAgent: { label: 'בודק במאגרי המידע הממשלתי', icon: DatabaseIcon },
    cbsAgent: { label: 'בודק בנתוני הלשכה המרכזית לסטטיסטיקה', icon: BarChart2Icon },
    visualizationAgent: { label: 'יוצר תרשים', icon: PieChartIcon },
    routingAgent: { label: 'סוכן הניתוב', icon: ActivityIcon },
};

export interface GroupedStep {
    name: string;
    failed: boolean;
    count: number;
    isActive: boolean;
}

export interface AgentNetworkDataStepProps {
    step: GroupedStep;
    tokenUsage: number;
}

export function AgentNetworkDataStep({ step, tokenUsage }: AgentNetworkDataStepProps) {
    const { label, icon } = AgentsDisplayMap[step.name as AgentName] ?? {
        label: step.name,
        icon: ActivityIcon,
    };

    return (
        <ChainOfThoughtStep
            icon={icon}
            label={
                <span className={step.failed ? 'text-red-500' : undefined}>
                    {label}
                    {step.count > 1 && (
                        <Badge variant='secondary' className='mr-2 px-1.5 py-0 text-xs font-normal'>
                            {step.count}
                        </Badge>
                    )}
                    {!isProduction && (
                        <Badge variant='secondary' className='mr-2 px-1.5 py-0 text-xs font-normal'>
                            {tokenUsage} טוקנים
                        </Badge>
                    )}
                </span>
            }
            description={
                step.failed ? (
                    <span className='text-red-500'>שגיאה</span>
                ) : step.isActive ? (
                    <Shimmer as='span' duration={1.5}>
                        בפעולה...
                    </Shimmer>
                ) : (
                    'הושלם'
                )
            }
            status={step.isActive ? 'active' : 'complete'}
        />
    );
}
