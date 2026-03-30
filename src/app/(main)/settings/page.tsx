'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { PencilIcon, ShieldAlert } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

import { api } from '@/convex/_generated/api';
import { useUser } from '@/context/UserContext';
import { DataIsraelLoader } from '@/components/chat/DataIsraelLoader';
import type { DataSource } from '@/data-sources/registry';
import { ALL_DATA_SOURCE_IDS } from '@/data-sources/registry';
import {
    DataSourcePicker,
    DataSourcePickerContent,
    DataSourcePickerTrigger,
    getPickerFooterLabel,
    pickerItems,
    totalSources,
} from '@/components/chat/DataSourcePicker';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSourceLabel(sources: DataSource[]) {
    const allSelected = sources.length === 0 || sources.length === totalSources;
    if (allSelected) return 'כל מקורות המידע';
    if (sources.length === 1) {
        return pickerItems.find((item) => item.id === sources[0])?.label ?? '1 מקור מידע';
    }
    return `${sources.length} מקורות מידע`;
}

// ---------------------------------------------------------------------------
// Settings Page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
    const { isAuthenticated, isLoading: isUserLoading } = useUser();
    const isMobile = useIsMobile();

    const userSettings = useQuery(api.users.getUserSettings);
    const upsertUserSettings = useMutation(api.users.upsertUserSettings);

    const [enabledSources, setEnabledSources] = useState<DataSource[]>([...ALL_DATA_SOURCE_IDS]);
    const allSelected = enabledSources.length === 0 || enabledSources.length === totalSources;
    const didInit = useRef(false);

    useEffect(() => {
        if (didInit.current || userSettings === undefined) return;
        didInit.current = true;
        if (userSettings && userSettings.length > 0) {
            setEnabledSources(userSettings as DataSource[]);
        }
    }, [userSettings]);

    const persistSources = useCallback(
        (sources: DataSource[]) => {
            const toStore = sources.length === totalSources ? [] : sources;
            void upsertUserSettings({ defaultEnabledSources: toStore });
        },
        [upsertUserSettings],
    );

    const handleToggle = useCallback(
        (sourceId: DataSource) => {
            setEnabledSources((prev) => {
                const current = prev.length === 0 ? [...ALL_DATA_SOURCE_IDS] : prev;
                let next: DataSource[];
                if (current.includes(sourceId)) {
                    next = current.filter((id) => id !== sourceId);
                } else {
                    next = [...current, sourceId];
                }
                if (next.length === 0) next = [...ALL_DATA_SOURCE_IDS];
                persistSources(next);
                return next;
            });
        },
        [persistSources],
    );

    const handleSelectAll = useCallback(() => {
        setEnabledSources([...ALL_DATA_SOURCE_IDS]);
        persistSources([...ALL_DATA_SOURCE_IDS]);
    }, [persistSources]);

    const handleUnselectAll = useCallback(() => {
        setEnabledSources([]);
        persistSources([]);
    }, [persistSources]);

    if (isUserLoading) {
        return (
            <div className='flex min-h-dvh flex-col items-center justify-center gap-3' dir='rtl'>
                <DataIsraelLoader size={32} />
                <p className='text-muted-foreground text-sm'>טוען...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className='flex min-h-dvh flex-col items-center justify-center gap-4' dir='rtl'>
                <ShieldAlert className='text-destructive size-12' />
                <h1 className='text-2xl font-bold'>יש להתחבר</h1>
                <p className='text-muted-foreground'>התחבר כדי לגשת להגדרות.</p>
            </div>
        );
    }

    return (
        <div className='relative w-full' dir='rtl'>
            <div className='relative z-10 flex min-h-dvh flex-col items-center px-4 pt-14'>
                <div className='w-full max-w-5xl flex flex-col gap-8'>
                    <h1 className='text-3xl font-bold'>הגדרות</h1>
                    <div className='flex flex-col gap-2'>
                        <p className='text-lg'>מקורות מידע ברירת מחדל</p>
                        <p className='text-sm text-muted-foreground'>
                            בחרו את מקורות המידע שייבחרו כברירת מחדל עבור חיפוש תשובה לשאלות בכל שיחה חדשה.
                        </p>

                        <DataSourcePicker
                            enabledSources={enabledSources}
                            onToggle={handleToggle}
                            onSelectAll={handleSelectAll}
                            onUnselectAll={handleUnselectAll}
                        >
                            <div className='flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 p-3'>
                                <div className='flex-1 min-w-0'>
                                    {isMobile ? (
                                        <span className='text-sm'>{getSourceLabel(enabledSources)}</span>
                                    ) : (
                                        <div className='flex flex-wrap gap-1.5'>
                                            {(allSelected
                                                ? pickerItems
                                                : pickerItems.filter((item) => enabledSources.includes(item.id))
                                            ).map((item) => (
                                                <span
                                                    key={item.id}
                                                    className='inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-2.5 py-0.5 text-xs'
                                                >
                                                    <item.icon className='size-3 text-muted-foreground' />
                                                    {item.label}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <DataSourcePickerTrigger className='size-8 shrink-0 flex items-center justify-center rounded-md hover:bg-accent transition-colors'>
                                    <PencilIcon className='size-3.5' />
                                </DataSourcePickerTrigger>
                            </div>
                            <DataSourcePickerContent footerLabel={getPickerFooterLabel(enabledSources)} />
                        </DataSourcePicker>
                    </div>
                </div>
            </div>
        </div>
    );
}
