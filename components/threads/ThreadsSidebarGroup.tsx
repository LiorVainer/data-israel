'use client';

import { useThreadsData } from '@/hooks/use-threads-data';
import { ThreadItem } from '@/components/threads/ThreadItem';
import { ThreadDeleteModal } from '@/components/threads/ThreadDeleteModal';
import { EmptyThreadsState } from '@/components/threads/EmptyThreadsState';
import { Dialog } from '@/components/ui/dialog';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSkeleton,
    useSidebar,
} from '@/components/ui/sidebar';

export function ThreadsSidebarGroup() {
    const { state, isMobile } = useSidebar();
    const hideContent = !isMobile && state === 'collapsed';

    const {
        threads,
        status,
        currentThreadId,
        threadToDelete,
        handleThreadSelect,
        handleDelete,
        confirmDelete,
        cancelDelete,
        loadMoreThreads,
    } = useThreadsData();

    const isLoadingFirstPage = status === 'LoadingFirstPage';
    const isEmpty = !threads || threads.length === 0;

    // Loading state
    if (isLoadingFirstPage && isEmpty) {
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
    if (!threads || threads.length === 0) {
        return <EmptyThreadsState hideContent={hideContent} />;
    }

    if (hideContent) return null;

    return (
        <>
            <SidebarGroup>
                <SidebarGroupLabel>שיחות</SidebarGroupLabel>
                <SidebarMenu>
                    {threads.map((thread) => (
                        <ThreadItem
                            key={thread._id}
                            thread={thread}
                            isActive={currentThreadId === thread.id}
                            onSelect={handleThreadSelect}
                            onDelete={handleDelete}
                        />
                    ))}

                    {status === 'CanLoadMore' && (
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                onClick={loadMoreThreads}
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

            {/* Delete confirmation dialog */}
            <Dialog
                open={threadToDelete !== null}
                onOpenChange={(open) => {
                    if (!open) cancelDelete();
                }}
            >
                {threadToDelete && <ThreadDeleteModal thread={threadToDelete} onConfirm={confirmDelete} />}
            </Dialog>
        </>
    );
}
