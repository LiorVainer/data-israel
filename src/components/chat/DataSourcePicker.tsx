'use client';

import { type ComponentProps, createContext, useContext, useState } from 'react';
import { CheckIcon, DatabaseIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import type { DataSource } from '@/data-sources/registry';
import { getDataSourcePickerItems } from '@/data-sources/registry';
import type { DataSourceCategory } from '@/data-sources/types';
import { DATA_SOURCES_CATEGORIES } from '@/data-sources/types';

// ---------------------------------------------------------------------------
// Computed data (module-level)
// ---------------------------------------------------------------------------

export const pickerItems = getDataSourcePickerItems();

const groupedByCategory = Object.entries(DATA_SOURCES_CATEGORIES)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([key, meta]) => ({
        category: key as DataSourceCategory,
        label: meta.label,
        items: pickerItems.filter((item) => item.category === key).sort((a, b) => a.categoryOrder - b.categoryOrder),
    }))
    .filter((group) => group.items.length > 0);

export const totalSources = pickerItems.length;

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface DataSourcePickerContextValue {
    enabledSources: DataSource[];
    allSelected: boolean;
    noneSelected: boolean;
    onToggle: (sourceId: DataSource) => void;
    onSelectAll: () => void;
    onUnselectAll: () => void;
}

const DataSourcePickerContext = createContext<DataSourcePickerContextValue | null>(null);

function useDataSourcePickerContext() {
    const ctx = useContext(DataSourcePickerContext);
    if (!ctx) throw new Error('DataSourcePicker.* must be used within <DataSourcePicker>');
    return ctx;
}

// ---------------------------------------------------------------------------
// Root — Dialog on desktop, Drawer on mobile
// ---------------------------------------------------------------------------

export interface DataSourcePickerProps {
    enabledSources: DataSource[];
    onToggle: (sourceId: DataSource) => void;
    onSelectAll: () => void;
    onUnselectAll: () => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
}

export function DataSourcePicker({
    enabledSources,
    onToggle,
    onSelectAll,
    onUnselectAll,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    children,
}: DataSourcePickerProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isMobile = useIsMobile();

    const open = controlledOpen ?? internalOpen;
    const onOpenChange = controlledOnOpenChange ?? setInternalOpen;

    const allSelected = enabledSources.length === totalSources;
    const noneSelected = enabledSources.length === 0;

    const ctx: DataSourcePickerContextValue = {
        enabledSources,
        allSelected,
        noneSelected,
        onToggle,
        onSelectAll,
        onUnselectAll,
    };

    if (isMobile) {
        return (
            <DataSourcePickerContext.Provider value={ctx}>
                <Drawer open={open} onOpenChange={onOpenChange}>
                    {children}
                </Drawer>
            </DataSourcePickerContext.Provider>
        );
    }

    return (
        <DataSourcePickerContext.Provider value={ctx}>
            <Dialog open={open} onOpenChange={onOpenChange}>
                {children}
            </Dialog>
        </DataSourcePickerContext.Provider>
    );
}

// ---------------------------------------------------------------------------
// Trigger — wraps DialogTrigger / DrawerTrigger
// ---------------------------------------------------------------------------

export type DataSourcePickerTriggerProps = ComponentProps<'button'>;

export function DataSourcePickerTrigger({ className, children, ...props }: DataSourcePickerTriggerProps) {
    const isMobile = useIsMobile();
    const Trigger = isMobile ? DrawerTrigger : DialogTrigger;

    return (
        <Trigger asChild>
            <button type='button' className={cn('cursor-pointer', className)} {...props}>
                {children}
            </button>
        </Trigger>
    );
}

// ---------------------------------------------------------------------------
// Content — wraps DialogContent / DrawerContent + command list
// ---------------------------------------------------------------------------

export type DataSourcePickerContentProps = {
    className?: string;
    footerLabel?: React.ReactNode;
};

export function DataSourcePickerContent({ className, footerLabel }: DataSourcePickerContentProps) {
    const isMobile = useIsMobile();
    const { enabledSources, allSelected, noneSelected, onToggle, onSelectAll, onUnselectAll } =
        useDataSourcePickerContext();

    const content = (
        <>
            <Command dir='rtl' className='**:data-[slot=command-input-wrapper]:h-auto'>
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
            {footerLabel !== undefined && (
                <div className='border-t px-4 py-2.5 text-center text-xs text-muted-foreground'>{footerLabel}</div>
            )}
        </>
    );

    if (isMobile) {
        return (
            <DrawerContent className={className}>
                <DrawerTitle className='sr-only'>בחירת מקורות מידע</DrawerTitle>
                {content}
            </DrawerContent>
        );
    }

    return (
        <DialogContent showCloseButton={false} className={cn('p-0 gap-0 max-w-sm', className)}>
            <DialogTitle className='sr-only'>בחירת מקורות מידע</DialogTitle>
            {content}
        </DialogContent>
    );
}

// ---------------------------------------------------------------------------
// Helper: get trigger label from enabledSources
// ---------------------------------------------------------------------------

export function getPickerLabel(enabledSources: DataSource[]) {
    const allSelected = enabledSources.length === totalSources || enabledSources.length === 0;
    if (allSelected) return 'בחר מקורות מידע';
    if (enabledSources.length === 1) {
        return pickerItems.find((item) => item.id === enabledSources[0])?.label ?? '1 מקורות מידע נבחרו';
    }
    return `${enabledSources.length} מקורות מידע נבחרו`;
}

export function getPickerFooterLabel(enabledSources: DataSource[]) {
    const allSelected = enabledSources.length === totalSources || enabledSources.length === 0;
    return allSelected ? 'כל מקורות המידע נבחרו' : getPickerLabel(enabledSources);
}

// ---------------------------------------------------------------------------
// Re-export DatabaseIcon for convenience
// ---------------------------------------------------------------------------

export { DatabaseIcon };
