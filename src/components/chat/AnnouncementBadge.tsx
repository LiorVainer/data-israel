'use client';

import { type ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface AnnouncementBadgeProps {
    text: string;
    label?: string;
    learnMoreText?: string;
    /** Content shown inside the Dialog (desktop) / Drawer (mobile) when the badge is clicked. */
    details?: ReactNode;
    /** Title for the modal — defaults to `text`. */
    dialogTitle?: string;
    /** Optional subtitle shown below the title in the modal header. */
    dialogDescription?: string;
    /** Called when the badge is clicked, regardless of whether a modal opens. */
    onClick?: () => void;
    className?: string;
}

const motionProps = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay: 0.1, ease: [0.25, 0.4, 0.25, 1] as const },
};

const baseClassName =
    'flex justify-between items-center gap-6 rounded-full bg-foreground/5 ps-2.5 pe-4 md:pe-2.5 py-2 ring-1 ring-foreground/10 backdrop-blur dark:bg-white/10 dark:ring-white/15 w-fit';

function AnnouncementDetails({ children }: { children: ReactNode }) {
    return (
        <ScrollArea className='flex-1 overflow-y-auto' style={{ maxHeight: 'calc(80vh - 80px)' }}>
            <div className='px-4 py-4 text-sm leading-relaxed text-foreground/80'>{children}</div>
        </ScrollArea>
    );
}

export function AnnouncementBadge({
    text,
    label,
    learnMoreText = 'למידע נוסף',
    details,
    dialogTitle,
    dialogDescription,
    onClick,
    className,
}: AnnouncementBadgeProps) {
    const [open, setOpen] = useState(false);
    const isMobile = useIsMobile();

    const isInteractive = Boolean(onClick ?? details);

    const handleClick = () => {
        onClick?.();
        if (details) setOpen(true);
    };

    const badgeContent = (
        <>
            <div className='flex items-center gap-2'>
                {label && (
                    <div className='flex items-center gap-1 rounded-full bg-primary px-3 py-1 font-sans text-xs font-medium text-primary-foreground'>
                        <Sparkles className='h-3 w-3' />
                        {label}
                    </div>
                )}
                <span className='font-sans text-sm font-medium text-foreground/90'>{text}</span>
            </div>
            {isInteractive && (
                <span className='hidden items-center gap-1 font-sans text-xs font-medium underline text-primary transition-colors group-hover:text-primary/80 md:inline-flex'>
                    {learnMoreText}
                    <ArrowLeft className='size-3' />
                </span>
            )}
        </>
    );

    const modalTitle = dialogTitle ?? text;

    const modal = details ? (
        isMobile ? (
            <Drawer open={open} onOpenChange={setOpen}>
                <DrawerContent className='max-h-[85vh]'>
                    <DrawerHeader className='border-b'>
                        <DrawerTitle>{modalTitle}</DrawerTitle>
                        {dialogDescription && (
                            <DrawerDescription className='text-xs text-muted-foreground'>
                                {dialogDescription}
                            </DrawerDescription>
                        )}
                    </DrawerHeader>
                    <AnnouncementDetails>{details}</AnnouncementDetails>
                </DrawerContent>
            </Drawer>
        ) : (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent
                    className='flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-lg'
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <DialogHeader className='border-b px-4 pb-3 pt-4'>
                        <DialogTitle>{modalTitle}</DialogTitle>
                        {dialogDescription && (
                            <DialogDescription className='text-xs text-muted-foreground'>
                                {dialogDescription}
                            </DialogDescription>
                        )}
                    </DialogHeader>
                    <AnnouncementDetails>{details}</AnnouncementDetails>
                </DialogContent>
            </Dialog>
        )
    ) : null;

    return (
        <>
            {isInteractive ? (
                <motion.button
                    type='button'
                    onClick={handleClick}
                    {...motionProps}
                    className={cn(baseClassName, 'group cursor-pointer text-start', className)}
                >
                    {badgeContent}
                </motion.button>
            ) : (
                <motion.div {...motionProps} className={cn(baseClassName, className)}>
                    {badgeContent}
                </motion.div>
            )}
            {modal}
        </>
    );
}
