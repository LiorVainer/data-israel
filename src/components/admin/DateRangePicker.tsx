'use client';

import { useState } from 'react';
import { CalendarIcon, X } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

export type { DateRange };

function formatDateRange(range: DateRange): string {
    const { from, to } = range;
    if (!from) return 'טווח מותאם';
    const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    const fromStr = from.toLocaleDateString('he-IL', opts);
    if (!to) return fromStr;
    const toStr = to.toLocaleDateString('he-IL', opts);
    return `${fromStr} – ${toStr}`;
}

interface DateRangePickerProps {
    value: DateRange | undefined;
    onChange: (range: DateRange | undefined) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
    const [open, setOpen] = useState(false);

    const hasValue = !!value?.from;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={hasValue ? 'default' : 'outline'}
                    size='sm'
                    className='flex h-auto items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors'
                >
                    <CalendarIcon className='size-3.5 shrink-0' />
                    <span>{hasValue ? formatDateRange(value!) : 'טווח מותאם'}</span>
                    {hasValue && (
                        <span
                            role='button'
                            aria-label='נקה טווח'
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(undefined);
                            }}
                            className='rounded-full p-0.5 hover:bg-primary-foreground/20'
                        >
                            <X className='size-3' />
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start' dir='rtl'>
                <Calendar
                    mode='range'
                    selected={value}
                    onSelect={(range) => {
                        onChange(range);
                        if (range?.from && range?.to) setOpen(false);
                    }}
                    numberOfMonths={2}
                    disabled={{ after: new Date() }}
                />
            </PopoverContent>
        </Popover>
    );
}
