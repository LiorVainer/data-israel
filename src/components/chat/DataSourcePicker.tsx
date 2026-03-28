'use client';

import { useState } from 'react';
import { CheckIcon, DatabaseIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import type { DataSourceId } from '@/data-sources/registry';
import { getDataSourcePickerItems } from '@/data-sources/registry';
import type { DataSourceCategory } from '@/data-sources/types';
import { DATA_SOURCES_CATEGORIES } from '@/data-sources/types';

// ---------------------------------------------------------------------------
// Compute picker items and group by category at module level
// ---------------------------------------------------------------------------

const pickerItems = getDataSourcePickerItems();

const groupedByCategory = Object.entries(DATA_SOURCES_CATEGORIES)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([key, meta]) => ({
        category: key as DataSourceCategory,
        label: meta.label,
        items: pickerItems.filter((item) => item.category === key).sort((a, b) => a.categoryOrder - b.categoryOrder),
    }))
    .filter((group) => group.items.length > 0);

const totalSources = pickerItems.length;

// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Shared picker content (used in both Dialog and Drawer)
// ---------------------------------------------------------------------------

interface PickerContentProps {
    enabledSources: DataSourceId[];
    allSelected: boolean;
    noneSelected: boolean;
    onToggle: (sourceId: DataSourceId) => void;
    onSelectAll: () => void;
    onUnselectAll: () => void;
}

function PickerContent({
    enabledSources,
    allSelected,
    noneSelected,
    onToggle,
    onSelectAll,
    onUnselectAll,
}: PickerContentProps) {
    return (
        <Command dir='rtl' className='**:data-[slot=command-input-wrapper]:h-auto bg-background'>
            <CommandInput placeholder='חיפוש מקור מידע...' className='h-auto py-3' />
            <div className='flex items-center gap-1 border-b px-2 py-1.5'>
                <button
                    type='button'
                    onClick={onSelectAll}
                    disabled={allSelected}
                    className='text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors'
                >
                    בחר הכל
                </button>
                <span className='text-muted-foreground/40'>|</span>
                <button
                    type='button'
                    onClick={onUnselectAll}
                    disabled={noneSelected}
                    className='text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors'
                >
                    נקה הכל
                </button>
            </div>
            <CommandList>
                <CommandEmpty>לא נמצא מקור מידע</CommandEmpty>
                {groupedByCategory.map((group) => (
                    <CommandGroup key={group.category} heading={group.label}>
                        {group.items.map((item) => {
                            const isEnabled = allSelected || enabledSources.includes(item.id);
                            return (
                                <CommandItem
                                    key={item.id}
                                    value={item.label}
                                    onSelect={() => onToggle(item.id)}
                                    className='cursor-pointer'
                                >
                                    <span className='text-[10px] text-muted-foreground/60 w-32 truncate dir-ltr text-left shrink-0'>
                                        {item.urlLabel}
                                    </span>
                                    <span className='flex flex-1 items-center gap-1.5'>
                                        <item.icon className='size-3.5 text-muted-foreground shrink-0' />
                                        <span>{item.label}</span>
                                    </span>
                                    {isEnabled ? (
                                        <CheckIcon className='size-4 text-primary' />
                                    ) : (
                                        <span className='size-4' />
                                    )}
                                </CommandItem>
                            );
                        })}
                    </CommandGroup>
                ))}
            </CommandList>
        </Command>
    );
}

// ---------------------------------------------------------------------------
// DataSourcePicker
// ---------------------------------------------------------------------------

interface DataSourcePickerProps {
    enabledSources: DataSourceId[];
    onToggle: (sourceId: DataSourceId) => void;
    onSelectAll: () => void;
    onUnselectAll: () => void;
    disabled?: boolean;
}

export function DataSourcePicker({
    enabledSources,
    onToggle,
    onSelectAll,
    onUnselectAll,
    disabled,
}: DataSourcePickerProps) {
    const [open, setOpen] = useState(false);
    const isMobile = useIsMobile();

    const allSelected = enabledSources.length === totalSources;
    const noneSelected = enabledSources.length === 0;

    const triggerLabel = allSelected
        ? 'בחר מקורות מידע'
        : enabledSources.length === 1
          ? (pickerItems.find((item) => item.id === enabledSources[0])?.label ?? '1 מקורות מידע נבחרו')
          : `${enabledSources.length} מקורות מידע נבחרו`;

    const headerLabel = allSelected ? 'כל מקורות המידע נבחרו' : triggerLabel;

    const trigger = (
        <button
            type='button'
            onClick={() => setOpen(true)}
            className={cn(
                'flex h-7 items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-2.5 text-xs transition-colors hover:bg-muted',
                disabled && 'pointer-events-none opacity-50',
            )}
            disabled={disabled}
        >
            <DatabaseIcon className='size-3.5' />
            <span>{triggerLabel}</span>
        </button>
    );

    const pickerContent = (
        <PickerContent
            enabledSources={enabledSources}
            allSelected={allSelected}
            noneSelected={noneSelected}
            onToggle={onToggle}
            onSelectAll={onSelectAll}
            onUnselectAll={onUnselectAll}
        />
    );

    if (isMobile) {
        return (
            <>
                {trigger}
                <Drawer open={open} onOpenChange={setOpen}>
                    <DrawerContent>
                        <DrawerTitle className='sr-only'>בחירת מקורות מידע</DrawerTitle>
                        {pickerContent}
                        <div className='border-t px-4 py-2.5 text-center text-xs text-muted-foreground'>
                            {headerLabel}
                        </div>
                    </DrawerContent>
                </Drawer>
            </>
        );
    }

    return (
        <>
            {trigger}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent showCloseButton={false} className='p-0 gap-0 max-w-sm'>
                    <DialogTitle className='sr-only'>בחירת מקורות מידע</DialogTitle>
                    {pickerContent}
                    <div className='border-t px-4 py-2.5 text-center text-xs text-muted-foreground'>{headerLabel}</div>
                </DialogContent>
            </Dialog>
        </>
    );
}
