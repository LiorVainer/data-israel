'use client';

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { SignedIn, SignedOut, useClerk } from '@clerk/nextjs';
import { ChevronsUpDown, LogOut, LucideLogIn, Moon, Sun } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import * as React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import Link from 'next/link';


/**
 * NavUser component for the sidebar footer.
 * Shows user info for authenticated users or a sign-in link for guests.
 * Includes dropdown menu with account settings and theme toggle.
 */
export function NavUser() {
    const { user, openUserProfile, signOut } = useClerk();
    const isMobile = useIsMobile();
    const { setOpen, setOpenMobile } = useSidebar();

    const closeSidebar = React.useCallback(() => {
        if (isMobile) {
            setOpenMobile(false);
        } else {
            setOpen(false);
        }
    }, [isMobile, setOpen, setOpenMobile]);
    const [isDarkMode, setIsDarkMode] = React.useState(false);

    // Check initial dark mode state
    React.useEffect(() => {
        setIsDarkMode(document.documentElement.classList.contains('dark'));
    }, []);

    const toggleTheme = React.useCallback(() => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        if (newMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    return (
        <SidebarMenu>
            <SignedOut>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip={isDarkMode ? 'מצב בהיר' : 'מצב כהה'} onClick={toggleTheme}>
                        {isDarkMode ? <Sun /> : <Moon />}
                        <span>{isDarkMode ? 'מצב בהיר' : 'מצב כהה'}</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip='התחברות' onClick={closeSidebar}>
                        <Link href='/sign-in'>
                            <LucideLogIn />
                            <span>התחברות</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SignedOut>

            <SignedIn>
                {user && (
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size='lg'
                                    className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                                >
                                    <Avatar className='h-8 w-8 rounded-lg'>
                                        <AvatarImage src={user.imageUrl} alt={user.fullName ?? 'תמונת משתמש'} />
                                        <AvatarFallback className='rounded-lg'>
                                            {`${user.firstName?.at(0) ?? ''}${user.lastName?.at(0) ?? ''}`}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className='grid flex-1 text-right text-sm leading-tight'>
                                        <span className='truncate font-semibold'>{user.fullName}</span>
                                        <span className='truncate text-xs'>
                                            {user.primaryEmailAddress?.emailAddress}
                                        </span>
                                    </div>
                                    <ChevronsUpDown className='mr-auto size-4' />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className='w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg'
                                side={isMobile ? 'bottom' : 'left'}
                                align='end'
                                sideOffset={4}
                            >
                                <DropdownMenuLabel className='p-0 font-normal'>
                                    <div className='flex items-center gap-2 px-1 py-1.5 text-right text-sm'>
                                        <div className='grid flex-1 text-right text-sm leading-tight'>
                                            <span className='truncate font-semibold'>{user.fullName}</span>
                                            <span className='truncate text-xs'>
                                                {user.primaryEmailAddress?.emailAddress}
                                            </span>
                                        </div>
                                        <Avatar className='h-8 w-8 rounded-lg'>
                                            <AvatarFallback className='rounded-lg'>
                                                {`${user.firstName?.at(0) ?? ''}${user.lastName?.at(0) ?? ''}`}
                                            </AvatarFallback>
                                            <AvatarImage src={user.imageUrl} alt={user.fullName ?? 'תמונת משתמש'} />
                                        </Avatar>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    {/*<DropdownMenuItem className='cursor-pointer' onClick={() => openUserProfile()}>*/}
                                    {/*    <BadgeCheck />*/}
                                    {/*    חשבון*/}
                                    {/*</DropdownMenuItem>*/}
                                    <DropdownMenuItem className='cursor-pointer' onClick={toggleTheme}>
                                        {isDarkMode ? <Sun /> : <Moon />}
                                        {isDarkMode ? 'מצב בהיר' : 'מצב כהה'}
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className='cursor-pointer' onClick={() => signOut()}>
                                    <LogOut />
                                    התנתקות
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                )}
            </SignedIn>
        </SidebarMenu>
    );
}
