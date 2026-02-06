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
} from '@/components/ui/sidebar';
import Image from 'next/image';
import { NavUser } from '@/components/navigation/NavUser';
import { SidebarToolbar } from '@/components/navigation/SidebarToolbar';
import { ThreadsSidebarGroup } from '@/components/threads/ThreadsSidebarGroup';
import { useRouter } from 'next/navigation';

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
    const router = useRouter();

    return (
        <SidebarProvider defaultOpen={false} className='h-dvh'>
            <Sidebar collapsible='offcanvas' side='right' className='h-full'>
                <SidebarHeader>
                    {/* App Logo / Brand */}
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton size='lg' className='gap-4' onClick={() => router.push('/')}>
                                <Image
                                    src='/data-israel.svg'
                                    alt='לוגו'
                                    width={24}
                                    height={24}
                                    className='size-7 shrink-0'
                                />
                                <div className='grid flex-1 text-right text-sm leading-tight'>
                                    <span className='truncate font-semibold'>סוכן המידע הציבורי</span>
                                    <span className='truncate text-xs text-muted-foreground'>data.gov.il</span>
                                </div>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
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
                <SidebarTrigger className='absolute top-3 right-3 z-30' />
                <div className='flex flex-1 min-h-0 @container/main overflow-hidden flex-col'>{children}</div>
            </SidebarInset>
        </SidebarProvider>
    );
}
