'use client';

import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { CheckCircle2Icon, Loader2Icon, SearchIcon, XCircleIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAllTranslations } from '@/data-sources/registry';

type ToolState =
    | 'input-streaming'
    | 'input-available'
    | 'output-available'
    | 'output-error'
    | 'approval-requested'
    | 'approval-responded'
    | 'output-denied';

export interface ToolCallCardProps {
    part: {
        type: string;
        state: ToolState;
        input?: unknown;
        output?: unknown;
        errorText?: string;
    };
}

function getStateIcon(state: ToolCallCardProps['part']['state']) {
    switch (state) {
        case 'input-streaming':
        case 'input-available':
        case 'approval-requested':
            return <Loader2Icon className='h-4 w-4 animate-spin text-blue-500' />;
        case 'output-available':
        case 'approval-responded':
            return <CheckCircle2Icon className='h-4 w-4 text-success' />;
        case 'output-error':
        case 'output-denied':
            return <XCircleIcon className='h-4 w-4 text-error' />;
        default:
            return null;
    }
}

function getStateLabel(state: ToolCallCardProps['part']['state']): string {
    switch (state) {
        case 'input-streaming':
        case 'input-available':
            return 'מעבד...';
        case 'approval-requested':
            return 'ממתין לאישור';
        case 'output-available':
        case 'approval-responded':
            return 'הושלם';
        case 'output-error':
            return 'שגיאה';
        case 'output-denied':
            return 'נדחה';
        default:
            return '';
    }
}

/** Lazy-initialized translations cache */
let _translations: ReturnType<typeof getAllTranslations> | null = null;

function getTranslations() {
    if (!_translations) {
        _translations = getAllTranslations();
    }
    return _translations;
}

/**
 * Format input description
 */
function formatInputDescription(toolKey: string, input: unknown): string | null {
    const translations = getTranslations();
    const meta = translations[toolKey];
    if (!meta || input === undefined) return null;
    return meta.formatInput(input) ?? null;
}

/**
 * Format output description
 */
function formatOutputDescription(toolKey: string, output: unknown): string | undefined {
    const translations = getTranslations();
    const meta = translations[toolKey];
    if (!meta || output === undefined) return undefined;
    return meta.formatOutput(output) ?? undefined;
}

export function ToolCallCard({ part }: ToolCallCardProps) {
    const toolKey = part.type.replace('tool-', '');
    const translations = getTranslations();
    const toolMeta = translations[toolKey];

    const toolName = toolMeta?.name || toolKey;
    const IconComponent = toolMeta?.icon || SearchIcon;

    const hasInput = part.input !== undefined;
    const hasOutput = part.state === 'output-available' && part.output !== undefined;
    const hasError = part.state === 'output-error' && part.errorText;

    // Format human-readable descriptions using type-safe helpers
    const inputDescription = hasInput ? formatInputDescription(toolKey, part.input) : null;
    const outputDescription = hasOutput ? formatOutputDescription(toolKey, part.output) : null;

    const isLoading = part.state === 'input-streaming' || part.state === 'input-available';

    return (
        <Card className={cn('my-2 py-3 transition-all duration-200', hasError && 'border-red-200 dark:border-red-800')}>
            <CardContent className='px-3 pb-0 space-y-1'>
                <div className='flex items-center justify-between w-full'>
                    <div className='flex items-center gap-2'>
                        {getStateIcon(part.state)}
                        <span className='text-muted-foreground'>
                            <IconComponent className='h-4 w-4' />
                        </span>
                        <CardTitle className='text-sm font-medium'>{toolName}</CardTitle>
                        <span className='text-xs text-muted-foreground'>{getStateLabel(part.state)}</span>
                    </div>
                </div>
                {/* Input description */}
                {inputDescription && <div className='text-sm text-muted-foreground'>{inputDescription}</div>}

                {/* Output description */}
                {outputDescription && (
                    <div className='text-sm text-success font-medium'>{outputDescription}</div>
                )}

                {/* Loading state */}
                {isLoading && !inputDescription && <div className='text-sm text-muted-foreground'>מעבד...</div>}

                {/* Error message */}
                {hasError && <div className='text-sm text-error'>{part.errorText}</div>}
            </CardContent>
        </Card>
    );
}
