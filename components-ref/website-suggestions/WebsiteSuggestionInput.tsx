'use client';

import { cn } from '@/lib/utils';
import { FC, useLayoutEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Send, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface WebsiteSuggestionInputProps {
    value: string;
    setValue: (value: string) => void;
    onSubmit?: (amount: number) => void;
    clearSuggestions: () => void;
    placeholder?: string;
    className?: string;
}

type InputState = 'idle' | 'focused' | 'loading' | 'submitted';

const DEFAULT_SUGGESTIONS = 5;
const ACTION_BAR_W = 96; // reserved space for actions
const ACTION_BTN = 36; // 9 (w-9/h-9) * 4px = 36px
const PADDING_Y = 16; // p-2 top+bottom (8+8)
const MIN_CONTENT_H = ACTION_BTN; // ensure content area >= buttons
const MAX_CONTENT_H = 220;

export const WebsiteSuggestionInput: FC<WebsiteSuggestionInputProps> = ({
    onSubmit,
    placeholder = 'Best tools for productivity...',
    className,
    value,
    setValue,
    clearSuggestions,
}) => {
    const [state, setState] = useState<InputState>('idle');

    // measure content with hidden sizer
    const sizerRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const [height, setHeight] = useState(MIN_CONTENT_H + PADDING_Y);

    useLayoutEffect(() => {
        const s = sizerRef.current;
        if (!s) return;
        const contentH = Math.max(MIN_CONTENT_H, Math.min(s.offsetHeight, MAX_CONTENT_H));
        setHeight(contentH + PADDING_Y); // animate the form height including vertical padding
    }, [value]);

    const handleSubmit = async (e: React.FormEvent | React.KeyboardEvent) => {
        e.preventDefault();
        if (!value.trim() || state === 'loading') return;
        setState('loading');
        try {
            await onSubmit?.(DEFAULT_SUGGESTIONS);
            setState('submitted');
            setTimeout(() => setState('idle'), 1000);
        } catch {
            setState('idle');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleFocus = () => state === 'idle' && setState('focused');
    const handleBlur = () => state === 'focused' && setState('idle');

    const isDisabled = state === 'loading';
    const canSubmit = value.trim().length > 0 && !isDisabled;

    return (
        <motion.form
            ref={formRef}
            onSubmit={handleSubmit}
            initial={false}
            animate={{ height }}
            transition={{ type: 'tween', duration: 0.22, ease: [0.25, 0.8, 0.3, 1] }}
            className={cn(
                'relative isolate flex gap-4 items-center box-border',
                'bg-background/70 border border-foreground/10',
                'dark:bg-background/30 dark:border-background/40 dark:bg-none',
                'transition-colors duration-300 flex-1 p-2 border rounded-lg overflow-hidden',
                state === 'loading' && 'bg-gray-50 dark:bg-background/50',
                className,
            )}
        >
            {/* Textarea block (reserve space for actions on the right) */}
            <div className='min-w-0 w-full h-full overflow-auto flex items-center md:pl-2'>
                <Textarea
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    disabled={isDisabled}
                    rows={1}
                    className={cn(
                        '!min-h-0 max-h-full resize-none',
                        'w-full border-0 shadow-none p-0 md:text-md rounded-none',
                        'leading-[1.25rem]',
                    )}
                    style={{ overflow: 'hidden' }}
                />
            </div>

            {/* Hidden sizer for measuring content height */}
            <div
                ref={sizerRef}
                aria-hidden
                className='pointer-events-none absolute left-0 top-0 invisible whitespace-pre-wrap break-words'
                style={{
                    width: `calc(100% - ${ACTION_BAR_W}px - 16px)`, // subtract actions + horizontal padding (p-2)
                    fontSize: '14px',
                    lineHeight: '1.25rem',
                }}
            >
                {value || ' '}
            </div>

            {/* Action bar (inside the form; no portal lag) */}
            <div className='flex gap-2 h-9 items-center self-end justify-end'>
                <Button
                    type='button'
                    size='icon'
                    variant='outline'
                    onClick={() => {
                        clearSuggestions();
                        setValue('');
                    }}
                    className={cn(
                        'w-9 h-9 transform-gpu transition-opacity duration-150',
                        value ? 'opacity-100' : 'opacity-0',
                    )}
                >
                    <X className='w-4 h-4' />
                </Button>

                <Button
                    type='submit'
                    size='icon'
                    variant='gradient'
                    disabled={!canSubmit}
                    className={cn(
                        'w-9 h-9 transform-gpu hover:scale-105 active:scale-95',
                        !canSubmit && 'opacity-50 cursor-not-allowed hover:scale-100',
                    )}
                >
                    <AnimatePresence mode='wait' initial={false}>
                        {state === 'loading' ? (
                            <motion.div
                                key='loading'
                                initial={{ opacity: 0, rotate: -180 }}
                                animate={{ opacity: 1, rotate: 0 }}
                                exit={{ opacity: 0, rotate: 180 }}
                                transition={{ duration: 0.25 }}
                            >
                                <Loader2 className='h-4 w-4 animate-spin' />
                            </motion.div>
                        ) : (
                            <motion.div
                                key='send'
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 8 }}
                                transition={{ duration: 0.25 }}
                            >
                                <Send className='h-4 w-4' />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Button>
            </div>
        </motion.form>
    );
};
