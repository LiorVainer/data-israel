'use client';

import type { AvailableModel } from '@/agents/agent.config';
import { ALL_AGENT_CONFIGS, getModelDisplay, type AgentId } from '@/constants/admin';
import { ModelSelectorLogo } from '@/components/ai-elements/model-selector';
import { ModelPriceDisplay } from './ModelPriceDisplay';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ModelComparisonProps {
    label: string;
    model: AvailableModel;
    isCurrent?: boolean;
}

function ModelComparison({ label, model, isCurrent }: ModelComparisonProps) {
    return (
        <div>
            <span className={`mb-1 block text-left text-xs ${isCurrent ? 'text-muted-foreground' : 'text-foreground'}`}>
                {label}
            </span>
            <div className='flex items-center gap-1.5'>
                <ModelSelectorLogo provider={model.providerSlug} className='shrink-0' />
                <span className={`text-left ${isCurrent ? 'text-muted-foreground' : 'font-medium text-foreground'}`}>
                    {model.name}
                </span>
            </div>
            <ModelPriceDisplay inputPrice={model.inputPrice} outputPrice={model.outputPrice} className='mt-0.5' />
        </div>
    );
}

/** Pending change — either a single agent or a bulk operation */
export type PendingChange =
    | { type: 'single'; agentId: AgentId; modelId: string }
    | { type: 'bulk'; agentIds: AgentId[]; modelId: string; label: string };

interface ConfirmModelChangeDialogProps {
    pendingChange: PendingChange | null;
    selectedModels: Record<string, string>;
    models: AvailableModel[];
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmModelChangeDialog({
    pendingChange,
    selectedModels,
    models,
    onConfirm,
    onCancel,
}: ConfirmModelChangeDialogProps) {
    if (!pendingChange) {
        return (
            <AlertDialog open={false}>
                <AlertDialogContent size='sm' dir='rtl' />
            </AlertDialog>
        );
    }

    const newModel = getModelDisplay(pendingChange.modelId, models);

    // Single agent change
    if (pendingChange.type === 'single') {
        const agentConfig = ALL_AGENT_CONFIGS.find((a) => a.id === pendingChange.agentId);
        const currentModel = getModelDisplay(selectedModels[pendingChange.agentId] ?? '', models);

        return (
            <AlertDialog
                open
                onOpenChange={(open) => {
                    if (!open) onCancel();
                }}
            >
                <AlertDialogContent size='sm' dir='rtl' className='gap-8'>
                    <AlertDialogHeader className='place-items-start text-right'>
                        <AlertDialogTitle>אישור שינוי מודל</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className='w-full space-y-3 text-sm'>
                                {agentConfig && (
                                    <p className='flex items-center gap-2'>
                                        <agentConfig.icon className='size-4' />
                                        <span className='font-medium text-foreground'>{agentConfig.label}</span>
                                    </p>
                                )}
                                <div className='flex w-full flex-col gap-5' dir='ltr'>
                                    <ModelComparison label='Current' model={currentModel} isCurrent />
                                    <ModelComparison label='New' model={newModel} />
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction onClick={onConfirm}>אישור</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        );
    }

    // Bulk change
    const affectedConfigs = pendingChange.agentIds
        .map((id) => ALL_AGENT_CONFIGS.find((a) => a.id === id))
        .filter((c): c is (typeof ALL_AGENT_CONFIGS)[number] => c !== undefined);

    return (
        <AlertDialog
            open
            onOpenChange={(open) => {
                if (!open) onCancel();
            }}
        >
            <AlertDialogContent size='sm' dir='rtl' className='gap-8'>
                <AlertDialogHeader className='place-items-start text-right'>
                    <AlertDialogTitle>אישור שינוי מודל — {pendingChange.label}</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className='w-full space-y-3 text-sm'>
                            <p className='text-muted-foreground'>המודל הבא יוחל על {affectedConfigs.length} סוכנים:</p>
                            <div className='flex flex-wrap gap-2'>
                                {affectedConfigs.map((config) => (
                                    <span
                                        key={config.id}
                                        className='bg-muted inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs'
                                    >
                                        <config.icon className='size-3' />
                                        {config.label}
                                    </span>
                                ))}
                            </div>
                            <div dir='ltr'>
                                <ModelComparison label='New model' model={newModel} />
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>ביטול</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>אישור</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
