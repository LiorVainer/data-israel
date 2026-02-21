'use client';

import { useState } from 'react';
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ThreadDeleteModalProps {
    thread: {
        _id: string;
        id: string;
        title: string;
        _creationTime: number;
    };
    onConfirm: () => Promise<void>;
}

export function ThreadDeleteModal({ thread, onConfirm }: ThreadDeleteModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirm = async () => {
        setIsDeleting(true);
        toast.promise(onConfirm(), {
            loading: 'מוחק שיחה...',
            success: 'השיחה נמחקה בהצלחה',
            error: 'שגיאה במחיקת השיחה',
        });
    };

    return (
        <DialogContent className='sm:max-w-sm text-center' showCloseButton={false}>
            <DialogHeader className='items-center'>
                <DialogTitle className='text-base'>מחיקת שיחה</DialogTitle>
                <DialogDescription>
                    {thread.title ? (
                        <span className='line-clamp-2'>&ldquo;{thread.title}&rdquo;</span>
                    ) : (
                        'כל ההודעות יימחקו לצמיתות.'
                    )}
                </DialogDescription>
            </DialogHeader>
            <div className='flex flex-col gap-2 pt-2'>
                <Button variant='destructive' onClick={handleConfirm} disabled={isDeleting}>
                    מחק שיחה
                </Button>
                <DialogClose asChild>
                    <Button variant='ghost' disabled={isDeleting}>
                        ביטול
                    </Button>
                </DialogClose>
            </div>
        </DialogContent>
    );
}
