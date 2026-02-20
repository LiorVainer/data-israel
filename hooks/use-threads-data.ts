'use client';

import { useState, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { useCRPC, useCRPCClient } from '@/lib/convex/crpc';
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

    const crpc = useCRPC();
    const crpcClient = useCRPCClient();

    // cRPC mutation for deleting threads
    const deleteThreadMut = useMutation(crpc.threads.deleteThread.mutationOptions());

    // Skip query while guest session is being created or validated
    const shouldSkipQuery = !isAuthenticated && (isCreatingGuest || isValidatingGuest);

    // The listUserThreadsPaginated procedure uses { guestId, paginationOpts: { numItems, cursor } }
    // which doesn't match better-convex's cursor/limit pattern for infiniteQueryOptions.
    // Using TanStack Query's useInfiniteQuery with manual page fetching via the vanilla cRPC client.
    const {
        data: threadsData,
        status: queryStatus,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ['threads', 'listUserThreadsPaginated', guestId],
        queryFn: async ({ pageParam }) => {
            const result = await crpcClient.threads.listUserThreadsPaginated.query({
                guestId: guestId ? String(guestId) : undefined,
                paginationOpts: {
                    numItems: THREADS_PAGE_SIZE,
                    cursor: pageParam,
                },
            });
            return result;
        },
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) =>
            lastPage.isDone ? undefined : lastPage.continueCursor,
        enabled: !shouldSkipQuery,
    });

    // Flatten pages and map to strongly-typed ThreadData interface
    const threads: ThreadData[] = useMemo(
        () =>
            (threadsData?.pages.flatMap((page) => page.page) ?? []).map((raw) => ({
                _id: String(raw._id),
                id: String(raw.id),
                title: String(raw.title ?? ''),
                metadata: (raw.metadata ?? null) as Record<string, unknown> | null,
                _creationTime: raw._creationTime,
            })),
        [threadsData],
    );

    // Map TanStack Query state to the old interface for minimal component changes
    // Old: 'LoadingFirstPage' | 'CanLoadMore' | 'Exhausted' | 'LoadingMore'
    const status = useMemo(() => {
        if (queryStatus === 'pending') return 'LoadingFirstPage' as const;
        if (hasNextPage && isFetchingNextPage) return 'LoadingMore' as const;
        if (hasNextPage) return 'CanLoadMore' as const;
        return 'Exhausted' as const;
    }, [queryStatus, hasNextPage, isFetchingNextPage]);

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

        await deleteThreadMut.mutateAsync({
            threadId: threadToDelete.id,
            guestId: guestId ? String(guestId) : undefined,
        });

        // If we deleted the active thread, navigate home
        if (currentThreadId === threadToDelete.id) {
            router.push('/');
        }

        setThreadToDelete(null);
    }, [threadToDelete, deleteThreadMut, guestId, currentThreadId, router]);

    // Cancel deletion
    const cancelDelete = useCallback(() => {
        setThreadToDelete(null);
    }, []);

    // Load next page
    const loadMoreThreads = useCallback(() => {
        void fetchNextPage();
    }, [fetchNextPage]);

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
