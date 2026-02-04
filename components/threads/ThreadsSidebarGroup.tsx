'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@/context/UserContext';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarMenuSkeleton,
    useSidebar,
} from '@/components/ui/sidebar';
import { MessageSquare, Plus } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

/**
 * ThreadsSidebarGroup component displays the list of chat threads in the sidebar.
 * Uses Convex real-time query for live updates when threads change.
 */
export function ThreadsSidebarGroup() {
    const { isAuthenticated, sessionId } = useUser();
    const { state } = useSidebar();
    const router = useRouter();
    const pathname = usePathname();

    // Build resourceId for thread filtering
    // For authenticated users, Convex auth provides the user identity
    // For guests, we use the session ID
    const resourceId = isAuthenticated ? 'authenticated' : `guest:${sessionId}`;

    // Query threads with real-time updates
    const threads = useQuery(api.threads.listUserThreads, { resourceId });

    const hideContent = state === 'collapsed';

    // Get current thread ID from pathname if on a chat page
    const currentThreadId = pathname?.startsWith('/chat/')
        ? pathname.split('/chat/')[1]
        : null;

    const handleThreadSelect = (threadId: string) => {
        router.push(`/chat/${threadId}`);
    };

    const handleNewChat = () => {
        // Generate new UUID for new chat
        const newId = crypto.randomUUID();
        router.push(`/chat/${newId}`);
    };

    // Loading state
    if (threads === undefined) {
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
    if (threads.length === 0) {
        return (
            <SidebarGroup>
                <SidebarGroupLabel>שיחות</SidebarGroupLabel>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={handleNewChat}
                            className='justify-center border border-dashed border-sidebar-border'
                        >
                            <Plus className='size-4' />
                            {!hideContent && <span>התחל שיחה חדשה</span>}
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>
        );
    }

    return (
        <SidebarGroup>
            <SidebarGroupLabel>שיחות</SidebarGroupLabel>
            <SidebarMenu>
                {/* New Chat Button */}
                <SidebarMenuItem>
                    <SidebarMenuButton
                        onClick={handleNewChat}
                        tooltip='שיחה חדשה'
                        className='mb-2'
                    >
                        <Plus className='size-4' />
                        {!hideContent && <span>שיחה חדשה</span>}
                    </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Thread List */}
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
                            >
                                <MessageSquare className='size-4 shrink-0' />
                                {!hideContent && (
                                    <div className='flex flex-col flex-1 min-w-0 gap-0.5'>
                                        <span className='truncate text-sm'>
                                            {thread.title || 'שיחה ללא כותרת'}
                                        </span>
                                        <span className='text-xs text-muted-foreground truncate'>
                                            {timeAgo}
                                        </span>
                                    </div>
                                )}
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
