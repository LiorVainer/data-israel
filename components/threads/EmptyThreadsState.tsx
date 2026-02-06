import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Plus } from 'lucide-react';

interface EmptyThreadsStateProps {
    hideContent?: boolean;
}

export function EmptyThreadsState({ hideContent }: EmptyThreadsStateProps) {
    return (
        <SidebarGroup>
            <SidebarGroupLabel>שיחות</SidebarGroupLabel>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton className='justify-center border border-dashed border-sidebar-border'>
                        <Plus className='size-4' />
                        {!hideContent && <span>אין שיחות עדיין</span>}
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarGroup>
    );
}
