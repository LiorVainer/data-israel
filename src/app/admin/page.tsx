'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@/context/UserContext';
import { ALL_AGENT_CONFIGS, CLIENT_DEFAULT_MODEL, getModelDisplay, SUB_AGENT_CONFIGS } from '@/constants/admin';
import { useOpenRouterModels } from '@/hooks/use-openrouter-models';
import { ModelSelectorLogo } from '@/components/ai-elements/model-selector';
import { ModelPickerDialog } from '@/components/admin/ModelPickerDialog';
import { ModelPriceDisplay } from '@/components/admin/ModelPriceDisplay';
import { ConfirmModelChangeDialog, type PendingChange } from '@/components/admin/ConfirmModelChangeDialog';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { ConversationsDashboard } from '@/components/admin/ConversationsDashboard';
import { DataIsraelLoader } from '@/components/chat/DataIsraelLoader';
import { AlertTriangle, ChevronDown, Layers, RefreshCw, ShieldAlert, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    const bulkUpsertModels = useMutation(api.aiModels.bulkUpsert);

    // Track which model picker dialog is open (agent ID or bulk key)
    const [openDialog, setOpenDialog] = useState<string | null>(null);

    // Pending confirmation state
    const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);

    // Build default selected models from all agent configs
    const defaultSelectedModels = useMemo(() => {
        const defaults: Record<string, string> = {};
        for (const agent of ALL_AGENT_CONFIGS) {
            defaults[agent.id] = CLIENT_DEFAULT_MODEL;
        }
        return defaults;
    }, []);

    // Local state for selected models
    const [selectedModels, setSelectedModels] = useState<Record<string, string>>(defaultSelectedModels);

    // Sync Convex data into local state when loaded
    useEffect(() => {
        if (!aiModels) return;

        setSelectedModels((prev) => {
            const updated = { ...prev };
            for (const record of aiModels) {
                // Only update if this agent ID is in our config list
                if (ALL_AGENT_CONFIGS.some((a) => a.id === record.agentId)) {
                    updated[record.agentId] = record.modelId;
                }
            }
            return updated;
        });
    }, [aiModels]);

    const handleModelPicked = useCallback(
        (agentId: string, modelId: string) => {
            if (modelId === selectedModels[agentId]) return;
            setPendingChange({ type: 'single', agentId, modelId });
        },
        [selectedModels],
    );

    const handleBulkModelPicked = useCallback((agentIds: string[], modelId: string, label: string) => {
        setPendingChange({ type: 'bulk', agentIds, modelId, label });
    }, []);

    const handleConfirmChange = useCallback(() => {
        if (!pendingChange) return;

        if (pendingChange.type === 'single') {
            const { agentId, modelId } = pendingChange;
            const agentConfig = ALL_AGENT_CONFIGS.find((a) => a.id === agentId);
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
        } else {
            const { agentIds, modelId, label } = pendingChange;
            // Save previous models for rollback
            const previousModels: Record<string, string> = {};
            for (const id of agentIds) {
                previousModels[id] = selectedModels[id] ?? CLIENT_DEFAULT_MODEL;
            }
            // Optimistic update
            setSelectedModels((prev) => {
                const updated = { ...prev };
                for (const id of agentIds) {
                    updated[id] = modelId;
                }
                return updated;
            });
            setPendingChange(null);
            bulkUpsertModels({ agentIds, modelId })
                .then(() => {
                    toast.success(`${label}: ${agentIds.length} סוכנים עודכנו למודל ${modelId}`);
                })
                .catch((error: unknown) => {
                    // Rollback
                    setSelectedModels((prev) => ({ ...prev, ...previousModels }));
                    const message = error instanceof Error ? error.message : 'שגיאה לא ידועה';
                    toast.error(`שמירת המודלים נכשלה: ${message}`);
                    console.error('[AdminPage] bulkUpsertModels failed:', error);
                });
        }
    }, [pendingChange, selectedModels, upsertModel, bulkUpsertModels]);

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

    const subAgentIds = SUB_AGENT_CONFIGS.map((a) => a.id);
    const allAgentIds = ALL_AGENT_CONFIGS.map((a) => a.id);

    return (
        <div className='relative w-full' dir='rtl'>
            <div className='relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 py-14'>
                <div className='w-full max-w-5xl'>
                    <h1 className='mb-8 text-3xl font-bold'>פאנל ניהול</h1>
                    <DirectionProvider dir='rtl'>
                        <Tabs defaultValue='models'>
                            <TabsList className='mb-6'>
                                <TabsTrigger value='models'>מודלים</TabsTrigger>
                                <TabsTrigger value='analytics'>אנליטקות</TabsTrigger>
                                <TabsTrigger value='conversations'>שיחות</TabsTrigger>
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
                                    <div className='space-y-10'>
                                        {/* Bulk Operations */}
                                        <div>
                                            <h2 className='mb-4 flex items-center gap-2 text-xl font-semibold'>
                                                פעולות מרוכזות
                                            </h2>
                                            <div className='grid gap-4 sm:grid-cols-2'>
                                                {/* Apply to all sub-agents */}
                                                <div className='bg-background/80 rounded-lg border border-dashed p-4 backdrop-blur-sm'>
                                                    <h3 className='mb-3 flex items-center gap-2 text-base font-semibold'>
                                                        <Users className='size-5' />
                                                        החל על כל סוכני מקורות המידע
                                                    </h3>
                                                    <p className='text-muted-foreground mb-3 text-xs'>
                                                        {SUB_AGENT_CONFIGS.length} סוכנים (ללא סוכן הניתוב)
                                                    </p>
                                                    <Button
                                                        dir='ltr'
                                                        variant='outline'
                                                        className='h-auto w-full px-3 py-2.5 !font-normal'
                                                        onClick={() => setOpenDialog('bulk-sub-agents')}
                                                    >
                                                        <span className='flex w-full items-center gap-1.5'>
                                                            <span className='min-w-0 truncate'>בחר מודל...</span>
                                                            <ChevronDown className='ml-auto size-4 shrink-0 opacity-50' />
                                                        </span>
                                                    </Button>
                                                    <ModelPickerDialog
                                                        open={openDialog === 'bulk-sub-agents'}
                                                        onOpenChange={(open) =>
                                                            setOpenDialog(open ? 'bulk-sub-agents' : null)
                                                        }
                                                        models={models}
                                                        selectedModelId=''
                                                        onSelect={(modelId) =>
                                                            handleBulkModelPicked(
                                                                subAgentIds,
                                                                modelId,
                                                                'כל סוכני המידע',
                                                            )
                                                        }
                                                        title='Select model — All Sub-Agents'
                                                        showPrices
                                                    />
                                                </div>

                                                {/* Apply to all agents (routing + sub-agents) */}
                                                <div className='bg-background/80 rounded-lg border border-dashed p-4 backdrop-blur-sm'>
                                                    <h3 className='mb-3 flex items-center gap-2 text-base font-semibold'>
                                                        <Layers className='size-5' />
                                                        החל על כל הסוכנים
                                                    </h3>
                                                    <p className='text-muted-foreground mb-3 text-xs'>
                                                        {ALL_AGENT_CONFIGS.length} סוכנים (כולל סוכן הניתוב)
                                                    </p>
                                                    <Button
                                                        dir='ltr'
                                                        variant='outline'
                                                        className='h-auto w-full px-3 py-2.5 !font-normal'
                                                        onClick={() => setOpenDialog('bulk-all-agents')}
                                                    >
                                                        <span className='flex w-full items-center gap-1.5'>
                                                            <span className='min-w-0 truncate'>בחר מודל...</span>
                                                            <ChevronDown className='ml-auto size-4 shrink-0 opacity-50' />
                                                        </span>
                                                    </Button>
                                                    <ModelPickerDialog
                                                        open={openDialog === 'bulk-all-agents'}
                                                        onOpenChange={(open) =>
                                                            setOpenDialog(open ? 'bulk-all-agents' : null)
                                                        }
                                                        models={models}
                                                        selectedModelId=''
                                                        onSelect={(modelId) =>
                                                            handleBulkModelPicked(allAgentIds, modelId, 'כל הסוכנים')
                                                        }
                                                        title='Select model — All Agents'
                                                        showPrices
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Individual Agent Cards */}
                                        <div>
                                            <h2 className='mb-4 flex items-center gap-2 text-xl font-semibold'>
                                                סוכנים
                                            </h2>
                                            <div className='space-y-6'>
                                                {ALL_AGENT_CONFIGS.map((agent) => {
                                                    const modelId = selectedModels[agent.id] ?? CLIENT_DEFAULT_MODEL;
                                                    const modelData = getModelDisplay(modelId, models);

                                                    return (
                                                        <div
                                                            key={agent.id}
                                                            className='bg-background/80 rounded-lg border p-4 backdrop-blur-sm'
                                                        >
                                                            <h3 className='mb-3 flex items-center gap-2 text-lg font-semibold'>
                                                                <agent.icon className='size-5' />
                                                                {agent.label}
                                                            </h3>
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
                                                                    <span className='min-w-0 truncate'>
                                                                        {modelData.name}
                                                                    </span>
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
                                                                onOpenChange={(open) =>
                                                                    setOpenDialog(open ? agent.id : null)
                                                                }
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
                                        </div>
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

                            {/* Conversations Tab */}
                            <TabsContent value='conversations'>
                                <ConversationsDashboard />
                            </TabsContent>
                        </Tabs>
                    </DirectionProvider>
                </div>
            </div>
        </div>
    );
}
