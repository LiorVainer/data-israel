'use client';

import type { ChatStatus } from 'ai';
import type { MouseEvent } from 'react';
import { PromptInput, PromptInputSubmit, PromptInputTextarea } from '@/components/ai-elements/prompt-input';

interface InputSectionProps {
    onSubmit?: (text: string) => void;
    status?: ChatStatus;
    onStop?: () => void;
    placeholder?: string;
}

export function InputSection({ onSubmit, status, onStop, placeholder = 'מה תרצה לדעת?' }: InputSectionProps) {
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
        <PromptInput onSubmit={handleSubmit} className='bg-background flex'>
            <PromptInputTextarea
                className='h-fit min-h-0 p-0 ps-1 md:ps-2 text-sm md:text-base'
                placeholder={placeholder}
                disabled={isBusy}
            />
            <PromptInputSubmit
                className='self-end rounded-2xl bg-action'
                status={status !== 'streaming' ? status : 'submitted'}
                onClick={isBusy ? handleStopClick : undefined}
                disabled={!isReady && isBusy}
            />
        </PromptInput>
    );
}
