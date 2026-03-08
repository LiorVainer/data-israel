'use client';

import type { ChatStatus } from 'ai';
import type { MouseEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { PromptInput, PromptInputSubmit, PromptInputTextarea } from '@/components/ai-elements/prompt-input';

interface InputSectionProps {
    onSubmit?: (text: string) => void;
    status?: ChatStatus;
    onStop?: () => void;
    placeholder?: string;
}

/** Height threshold (px) above which the input switches from pill to rounded rect. */
const MULTILINE_THRESHOLD = 56;

export function InputSection({ onSubmit, status, onStop, placeholder = 'מה תרצה לדעת?' }: InputSectionProps) {
    const isBusy = status === 'streaming' || status === 'submitted';
    const isReady = status === 'ready' || status === undefined;
    const containerRef = useRef<HTMLDivElement>(null);
    const [isMultiline, setIsMultiline] = useState(false);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const observer = new ResizeObserver(([entry]) => {
            if (!entry) return;
            setIsMultiline(entry.contentRect.height > MULTILINE_THRESHOLD);
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const handleSubmit = (message: { text: string }) => {
        if (isBusy || !onSubmit) return;
        if (!message.text.trim()) return;
        onSubmit(message.text);
    };

    const handleStopClick = (e: MouseEvent) => {
        e.preventDefault();
        onStop?.();
    };

    const multilineOverride = '[&_form]:rounded-2xl [&_[data-slot=input-group]]:rounded-2xl';

    return (
        <div ref={containerRef} className={isMultiline ? multilineOverride : ''}>
            <PromptInput onSubmit={handleSubmit} className='bg-background flex rounded-full'>
                <PromptInputTextarea
                    className='h-fit min-h-0 p-0 ps-2 md:ps-3 text-sm md:text-base'
                    placeholder={placeholder}
                    disabled={isBusy}
                />
                <PromptInputSubmit
                    className='self-end rounded-full bg-action text-white dark:text-black transition-all duration-300 ease-out hover:scale-105 hover:bg-action-dark active:scale-[1.02] active:translate-y-px'
                    status={status !== 'streaming' ? status : 'submitted'}
                    onClick={isBusy ? handleStopClick : undefined}
                    disabled={!isReady && isBusy}
                />
            </PromptInput>
        </div>
    );
}
