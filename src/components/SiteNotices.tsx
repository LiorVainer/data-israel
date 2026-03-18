'use client';

import { useState, useEffect, useId } from 'react';
import { Info } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const HIDE_KEY = 'site-notice-hidden';

/**
 * Site-wide dismissible notice dialog (beta status + IDF service).
 * Shows every page enter unless the user opts out via "don't show again".
 * To remove entirely, delete or comment out the usages.
 */
export function SiteNotices() {
    const [open, setOpen] = useState(false);
    const [dontShow, setDontShow] = useState(false);
    const checkboxId = useId();

    useEffect(() => {
        const hidden = localStorage.getItem(HIDE_KEY);
        if (hidden !== '1') {
            setOpen(true);
        }
    }, []);

    function handleDismiss() {
        if (dontShow) {
            localStorage.setItem(HIDE_KEY, '1');
        }
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
            <DialogContent dir='rtl' className='max-w-[calc(100%-2rem)] gap-5 sm:max-w-md text-right'>
                <DialogHeader className='gap-3'>
                    <DialogTitle className='flex items-center justify-center gap-2 text-base'>
                        <Info className='h-4 w-4 text-muted-foreground' />
                        <span>הודעה למשתמשים</span>
                    </DialogTitle>
                    <DialogDescription asChild>
                        <div className='flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground'>
                            <p>
                                האתר נמצא כעת בשלבי השקה ראשוניים (Beta),
                                ולכן ייתכנו תקלות, באגים או חוסרים מסוימים בחוויית השימוש.
                            </p>
                            <p>
                                חשוב לציין כי האתר מפותח ומתוחזק על ידי מפתח יחיד, ובמקביל אני משרת
                                בצה&quot;ל. בעקבות זאת, ייתכן שזמן הטיפול בתקלות או פניות יהיה ארוך
                                מהרגיל.
                            </p>
                            <p>
                                אני עושה את מירב המאמצים לשפר, לתקן ולהוסיף פיצ&apos;רים באופן שוטף,
                                ומעריך מאוד את הסבלנות וההבנה שלכם 🙏
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
                    <Button variant='secondary' size='sm' className='w-full sm:w-auto sm:self-end' onClick={handleDismiss}>
                        הבנתי, תודה!
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
