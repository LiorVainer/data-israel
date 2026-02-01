'use client';

import { ChainOfThoughtStep } from '@/components/ai-elements/chain-of-thought';
import { Badge } from '@/components/ui/badge';
import { DataIsraelLoader } from './DataIsraelLoader';
import type { LucideIcon } from 'lucide-react';
import type { StepStatus } from './types';

export interface GroupedToolCall {
    toolKey: string;
    name: string;
    icon: LucideIcon;
    count: number;
    failed: boolean;
    isActive: boolean;
}

export interface ToolCallStepProps {
    step: GroupedToolCall;
}

export function ToolCallStep({ step }: ToolCallStepProps) {
    const status: StepStatus = step.isActive ? 'active' : 'complete';

    return (
        <ChainOfThoughtStep
            icon={step.icon}
            label={
                <span className={step.failed ? 'text-red-500' : undefined}>
                    {step.name}
                    {step.count > 1 && (
                        <Badge variant='secondary' className='mr-2 px-1.5 py-0 text-xs font-normal'>
                            {step.count}
                        </Badge>
                    )}
                </span>
            }
            description={
                step.failed ? (
                    <span className='text-red-500'>שגיאה</span>
                ) : step.isActive ? (
                    <span className='inline-flex items-center gap-1.5'>
                        <DataIsraelLoader size={12} />
                        בפעולה...
                    </span>
                ) : (
                    'הושלם'
                )
            }
            status={status}
        />
    );
}
