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
import { Logo } from '@/components/ui/logo';
import { NavUser } from '@/components/navigation/NavUser';
import { SidebarToolbar } from '@/components/navigation/SidebarToolbar';
import { ThreadsSidebarGroup } from '@/components/threads/ThreadsSidebarGroup';
import { Button } from '@/components/ui/button';
import { SquarePen } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

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
                <SidebarMenuButton size='lg' className='gap-4 [&>svg]:size-5' onClick={handleClick}>
                    <Logo className='size-10 shrink-0' width={20} aria-label='לוגו' />
                    <div className='grid flex-1 text-right text-sm leading-tight'>
                        <span className='truncate font-semibold'>Data Israel</span>
                        <span className='truncate text-xs text-muted-foreground'>סוכני המידע הציבורי של ישראל</span>
                    </div>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}

/**
 * Floating logo button visible only when the sidebar is closed.
 * Navigates to the landing page on click.
 * Must be rendered inside SidebarProvider.
 */
function HomeLogoButton() {
    const router = useRouter();
    const pathname = usePathname();
    const { open, isMobile, openMobile } = useSidebar();

    const isOpen = isMobile ? openMobile : open;
    const isLanding = pathname === '/';

    if (isOpen || isLanding) return null;

    return (
        <Button
            variant='outline'
            size='icon'
            className='rounded-2xl size-8 md:size-10 bg-background'
            onClick={() => router.push('/')}
            aria-label='חזרה לדף הבית'
        >
            <Logo className='size-5' />
        </Button>
    );
}

/**
 * Floating new-thread button visible only when sidebar is closed and not on landing page.
 * Must be rendered inside SidebarProvider.
 */
function NewThreadButton() {
    const router = useRouter();
    const pathname = usePathname();
    const { open, isMobile, openMobile } = useSidebar();

    const isOpen = isMobile ? openMobile : open;
    const isLanding = pathname === '/';

    if (isOpen || isLanding) return null;

    const handleClick = () => {
        const newId = crypto.randomUUID();
        router.push(`/chat/${newId}?new`);
    };

    return (
        <Button
            variant='outline'
            size='icon'
            className='rounded-2xl size-8 md:size-10 bg-background'
            onClick={handleClick}
            aria-label='שיחה חדשה'
        >
            <SquarePen className='size-4 md:size-5' />
        </Button>
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
                <div className='absolute top-3 right-4 md:top-4 md:right-5 z-30 flex items-center gap-2 md:gap-4 [&>button]:shadow-md'>
                    <HomeLogoButton />
                    <NewThreadButton />
                    <SidebarTrigger className='rounded-2xl' />
                </div>
                <div className='flex flex-1 min-h-0 @container/main overflow-hidden flex-col'>{children}</div>
            </SidebarInset>
        </SidebarProvider>
    );
}
