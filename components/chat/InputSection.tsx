'use client';

import type { ChatStatus } from 'ai';
import {
    PromptInput,
    PromptInputFooter,
    PromptInputSubmit,
    PromptInputTextarea,
} from '@/components/ai-elements/prompt-input';

interface InputSectionProps {
    onSubmit: (text: string) => void;
    status?: ChatStatus;
    onStop?: () => void;
    placeholder?: string;
}

export function InputSection({ onSubmit, status, onStop, placeholder = 'שאל על מאגרי מידע' }: InputSectionProps) {
    const handleSubmit = (message: { text: string }) => {
        if (!message.text.trim()) return;
        onSubmit(message.text);
    };

    return (
        <PromptInput onSubmit={handleSubmit}>
            <PromptInputTextarea placeholder={placeholder} />
            <PromptInputFooter className='justify-end'>
                <PromptInputSubmit status={status} onClick={status === 'streaming' ? onStop : undefined} />
            </PromptInputFooter>
        </PromptInput>
    );
}
