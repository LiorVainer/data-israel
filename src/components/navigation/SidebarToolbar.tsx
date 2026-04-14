'use client';

import { SquarePen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SidebarGroup, SidebarMenu, useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

export function SidebarToolbar() {
    const router = useRouter();
    const { toggleSidebar, state, isMobile } = useSidebar();

    const hideContent = !isMobile && state === 'collapsed';

    const handleNewChat = () => {
        if (isMobile) {
            toggleSidebar();
        }
        const newId = crypto.randomUUID();
        router.push(`/chat/${newId}?new`);
    };

    if (hideContent) return null;

    return (
        <SidebarGroup className='w-full'>
            <SidebarMenu>
                <Button onClick={handleNewChat}>
                    <SquarePen size={16} />
                    שיחה חדשה
                </Button>
            </SidebarMenu>
        </SidebarGroup>
    );
}
