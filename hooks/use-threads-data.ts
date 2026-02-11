'use client';

import { useState, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { usePaginatedQuery } from 'convex-helpers/react/cache/hooks';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useUser } from '@/context/UserContext';
import { useSidebar } from '@/components/ui/sidebar';

export const THREADS_PAGE_SIZE = 10;

/** Thread shape returned by Convex paginated query */
export interface ThreadData {
    _id: string;
    id: string;
    title: string;
    metadata: Record<string, unknown> | null;
    _creationTime: number;
}

/**
 * Custom hook encapsulating all thread list data, navigation, and CRUD logic
 * for the sidebar. Provides paginated thread loading, thread selection,
 * delete confirmation state, and load-more functionality.
 */
export function useThreadsData() {
    const { guestId, isAuthenticated, isCreatingGuest, isValidatingGuest } = useUser();
    const { isMobile, setOpenMobile } = useSidebar();
    const router = useRouter();
    const pathname = usePathname();

    // Thread pending deletion (for confirmation modal)
    const [threadToDelete, setThreadToDelete] = useState<ThreadData | null>(null);

    // Convex mutations
    const deleteThreadMutation = useMutation(api.threads.deleteThread);

    // Skip query while guest session is being created or validated
    const shouldSkipQuery = !isAuthenticated && (isCreatingGuest || isValidatingGuest);

    const {
        results: rawThreads,
        status,
        loadMore,
    } = usePaginatedQuery(
        api.threads.listUserThreadsPaginated,
        shouldSkipQuery ? 'skip' : { guestId: (guestId as Id<'guests'>) || undefined },
        { initialNumItems: THREADS_PAGE_SIZE },
    );

    // Map raw Convex documents (loosely typed from @mastra/convex schema)
    // to our strongly-typed ThreadData interface
    const threads: ThreadData[] = useMemo(
        () =>
            rawThreads.map((raw) => ({
                _id: String(raw._id),
                id: String(raw.id),
                title: String(raw.title ?? ''),
                metadata: (raw.metadata ?? null) as Record<string, unknown> | null,
                _creationTime: raw._creationTime,
            })),
        [rawThreads],
    );

    // Derive current thread ID from pathname (/chat/[id])
    const currentThreadId = pathname?.startsWith('/chat/') ? pathname.split('/chat/')[1] : null;

    const handleThreadSelect = useCallback(
        (threadId: string) => {
            if (currentThreadId === threadId) return;
            router.push(`/chat/${threadId}`);
            if (isMobile) {
                setOpenMobile(false);
            }
        },
        [currentThreadId, router, isMobile, setOpenMobile],
    );

    // Stage a thread for deletion (opens confirmation modal)
    const handleDelete = useCallback((thread: ThreadData) => {
        setThreadToDelete(thread);
    }, []);

    // Execute the deletion after user confirms
    const confirmDelete = useCallback(async () => {
        if (!threadToDelete) return;

        await deleteThreadMutation({
            threadId: threadToDelete.id,
            guestId: (guestId as Id<'guests'>) || undefined,
        });

        // If we deleted the active thread, navigate home
        if (currentThreadId === threadToDelete.id) {
            router.push('/');
        }

        setThreadToDelete(null);
    }, [threadToDelete, deleteThreadMutation, guestId, currentThreadId, router]);

    // Cancel deletion
    const cancelDelete = useCallback(() => {
        setThreadToDelete(null);
    }, []);

    // Load next page
    const loadMoreThreads = useCallback(() => {
        loadMore(THREADS_PAGE_SIZE);
    }, [loadMore]);

    return {
        threads,
        status,
        currentThreadId,
        threadToDelete,
        handleThreadSelect,
        handleDelete,
        confirmDelete,
        cancelDelete,
        loadMoreThreads,
    };
}
