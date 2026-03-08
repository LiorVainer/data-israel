'use client';

import { useState, useRef, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

import { useUser } from '@/context/UserContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLongPress } from '@/hooks/use-long-press';
import { formatCreationTime } from '@/lib/date';
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';
import { MoreHorizontal, Edit3, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface ThreadItemProps {
    thread: {
        _id: string;
        id: string;
        title: string;
        metadata: Record<string, unknown> | null;
        _creationTime: number;
    };
    isActive: boolean;
    onSelect: (threadId: string) => void;
    onDelete: (thread: ThreadItemProps['thread']) => void;
}

export function ThreadItem({ thread, isActive, onSelect, onDelete }: ThreadItemProps) {
    const { guestId } = useUser();
    const isMobile = useIsMobile();
    const renameMutation = useMutation(api.threads.renameThread);

    // Rename state
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState(thread.title || '');
    const inputRef = useRef<HTMLInputElement>(null);

    // Dropdown state (controlled for mobile long-press)
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Long-press for mobile
    const longPress = useLongPress(
        useCallback(() => setDropdownOpen(true), []),
        500,
    );

    const handleRenameConfirm = async () => {
        const trimmed = renameValue.trim();
        if (!trimmed || trimmed === thread.title) {
            setIsRenaming(false);
            return;
        }
        try {
            await renameMutation({
                threadId: thread.id,
                newTitle: trimmed,
                guestId: guestId ?? undefined,
            });
            toast.success('שם השיחה עודכן');
        } catch {
            toast.error('שגיאה בשינוי שם השיחה');
            setRenameValue(thread.title || '');
        }
        setIsRenaming(false);
    };

    const handleRenameCancel = () => {
        setRenameValue(thread.title || '');
        setIsRenaming(false);
    };

    const startRename = () => {
        setRenameValue(thread.title || '');
        setIsRenaming(true);
        setDropdownOpen(false);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const startDelete = () => {
        setDropdownOpen(false);
        onDelete(thread);
    };

    const handleClick = () => {
        if (longPress.isLongPressRef.current) return;
        if (isRenaming) return;
        onSelect(thread.id);
    };

    const timeAgo = formatCreationTime(thread._creationTime);

    // Inline rename mode
    if (isRenaming) {
        return (
            <SidebarMenuItem>
                <div className='flex items-center gap-1 px-2 py-1.5'>
                    <Input
                        ref={inputRef}
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameConfirm();
                            if (e.key === 'Escape') handleRenameCancel();
                        }}
                        className='h-7 text-sm'
                    />
                    <Button size='icon' variant='ghost' className='size-7 shrink-0' onClick={handleRenameConfirm}>
                        <Check className='size-3.5' />
                    </Button>
                    <Button size='icon' variant='ghost' className='size-7 shrink-0' onClick={handleRenameCancel}>
                        <X className='size-3.5' />
                    </Button>
                </div>
            </SidebarMenuItem>
        );
    }

    // Normal display mode
    return (
        <SidebarMenuItem onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
            <SidebarMenuButton
                onClick={handleClick}
                isActive={isActive}
                tooltip={thread.title || 'שיחה ללא כותרת'}
                className='h-auto py-2'
                {...(isMobile ? longPress : {})}
            >
                <div className='flex flex-col flex-1 min-w-0 gap-0.5'>
                    <span className='truncate text-sm'>{thread.title || 'שיחה ללא כותרת'}</span>
                    <span className='text-xs text-muted-foreground truncate'>{timeAgo}</span>
                </div>
            </SidebarMenuButton>

            {/* Desktop hover "..." button + dropdown */}
            {!isMobile && (
                <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: isHovered || dropdownOpen ? 1 : 0 }}
                            className='absolute left-2 top-1/2 -translate-y-1/2'
                        >
                            <Button size='icon' variant='ghost' className='size-7'>
                                <MoreHorizontal className='size-4' />
                            </Button>
                        </motion.div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='start' side='bottom'>
                        <DropdownMenuItem onClick={startRename}>
                            <Edit3 className='size-4' />
                            <span>שנה שם שיחה</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={startDelete} className='text-destructive focus:text-destructive'>
                            <Trash2 className='size-4' />
                            <span>מחק שיחה</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}

            {/* Mobile long-press dropdown (hidden trigger, controlled open) */}
            {isMobile && (
                <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                    <DropdownMenuTrigger className='sr-only' />
                    <DropdownMenuContent align='start' side='bottom'>
                        <DropdownMenuItem onClick={startRename}>
                            <Edit3 className='size-4' />
                            <span>שנה שם שיחה</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={startDelete} className='text-destructive focus:text-destructive'>
                            <Trash2 className='size-4' />
                            <span>מחק שיחה</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </SidebarMenuItem>
    );
}
