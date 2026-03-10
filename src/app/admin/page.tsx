'use client';

import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@/context/UserContext';
import { AGENT_CONFIGS, type AgentId, CLIENT_DEFAULT_MODEL, getModelDisplay } from '@/constants/admin';
import { useOpenRouterModels } from '@/hooks/use-openrouter-models';
import { ModelSelectorLogo } from '@/components/ai-elements/model-selector';
import { ModelPickerDialog } from '@/components/admin/ModelPickerDialog';
import { ModelPriceDisplay } from '@/components/admin/ModelPriceDisplay';
import { ConfirmModelChangeDialog } from '@/components/admin/ConfirmModelChangeDialog';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { DataIsraelLoader } from '@/components/chat/DataIsraelLoader';
import { AlertTriangle, ChevronDown, RefreshCw, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DirectionProvider } from '@/components/ui/direction';

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
    const { isAdmin, isAdminLoading, isLoading: isUserLoading, isAuthenticated } = useUser();
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
    const isResolving = isUserLoading || isAdminLoading || (isAuthenticated && aiModels === undefined);

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
        <div className='relative w-full' dir='rtl'>
            <div className='relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 py-12'>
                <div className='w-full max-w-5xl'>
                    <h1 className='mb-8 text-3xl font-bold'>פאנל ניהול</h1>
                    <DirectionProvider dir='rtl'>
                    <Tabs defaultValue='models'>
                        <TabsList className='mb-6'>
                            <TabsTrigger value='models'>מודלים</TabsTrigger>
                            <TabsTrigger value='analytics'>אנליטקות</TabsTrigger>
                        </TabsList>

                        {/* Models Tab */}
                        <TabsContent value='models'>
                            <p className='text-muted-foreground mb-8'>
                                בחר את המודל עבור כל סוכן. שינויים נכנסים לתוקף מיידית.
                            </p>

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
                                            <div
                                                key={agent.id}
                                                className='bg-background/80 rounded-lg border p-4 backdrop-blur-sm'
                                            >
                                                <h2 className='mb-3 flex items-center gap-2 text-lg font-semibold'>
                                                    <agent.icon className='size-5' />
                                                    {agent.label}
                                                </h2>
                                                <Button
                                                    dir='ltr'
                                                    variant='outline'
                                                    className='h-auto w-full flex-col items-start gap-0 px-3 py-2.5 !font-normal'
                                                    onClick={() => setOpenDialog(agent.id)}
                                                >
                                                    <span className='flex w-full items-center gap-1.5'>
                                                        <ModelSelectorLogo
                                                            provider={modelData.providerSlug}
                                                            className='shrink-0'
                                                        />
                                                        <span className='min-w-0 truncate'>{modelData.name}</span>
                                                        <ChevronDown className='ml-auto size-4 shrink-0 opacity-50' />
                                                    </span>
                                                    <ModelPriceDisplay
                                                        inputPrice={modelData.inputPrice}
                                                        outputPrice={modelData.outputPrice}
                                                        className='mt-1'
                                                    />
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
                            <ConfirmModelChangeDialog
                                pendingChange={pendingChange}
                                selectedModels={selectedModels}
                                models={models}
                                onConfirm={handleConfirmChange}
                                onCancel={() => setPendingChange(null)}
                            />
                        </TabsContent>

                        {/* Analytics Tab */}
                        <TabsContent value='analytics'>
                            <AnalyticsDashboard />
                        </TabsContent>
                    </Tabs>
                    </DirectionProvider>
                </div>
            </div>
        </div>
    );
}
