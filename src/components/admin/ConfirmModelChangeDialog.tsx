'use client';

import type { AvailableModel } from '@/agents/agent.config';
import { AGENT_CONFIGS, getModelDisplay, type AgentId } from '@/constants/admin';
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
            <span
                className={`mb-1 block text-left text-xs ${isCurrent ? 'text-muted-foreground' : 'text-foreground'}`}
            >
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

interface ConfirmModelChangeDialogProps {
    pendingChange: { agentId: AgentId; modelId: string } | null;
    selectedModels: Record<AgentId, string>;
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
    const agentConfig = pendingChange ? AGENT_CONFIGS.find((a) => a.id === pendingChange.agentId) : null;
    const currentModel = pendingChange ? getModelDisplay(selectedModels[pendingChange.agentId], models) : null;
    const newModel = pendingChange ? getModelDisplay(pendingChange.modelId, models) : null;

    return (
        <AlertDialog
            open={pendingChange !== null}
            onOpenChange={(open) => {
                if (!open) onCancel();
            }}
        >
            <AlertDialogContent size='sm' dir='rtl' className='gap-8'>
                <AlertDialogHeader className='place-items-start text-right'>
                    <AlertDialogTitle>אישור שינוי מודל</AlertDialogTitle>
                    {pendingChange && agentConfig && currentModel && newModel && (
                        <AlertDialogDescription asChild>
                            <div className='w-full space-y-3 text-sm'>
                                <p className='flex items-center gap-2'>
                                    <agentConfig.icon className='size-4' />
                                    <span className='font-medium text-foreground'>{agentConfig.label}</span>
                                </p>
                                <div className='flex w-full flex-col gap-5' dir='ltr'>
                                    <ModelComparison label='Current' model={currentModel} isCurrent />
                                    <ModelComparison label='New' model={newModel} />
                                </div>
                            </div>
                        </AlertDialogDescription>
                    )}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>ביטול</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>אישור</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
