import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';

interface EmptyThreadsStateProps {
    hideContent?: boolean;
}

export function EmptyThreadsState({ hideContent }: EmptyThreadsStateProps) {
    return (
        <SidebarGroup>
            <SidebarGroupLabel>שיחות</SidebarGroupLabel>
            <SidebarMenu>
                <SidebarMenuItem>
                    {!hideContent && <span className='text-xs p-2 text-muted-foreground'>אין שיחות עדיין</span>}
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarGroup>
    );
}
