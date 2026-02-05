'use client';

import { useIsMobile } from '@/hooks/use-mobile';
import { SquarePen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SidebarGroup, SidebarMenu, SidebarMenuButton, useSidebar } from '@/components/ui/sidebar';

export function SidebarToolbar() {
    const router = useRouter();
    const { toggleSidebar, state } = useSidebar();
    const isMobile = useIsMobile();

    const hideContent = state === 'collapsed';

    const handleNewChat = () => {
        if (isMobile) {
            toggleSidebar();
        }
        const newId = crypto.randomUUID();
        router.push(`/chat/${newId}`);
    };

    if (hideContent) return null;

    return (
        <SidebarGroup className='w-full'>
            <SidebarMenu>
                <SidebarMenuButton onClick={handleNewChat}>
                    <SquarePen size={16} />
                    שיחה חדשה
                </SidebarMenuButton>
            </SidebarMenu>
        </SidebarGroup>
    );
}
