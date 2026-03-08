'use client';

import { useState } from 'react';
import {
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogCancel,
    AlertDialogAction,
} from '@/components/ui/alert-dialog';
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
        <AlertDialogContent size='sm'>
            <AlertDialogHeader className='items-center'>
                <AlertDialogTitle className='text-base'>מחיקת שיחה</AlertDialogTitle>
                <AlertDialogDescription>
                    {thread.title ? (
                        <span className='line-clamp-2'>&ldquo;{thread.title}&rdquo;</span>
                    ) : (
                        'כל ההודעות יימחקו לצמיתות.'
                    )}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className='flex flex-col gap-2 pt-2'>
                <AlertDialogAction variant='destructive' onClick={handleConfirm} disabled={isDeleting}>
                    מחק שיחה
                </AlertDialogAction>
                <AlertDialogCancel variant='ghost' disabled={isDeleting}>
                    ביטול
                </AlertDialogCancel>
            </div>
        </AlertDialogContent>
    );
}
