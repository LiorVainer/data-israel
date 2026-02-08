'use client';

import * as React from 'react';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarRail,
    SidebarTrigger,
    useSidebar,
} from '@/components/ui/sidebar';
import Image from 'next/image';
import { NavUser } from '@/components/navigation/NavUser';
import { SidebarToolbar } from '@/components/navigation/SidebarToolbar';
import { ThreadsSidebarGroup } from '@/components/threads/ThreadsSidebarGroup';
import { useRouter } from 'next/navigation';

/**
 * Logo button that navigates home and closes the sidebar.
 * Must be rendered inside SidebarProvider to access useSidebar.
 */
function SidebarLogo() {
    const router = useRouter();
    const { setOpen, isMobile, setOpenMobile } = useSidebar();

    const handleClick = () => {
        router.push('/');
        if (isMobile) {
            setOpenMobile(false);
        } else {
            setOpen(false);
        }
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton size='lg' className='gap-4' onClick={handleClick}>
                    <Image src='/data-israel.svg' alt='לוגו' width={24} height={24} className='size-7 shrink-0' />
                    <div className='grid flex-1 text-right text-sm leading-tight'>
                        <span className='truncate font-semibold'>סוכן המידע הציבורי</span>
                        <span className='truncate text-xs text-muted-foreground'>data.gov.il</span>
                    </div>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}

/**
 * AppSidebar component wraps the main application layout with a collapsible sidebar.
 * Provides navigation, thread list, and user profile sections.
 * Supports RTL layout for Hebrew interface.
 */
export function AppSidebar({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <SidebarProvider defaultOpen={false} className='h-dvh'>
            <Sidebar collapsible='offcanvas' side='right' className='h-full'>
                <SidebarHeader>
                    <SidebarLogo />
                </SidebarHeader>

                <SidebarContent className='overflow-hidden'>
                    <SidebarToolbar />
                    <div className='overflow-y-auto h-full'>
                        <ThreadsSidebarGroup />
                    </div>
                </SidebarContent>

                <SidebarFooter>
                    <NavUser />
                </SidebarFooter>

                <SidebarRail />
            </Sidebar>

            <SidebarInset className='overflow-hidden min-h-0 h-full relative'>
                <SidebarTrigger className='absolute top-3 right-4 md:top-4 md:right-5 z-30' />
                <div className='flex flex-1 min-h-0 @container/main overflow-hidden flex-col'>{children}</div>
            </SidebarInset>
        </SidebarProvider>
    );
}
