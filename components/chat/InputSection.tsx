'use client';

import type { ChatStatus } from 'ai';
import {
    PromptInput,
    PromptInputFooter,
    PromptInputSubmit,
    PromptInputTextarea,
} from '@/components/ai-elements/prompt-input';

interface InputSectionProps {
    onSubmit?: (text: string) => void;
    status?: ChatStatus;
    onStop?: () => void;
    placeholder?: string;
    disabled?: boolean;
}

export function InputSection({
    onSubmit,
    status,
    onStop,
    placeholder = 'שאל על מאגרי מידע',
    disabled = false,
}: InputSectionProps) {
    const handleSubmit = (message: { text: string }) => {
        if (disabled || !onSubmit) return;
        if (!message.text.trim()) return;
        onSubmit(message.text);
    };

    return (
        <div className={disabled ? 'opacity-50 pointer-events-none' : undefined}>
            <PromptInput onSubmit={handleSubmit} className='bg-background'>
                <PromptInputTextarea placeholder={placeholder} disabled={disabled} />
                <PromptInputFooter className='justify-end'>
                    <PromptInputSubmit
                        status={status}
                        onClick={status === 'streaming' ? onStop : undefined}
                        disabled={disabled}
                    />
                </PromptInputFooter>
            </PromptInput>
        </div>
    );
}
