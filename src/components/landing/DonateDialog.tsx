'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose,
} from '@/components/ui/drawer';
import { BitLogo } from '@/components/landing/BitLogo';

const BIT_LINK = 'https://www.bitpay.co.il/app/me/D7F8C813-B55F-C14F-C5D8-1381C6D038DDD06D';

function DonateContent() {
    return (
        <div className='flex flex-col items-center gap-6 py-2'>
            <p className='text-muted-foreground text-center text-sm leading-relaxed'>
                אם נהניתם מהמיזם ורוצים לעזור לנו להמשיך לפתח, להוסיף מקורות מידע חדשים ולתת לכם את התשובות
                הכי מדויקות — נשמח לתמיכה שלכם.
            </p>
            <Button asChild className='w-full max-w-xs rounded-full h-12 text-base' style={{ backgroundColor: '#00353b' }}>
                <a href={BIT_LINK} target='_blank' rel='noopener noreferrer'>
                    <BitLogo className='h-6 w-auto' />
                </a>
            </Button>
        </div>
    );
}

export function DonateDialog({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={setOpen}>
                <div onClick={() => setOpen(true)}>{children}</div>
                <DrawerContent>
                    <DrawerHeader className='text-center'>
                        <DrawerTitle className='flex items-center justify-center gap-2'>
                            <Heart className='w-5 h-5 text-red-500' />
                            תמכו במיזם
                        </DrawerTitle>
                        <DrawerDescription>עזרו לנו להמשיך לפתח את דאטה ישראל</DrawerDescription>
                    </DrawerHeader>
                    <div className='px-4'>
                        <DonateContent />
                    </div>
                    <DrawerFooter>
                        <DrawerClose asChild>
                            <Button variant='outline' className='rounded-full'>
                                סגירה
                            </Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <div onClick={() => setOpen(true)}>{children}</div>
            <DialogContent className='sm:max-w-md'>
                <DialogHeader className='text-center sm:text-center'>
                    <DialogTitle className='flex items-center justify-center gap-2'>
                        <Heart className='w-5 h-5 text-red-500' />
                        תמכו במיזם
                    </DialogTitle>
                    <DialogDescription>עזרו לנו להמשיך לפתח את דאטה ישראל</DialogDescription>
                </DialogHeader>
                <DonateContent />
            </DialogContent>
        </Dialog>
    );
}
