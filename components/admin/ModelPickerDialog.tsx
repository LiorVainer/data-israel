'use client';

import { useState, useMemo, useCallback } from 'react';
import type { AvailableModel } from '@/agents/agent.config';
import { ModelSelectorLogo } from '@/components/ai-elements/model-selector';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckIcon, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

function formatPrice(price: number | undefined): string {
    if (price === undefined) return '-';
    if (price === 0) return 'Free';
    if (price < 0.01) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(2)}`;
}

interface ModelPickerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    models: AvailableModel[];
    selectedModelId: string;
    onSelect: (modelId: string) => void;
    title: string;
    showPrices?: boolean;
}

/** Shared inner content for both Dialog and Drawer */
function ModelPickerContent({
    models,
    selectedModelId,
    onSelect,
    showPrices,
}: {
    models: AvailableModel[];
    selectedModelId: string;
    onSelect: (modelId: string) => void;
    showPrices: boolean;
}) {
    const [search, setSearch] = useState('');

    const filteredModels = useMemo(() => {
        if (!search.trim()) return models;
        const query = search.toLowerCase();
        return models.filter(
            (m) =>
                m.name.toLowerCase().includes(query) ||
                m.id.toLowerCase().includes(query) ||
                m.provider.toLowerCase().includes(query),
        );
    }, [models, search]);

    const providers = useMemo(() => {
        const seen = new Set<string>();
        const result: string[] = [];
        for (const m of filteredModels) {
            if (!seen.has(m.provider)) {
                seen.add(m.provider);
                result.push(m.provider);
            }
        }
        return result;
    }, [filteredModels]);

    return (
        <>
            <div className='border-b px-4 py-3' dir='ltr'>
                <div className='relative'>
                    <Search className='text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2' />
                    <Input
                        placeholder='Search model...'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className='pl-9'
                    />
                </div>
            </div>

            <ScrollArea className='flex-1 overflow-y-auto' style={{ maxHeight: 'calc(80vh - 130px)' }}>
                <div className='p-2' dir='ltr'>
                    {filteredModels.length === 0 ? (
                        <p className='text-muted-foreground py-8 text-center text-sm'>No models found</p>
                    ) : (
                        providers.map((provider) => (
                            <div key={provider} className='mb-4 last:mb-0'>
                                <p className='text-muted-foreground mb-1 px-2 text-xs font-medium'>{provider}</p>
                                {filteredModels
                                    .filter((m) => m.provider === provider)
                                    .map((m) => {
                                        const isSelected = m.id === selectedModelId;
                                        return (
                                            <button
                                                key={m.id}
                                                type='button'
                                                onClick={() => onSelect(m.id)}
                                                className={cn(
                                                    'flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors',
                                                    'hover:bg-muted/60',
                                                    isSelected && 'bg-muted',
                                                )}
                                            >
                                                <ModelSelectorLogo provider={m.providerSlug} />
                                                <span className='flex-1 truncate text-left'>{m.name}</span>
                                                {showPrices && (
                                                    <span className='text-muted-foreground flex shrink-0 items-center gap-1 text-[11px] tabular-nums'>
                                                        <span className='text-blue-500' title='Input per 1M tokens'>
                                                            {formatPrice(m.inputPrice)}
                                                        </span>
                                                        <span className='text-muted-foreground/50'>|</span>
                                                        <span className='text-orange-500' title='Output per 1M tokens'>
                                                            {formatPrice(m.outputPrice)}
                                                        </span>
                                                    </span>
                                                )}
                                                {isSelected && <CheckIcon className='size-4 shrink-0' />}
                                            </button>
                                        );
                                    })}
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </>
    );
}

export function ModelPickerDialog({
    open,
    onOpenChange,
    models,
    selectedModelId,
    onSelect,
    title,
    showPrices = false,
}: ModelPickerDialogProps) {
    const isMobile = useIsMobile();

    const handleSelect = useCallback(
        (modelId: string) => {
            onSelect(modelId);
            onOpenChange(false);
        },
        [onSelect, onOpenChange],
    );

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={onOpenChange}>
                <DrawerContent className='max-h-[85vh]' dir='ltr'>
                    <DrawerHeader className='border-b'>
                        <DrawerTitle>{title}</DrawerTitle>
                    </DrawerHeader>
                    <ModelPickerContent
                        models={models}
                        selectedModelId={selectedModelId}
                        onSelect={handleSelect}
                        showPrices={showPrices}
                    />
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-lg' dir='ltr'>
                <DialogHeader className='border-b px-4 pt-4 pb-3'>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <ModelPickerContent
                    models={models}
                    selectedModelId={selectedModelId}
                    onSelect={handleSelect}
                    showPrices={showPrices}
                />
            </DialogContent>
        </Dialog>
    );
}
