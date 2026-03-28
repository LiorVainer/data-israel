'use client';

import type { ChatStatus } from 'ai';
import type { MouseEvent } from 'react';
import {
    PromptInput,
    PromptInputFooter,
    PromptInputSubmit,
    PromptInputTextarea,
} from '@/components/ai-elements/prompt-input';
import { DataSourcePicker } from '@/components/chat/DataSourcePicker';
import type { DataSourceId } from '@/data-sources/registry';

interface InputSectionProps {
    onSubmit?: (text: string) => void;
    status?: ChatStatus;
    onStop?: () => void;
    placeholder?: string;
    enabledSources: DataSourceId[];
    onToggleSource: (sourceId: DataSourceId) => void;
    onSelectAllSources: () => void;
    onUnselectAllSources: () => void;
}

export function InputSection({
    onSubmit,
    status,
    onStop,
    placeholder = 'מה תרצה לדעת?',
    enabledSources,
    onToggleSource,
    onSelectAllSources,
    onUnselectAllSources,
}: InputSectionProps) {
    const isBusy = status === 'streaming' || status === 'submitted';
    const isReady = status === 'ready' || status === undefined;

    const handleSubmit = (message: { text: string }) => {
        if (isBusy || !onSubmit) return;
        if (!message.text.trim()) return;
        onSubmit(message.text);
    };

    const handleStopClick = (e: MouseEvent) => {
        e.preventDefault();
        onStop?.();
    };

    return (
        <div>
            <PromptInput onSubmit={handleSubmit}>
                <PromptInputTextarea
                    className='h-fit min-h-0 p-0 ps-1 text-sm md:text-base'
                    placeholder={placeholder}
                />
                <PromptInputFooter className='px-0 pb-0'>
                    <DataSourcePicker
                        enabledSources={enabledSources}
                        onToggle={onToggleSource}
                        onSelectAll={onSelectAllSources}
                        onUnselectAll={onUnselectAllSources}
                    />
                    <PromptInputSubmit
                        className='self-end rounded-md bg-action text-white dark:text-black transition-all duration-300 ease-out hover:scale-105 hover:bg-action-dark active:scale-[1.02] active:translate-y-px'
                        status={status !== 'streaming' ? status : 'submitted'}
                        onClick={isBusy ? handleStopClick : undefined}
                        disabled={isBusy}
                    />
                </PromptInputFooter>
            </PromptInput>
        </div>
    );
}
