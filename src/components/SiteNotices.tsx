'use client';

import { useId, useState } from 'react';
import { Info } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLocalStorage } from '@/hooks/use-local-storage';

const HIDE_KEY = 'site-notice-hidden';

/**
 * Site-wide dismissible notice dialog (beta status + IDF service).
 * Shows every page enter unless the user opts out via "don't show again".
 * To remove entirely, delete or comment out the usages.
 */
export function SiteNotices() {
    const [hidden, setHidden] = useLocalStorage(HIDE_KEY, false);
    const [open, setOpen] = useState(!hidden);
    const [dontShow, setDontShow] = useState(false);
    const checkboxId = useId();

    function handleDismiss() {
        if (dontShow) {
            setHidden(true);
        }
        setOpen(false);
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                if (!v) handleDismiss();
            }}
        >
            <DialogContent dir='rtl' className='max-w-[calc(100%-2rem)] gap-5 sm:max-w-md text-right'>
                <DialogHeader className='gap-3'>
                    <DialogTitle className='flex items-center gap-2 text-base'>
                        <Info className='h-4 w-4 text-muted-foreground' />
                        <span>הודעה למשתמשים</span>
                    </DialogTitle>
                    <DialogDescription asChild>
                        <div className='flex flex-col gap-3 text-sm leading-relaxed text-right'>
                            <p>
                                האתר נמצא כעת בשלבי השקה ראשוניים (Beta), ולכן ייתכנו תקלות, באגים או חוסרים מסוימים
                                בחוויית השימוש.
                            </p>
                            <p>
                                האתר מפותח ומתוחזק בהתנדבות על ידי מפתח יחיד, ובמקביל לשירות צבאי פעיל. בשל כך, ייתכן
                                שזמן הטיפול בתקלות או בפניות יהיה ארוך מהרגיל.
                            </p>
                            <p>
                                נעשים מאמצים שוטפים לשפר, לתקן ולהוסיף פיצ&apos;רים, והסבלנות וההבנה של המשתמשים מוערכות
                                מאוד 🙏
                            </p>
                        </div>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className='flex-col gap-3 sm:flex-col'>
                    <label
                        htmlFor={checkboxId}
                        className='flex cursor-pointer items-center gap-2 text-xs text-muted-foreground select-none'
                    >
                        <input
                            id={checkboxId}
                            type='checkbox'
                            checked={dontShow}
                            onChange={(e) => setDontShow(e.target.checked)}
                            className='accent-primary h-3.5 w-3.5 rounded'
                        />
                        אל תציגו לי שוב
                    </label>
                    <Button
                        variant='secondary'
                        size='sm'
                        className='w-full sm:w-auto sm:self-end'
                        onClick={handleDismiss}
                    >
                        הבנתי, תודה!
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
