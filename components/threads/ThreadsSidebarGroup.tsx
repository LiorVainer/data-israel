'use client';

import { api } from '@/convex/_generated/api';
import { useUser } from '@/context/UserContext';
import { Id } from '@/convex/_generated/dataModel';
import { usePaginatedQuery } from 'convex/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSkeleton,
    useSidebar,
} from '@/components/ui/sidebar';
import { Plus } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

const THREADS_PAGE_SIZE = 10;

/**
 * ThreadsSidebarGroup component displays the list of chat threads in the sidebar.
 * Uses Convex paginated query for efficient loading with infinite scroll.
 *
 * For authenticated users, resourceId is resolved via ctx.auth.getUserIdentity().
 * For guests, the guestId is passed explicitly.
 */
export function ThreadsSidebarGroup() {
    const { guestId, isAuthenticated, isCreatingGuest } = useUser();
    const { state, isMobile, setOpenMobile } = useSidebar();
    const router = useRouter();
    const pathname = usePathname();

    const hideContent = state === 'collapsed';

    // Skip query while guest session is being created
    const shouldSkipQuery = !isAuthenticated && isCreatingGuest;

    const {
        results: threads,
        status,
        loadMore,
    } = usePaginatedQuery(
        api.threads.listUserThreadsPaginated,
        shouldSkipQuery ? 'skip' : { guestId: (guestId as Id<'guests'>) || undefined },
        { initialNumItems: THREADS_PAGE_SIZE },
    );

    // Get current thread ID from pathname if on a chat page
    const currentThreadId = pathname?.startsWith('/chat/') ? pathname.split('/chat/')[1] : null;

    const handleThreadSelect = (threadId: string) => {
        if (currentThreadId === threadId) return;

        router.push(`/chat/${threadId}`);
        if (isMobile) {
            setOpenMobile(false);
        }
    };

    const noData = !threads || threads.length === 0;

    // Loading state
    if (status === 'LoadingFirstPage') {
        return (
            <SidebarGroup>
                <SidebarGroupLabel>שיחות</SidebarGroupLabel>
                <SidebarMenu>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <SidebarMenuItem key={i}>
                            <SidebarMenuSkeleton showIcon />
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroup>
        );
    }

    // Empty state
    if (noData) {
        return (
            <SidebarGroup>
                <SidebarGroupLabel>שיחות</SidebarGroupLabel>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton className='justify-center border border-dashed border-sidebar-border'>
                            <Plus className='size-4' />
                            {!hideContent && <span>אין שיחות עדיין</span>}
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>
        );
    }

    if (hideContent) return null;

    return (
        <SidebarGroup>
            <SidebarGroupLabel>שיחות</SidebarGroupLabel>
            <SidebarMenu>
                {threads.map((thread) => {
                    const isActive = currentThreadId === thread.id;
                    const timeAgo = formatDistanceToNow(new Date(thread._creationTime), {
                        addSuffix: true,
                        locale: he,
                    });

                    return (
                        <SidebarMenuItem key={thread._id}>
                            <SidebarMenuButton
                                onClick={() => handleThreadSelect(thread.id)}
                                isActive={isActive}
                                tooltip={thread.title || 'שיחה ללא כותרת'}
                                className='h-auto py-2'
                            >
                                {/*<MessageSquare className='size-4 shrink-0' />*/}
                                <div className='flex flex-col flex-1 min-w-0 gap-0.5'>
                                    <span className='truncate text-sm'>{thread.title || 'שיחה ללא כותרת'}</span>
                                    {/*<span className='text-xs text-muted-foreground truncate'>{timeAgo}</span>*/}
                                </div>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}

                {status === 'CanLoadMore' && (
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={() => loadMore(THREADS_PAGE_SIZE)}
                            className='justify-center text-muted-foreground'
                        >
                            <span className='text-xs'>טען עוד שיחות</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )}

                {status === 'LoadingMore' && (
                    <SidebarMenuItem>
                        <SidebarMenuSkeleton showIcon />
                    </SidebarMenuItem>
                )}
            </SidebarMenu>
        </SidebarGroup>
    );
}
