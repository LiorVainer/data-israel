'use client';

import { useCallback, useMemo, useState } from 'react';
import type { AvailableModel } from '@/agents/agent.config';
import { formatPrice } from '@/constants/admin';
import { ModelSelectorLogo } from '@/components/ai-elements/model-selector';
import { ModelPriceDisplay } from './ModelPriceDisplay';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowDownNarrowWide, ArrowUpNarrowWide, CheckIcon, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export { formatPrice } from '@/constants/admin';

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
    const [priceSort, setPriceSort] = useState<'none' | 'asc' | 'desc'>('none');

    const filteredModels = useMemo(() => {
        let result = models;
        if (search.trim()) {
            const query = search.toLowerCase();
            result = result.filter(
                (m) =>
                    m.name.toLowerCase().includes(query) ||
                    m.id.toLowerCase().includes(query) ||
                    m.provider.toLowerCase().includes(query),
            );
        }
        if (priceSort !== 'none') {
            result = [...result].sort((a, b) => {
                const priceA = (a.inputPrice ?? 0) + (a.outputPrice ?? 0);
                const priceB = (b.inputPrice ?? 0) + (b.outputPrice ?? 0);
                return priceSort === 'asc' ? priceA - priceB : priceB - priceA;
            });
        }
        return result;
    }, [models, search, priceSort]);

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

    const isSortedByPrice = priceSort !== 'none';

    const cyclePriceSort = () => {
        setPriceSort((prev) => (prev === 'none' ? 'asc' : prev === 'asc' ? 'desc' : 'none'));
    };

    const SortIcon = priceSort === 'desc' ? ArrowDownNarrowWide : ArrowUpNarrowWide;

    function renderModelButton(m: AvailableModel) {
        const isSelected = m.id === selectedModelId;
        return (
            <button
                key={m.id}
                type='button'
                onClick={() => onSelect(m.id)}
                className={cn(
                    'flex w-full flex-col items-start rounded-md px-2 py-2 text-sm transition-colors',
                    'hover:bg-muted/60',
                    isSelected && 'bg-muted',
                )}
            >
                <span className='flex w-full items-center gap-1.5'>
                    <ModelSelectorLogo provider={m.providerSlug} className='shrink-0' />
                    <span className='min-w-0 truncate'>{m.name}</span>
                    {isSelected && <CheckIcon className='ml-auto size-4 shrink-0' />}
                </span>
                {showPrices && (
                    <ModelPriceDisplay inputPrice={m.inputPrice} outputPrice={m.outputPrice} />
                )}
            </button>
        );
    }

    return (
        <>
            <div className='border-b px-4 py-3' dir='ltr'>
                <div className='flex items-center gap-2'>
                    <div className='relative flex-1'>
                        <Search className='text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2' />
                        <Input
                            placeholder='Search model...'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className='pl-9'
                        />
                    </div>
                    {showPrices && (
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={cyclePriceSort}
                            title={
                                priceSort === 'none'
                                    ? 'Sort by price'
                                    : priceSort === 'asc'
                                      ? 'Price: low → high'
                                      : 'Price: high → low'
                            }
                            className={cn('shrink-0 gap-1 px-2 text-xs', isSortedByPrice && 'text-blue-500')}
                        >
                            <span className='font-semibold'>$</span>
                            <SortIcon className='size-3.5' />
                        </Button>
                    )}
                </div>
            </div>

            <ScrollArea className='flex-1 overflow-y-auto' style={{ maxHeight: 'calc(80vh - 130px)' }}>
                <div className='p-2' dir='ltr'>
                    {filteredModels.length === 0 ? (
                        <p className='text-muted-foreground py-8 text-center text-sm'>No models found</p>
                    ) : isSortedByPrice ? (
                        filteredModels.map((m) => renderModelButton(m))
                    ) : (
                        providers.map((provider) => (
                            <div key={provider} className='mb-4 last:mb-0'>
                                <p className='text-muted-foreground mb-1 px-2 text-xs font-medium'>{provider}</p>
                                {filteredModels.filter((m) => m.provider === provider).map((m) => renderModelButton(m))}
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
