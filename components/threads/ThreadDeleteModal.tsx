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
        <DialogContent>
            <DialogHeader>
                <DialogTitle>מחיקת שיחה</DialogTitle>
                <DialogDescription>פעולה זו אינה ניתנת לביטול</DialogDescription>
            </DialogHeader>
            <p className='text-sm text-muted-foreground'>האם למחוק שיחה זו? כל ההודעות יימחקו לצמיתות.</p>
            {thread.title && <p className='text-sm font-medium truncate'>&ldquo;{thread.title}&rdquo;</p>}
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant='outline' disabled={isDeleting}>
                        ביטול
                    </Button>
                </DialogClose>
                <Button variant='destructive' onClick={handleConfirm} disabled={isDeleting}>
                    מחק שיחה
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}
