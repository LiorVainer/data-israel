'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@/context/UserContext';
import type { AvailableModel } from '@/agents/agent.config';
import { AgentsDisplayMap } from '@/constants/agents-display';
import { useOpenRouterModels } from '@/hooks/use-openrouter-models';
import { ModelSelectorLogo } from '@/components/ai-elements/model-selector';
import { ModelPickerDialog } from '@/components/admin/ModelPickerDialog';
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
import { DataIsraelLoader } from '@/components/chat/DataIsraelLoader';
import { AlertTriangle, ChevronDown, RefreshCw, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { GeometricBackground } from '@/components/ui/shape-landing-hero';

/** Agent configuration for the admin panel */
const AGENT_CONFIGS = [
    { id: 'routing', label: 'סוכן ניתוב', dialogTitle: 'Routing Agent', icon: AgentsDisplayMap.routingAgent.icon },
    { id: 'datagov', label: 'סוכן data.gov.il', dialogTitle: 'DataGov Agent', icon: AgentsDisplayMap.datagovAgent.icon },
    { id: 'cbs', label: 'סוכן הלמ"ס', dialogTitle: 'CBS Agent', icon: AgentsDisplayMap.cbsAgent.icon },
] as const;

type AgentId = (typeof AGENT_CONFIGS)[number]['id'];

/** Client-safe default model ID (first model in the static config) */
const CLIENT_DEFAULT_MODEL = 'google/gemini-3-flash-preview';

/**
 * Derives display information for any model ID.
 * If the model exists in the fetched list, uses that data.
 * Otherwise, derives display info from the model ID itself.
 */
function getModelDisplay(modelId: string, models: AvailableModel[]): AvailableModel {
    const found = models.find((m) => m.id === modelId);
    if (found) return found;

    const slashIndex = modelId.indexOf('/');
    const providerSlug = slashIndex > 0 ? modelId.slice(0, slashIndex) : modelId;
    const rawName = slashIndex > 0 ? modelId.slice(slashIndex + 1) : modelId;
    const displayName = rawName
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

    return {
        id: modelId,
        name: displayName,
        provider: providerSlug.charAt(0).toUpperCase() + providerSlug.slice(1),
        providerSlug,
    };
}

/** Loading state with spinning logo */
function ModelsLoadingState() {
    return (
        <div className='flex flex-col items-center gap-3 py-16'>
            <DataIsraelLoader size={32} />
            <p className='text-muted-foreground text-sm'>טוען מודלים...</p>
        </div>
    );
}

/** Error state with retry button */
function ModelsErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
    return (
        <div className='flex flex-col items-center gap-4 rounded-lg border border-destructive/50 bg-destructive/5 p-8'>
            <AlertTriangle className='text-destructive size-10' />
            <div className='text-center'>
                <h2 className='text-lg font-semibold'>שגיאה בטעינת מודלים</h2>
                <p className='text-muted-foreground mt-1 text-sm'>{error.message}</p>
            </div>
            <Button variant='outline' onClick={onRetry} className='gap-2'>
                <RefreshCw className='size-4' />
                נסה שוב
            </Button>
        </div>
    );
}

export default function AdminPage() {
    const { isAdmin, isLoading: isUserLoading, isAuthenticated } = useUser();
    const { models, isLoading: isModelsLoading, error: modelsError, refetch } = useOpenRouterModels();

    // Fetch current model configs from Convex
    const aiModels = useQuery(api.aiModels.getAll, {});
    const upsertModel = useMutation(api.aiModels.upsert);

    // Track which model picker dialog is open
    const [openDialog, setOpenDialog] = useState<AgentId | null>(null);

    // Pending confirmation state
    const [pendingChange, setPendingChange] = useState<{ agentId: AgentId; modelId: string } | null>(null);

    // Local state for selected models
    const [selectedModels, setSelectedModels] = useState<Record<AgentId, string>>({
        routing: CLIENT_DEFAULT_MODEL,
        datagov: CLIENT_DEFAULT_MODEL,
        cbs: CLIENT_DEFAULT_MODEL,
    });

    // Sync Convex data into local state when loaded
    useEffect(() => {
        if (!aiModels) return;

        setSelectedModels((prev) => {
            const updated = { ...prev };
            for (const record of aiModels) {
                if (record.agentId === 'routing' || record.agentId === 'datagov' || record.agentId === 'cbs') {
                    updated[record.agentId] = record.modelId;
                }
            }
            return updated;
        });
    }, [aiModels]);

    const handleModelPicked = useCallback(
        (agentId: AgentId, modelId: string) => {
            if (modelId === selectedModels[agentId]) return;
            setPendingChange({ agentId, modelId });
        },
        [selectedModels],
    );

    const handleConfirmChange = useCallback(() => {
        if (!pendingChange) return;
        const { agentId, modelId } = pendingChange;
        const agentConfig = AGENT_CONFIGS.find((a) => a.id === agentId);
        const agentLabel = agentConfig?.label ?? agentId;
        const previousModel = selectedModels[agentId];
        setSelectedModels((prev) => ({ ...prev, [agentId]: modelId }));
        setPendingChange(null);
        upsertModel({ agentId, modelId })
            .then(() => {
                toast.success(`${agentLabel} עודכן למודל ${modelId}`);
            })
            .catch((error: unknown) => {
                setSelectedModels((prev) => ({ ...prev, [agentId]: previousModel }));
                const message = error instanceof Error ? error.message : 'שגיאה לא ידועה';
                toast.error(`שמירת המודל נכשלה: ${message}`);
                console.error('[AdminPage] upsertModel failed:', error);
            });
    }, [pendingChange, selectedModels, upsertModel]);

    // Wait for both auth and Convex user role to resolve before showing access denied
    const isResolving = isUserLoading || (isAuthenticated && aiModels === undefined);

    if (isResolving) {
        return (
            <div className='flex min-h-dvh flex-col items-center justify-center gap-3' dir='rtl'>
                <DataIsraelLoader size={32} />
                <p className='text-muted-foreground text-sm'>טוען...</p>
            </div>
        );
    }

    if (!isAuthenticated || !isAdmin) {
        return (
            <div className='flex min-h-dvh flex-col items-center justify-center gap-4' dir='rtl'>
                <ShieldAlert className='text-destructive size-12' />
                <h1 className='text-2xl font-bold'>אין הרשאה</h1>
                <p className='text-muted-foreground'>אין לך הרשאת גישה לפאנל הניהול.</p>
            </div>
        );
    }

    return (
        <div className='relative h-full w-full' dir='rtl'>
            <GeometricBackground noShapes />
        <div className='relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 py-12'>
        <div className='w-full max-w-2xl'>
            <h1 className='mb-8 text-3xl font-bold'>פאנל ניהול</h1>
            <p className='text-muted-foreground mb-8'>בחר את המודל עבור כל סוכן. שינויים נכנסים לתוקף מיידית.</p>

            {isModelsLoading ? (
                <ModelsLoadingState />
            ) : modelsError ? (
                <ModelsErrorState error={modelsError} onRetry={() => refetch()} />
            ) : (
                <div className='space-y-6'>
                    {AGENT_CONFIGS.map((agent) => {
                        const modelId = selectedModels[agent.id];
                        const modelData = getModelDisplay(modelId, models);

                        return (
                            <div key={agent.id} className='bg-background/80 rounded-lg border p-4 backdrop-blur-sm'>
                                <h2 className='mb-3 flex items-center gap-2 text-lg font-semibold'>
                                    <agent.icon className='size-5' />
                                    {agent.label}
                                </h2>
                                <Button
                                    variant='outline'
                                    className='w-full justify-between'
                                    onClick={() => setOpenDialog(agent.id)}
                                >
                                    <span className='flex items-center gap-2'>
                                        <ModelSelectorLogo provider={modelData.providerSlug} />
                                        <span>{modelData.name}</span>
                                    </span>
                                    <ChevronDown className='size-4 opacity-50' />
                                </Button>
                                <ModelPickerDialog
                                    open={openDialog === agent.id}
                                    onOpenChange={(open) => setOpenDialog(open ? agent.id : null)}
                                    models={models}
                                    selectedModelId={modelId}
                                    onSelect={(id) => handleModelPicked(agent.id, id)}
                                    title={`Select model — ${agent.dialogTitle}`}
                                    showPrices
                                />
                            </div>
                        );
                    })}
                </div>
            )}
            <AlertDialog open={pendingChange !== null} onOpenChange={(open) => { if (!open) setPendingChange(null); }}>
                <AlertDialogContent size='sm' dir='rtl'>
                    <AlertDialogHeader className='place-items-start text-right'>
                        <AlertDialogTitle>אישור שינוי מודל</AlertDialogTitle>
                        {pendingChange && (() => {
                            const agentConfig = AGENT_CONFIGS.find((a) => a.id === pendingChange.agentId);
                            const currentModel = getModelDisplay(selectedModels[pendingChange.agentId], models);
                            const newModel = getModelDisplay(pendingChange.modelId, models);
                            return (
                                <AlertDialogDescription asChild>
                                    <div className='w-full space-y-3 text-sm'>
                                        <p className='flex items-center gap-2'>
                                            {agentConfig && <agentConfig.icon className='size-4' />}
                                            <span className='font-medium text-foreground'>{agentConfig?.label}</span>
                                        </p>
                                        <div className='bg-muted/50 flex w-full flex-col rounded-md p-3' dir='ltr'>
                                            <div className='flex items-start gap-2'>
                                                <ModelSelectorLogo provider={currentModel.providerSlug} className='mt-0.5 shrink-0' />
                                                <span className='text-muted-foreground text-left'>{currentModel.name}</span>
                                            </div>
                                            <div className='border-border my-2 border-t' />
                                            <div className='flex items-start gap-2'>
                                                <ModelSelectorLogo provider={newModel.providerSlug} className='mt-0.5 shrink-0' />
                                                <span className='font-medium text-foreground text-left'>{newModel.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                </AlertDialogDescription>
                            );
                        })()}
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmChange}>אישור</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
        </div>
        </div>
    );
}
