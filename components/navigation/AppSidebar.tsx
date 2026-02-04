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
import { Separator } from '@/components/ui/separator';
import { Database, Sparkles } from 'lucide-react';
import { NavUser } from '@/components/navigation/NavUser';
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
        <SidebarProvider className='h-full'>
            <Sidebar collapsible='icon' side='right' className='h-full'>
                <SidebarHeader>
                    {/* App Logo / Brand */}
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                size='lg'
                                onClick={() => router.push('/')}
                                className='cursor-pointer'
                            >
                                <div className='bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
                                    <Database className='size-4' />
                                </div>
                                <div className='grid flex-1 text-right text-sm leading-tight'>
                                    <span className='truncate font-semibold'>
                                        סוכן המידע הציבורי
                                    </span>
                                    <span className='truncate text-xs text-muted-foreground'>
                                        data.gov.il
                                    </span>
                                </div>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>

                <SidebarContent className='overflow-hidden'>
                    <div className='overflow-y-auto h-full'>
                        <ThreadsSidebarGroup />
                    </div>
                </SidebarContent>

                <SidebarFooter>
                    <NavUser />
                </SidebarFooter>

                <SidebarRail />
            </Sidebar>

            <SidebarInset className='overflow-hidden min-h-0 h-full'>
                <header className='flex top-0 z-30 bg-sidebar h-14 min-h-0 shrink-0 items-center justify-between w-full gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 px-4 border-b'>
                    <div className='flex items-center gap-2 min-h-0'>
                        <SidebarTrigger className='-mr-1' />
                        <Separator orientation='vertical' className='ml-2 h-4' />
                        <div className='flex items-center gap-2'>
                            <Sparkles className='size-4 text-primary' />
                            <span className='text-sm font-medium'>
                                חקור נתונים ציבוריים
                            </span>
                        </div>
                    </div>
                </header>
                <div className='flex h-full @container/main overflow-hidden flex-col'>
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
