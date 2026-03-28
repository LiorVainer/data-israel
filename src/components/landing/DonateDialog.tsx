'use client';

import { Heart } from 'lucide-react';
import { track } from '@vercel/analytics';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { BitLogo } from '@/components/landing/BitLogo';

const BIT_LINK = process.env.NEXT_PUBLIC_BIT_DONATE_URL ?? '';

function DonateContent() {
    return (
        <div className='flex flex-col items-center gap-6'>
            <p className='text-foreground text-start text-sm leading-relaxed w-full'>
                אם דאטה ישראל עזר לכם, נשמח לתמיכה שלכם כדי לשמור עליו פעיל, להמשיך לשפר אותו ולהוסיף אליו מקורות מידע
                חדשים.
            </p>
            <p className='text-foreground text-start text-sm leading-relaxed w-full'>
                המיזם מפותח ומתוחזק נכון להיום בהתנדבות על ידי מפתח יחיד.
            </p>
            <a
                href={BIT_LINK}
                target='_blank'
                rel='noopener noreferrer'
                onClick={() => track('bit_donate_click')}
                className='max-w-xs w-full bg-[#00353b] rounded-full h-10 text-base hover:opacity-80 hover:scale-105 transition-all duration-1000 ease-out flex items-center justify-center'
            >
                <BitLogo className='size-7 text-white' />
            </a>
            {/*<p className='font-light text-xs hidden md:block'>הכפתור מוביל לאפליקציית ביט שניתנת לפתיחה רק מהפלאפון</p>*/}
        </div>
    );
}

export function DonateDialog({ children }: { children: React.ReactNode }) {
    const isMobile = useIsMobile();

    const handleOpenChange = (open: boolean) => {
        if (open) track('donate_dialog_open');
    };

    if (isMobile) {
        return (
            <Drawer onOpenChange={handleOpenChange}>
                <DrawerTrigger asChild>{children}</DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader className='text-start'>
                        <DrawerTitle className='flex items-center gap-1'>
                            תמכו במיזם
                            <Heart className='w-4 h-4 fill-action text-action' />
                        </DrawerTitle>
                    </DrawerHeader>
                    <div className='px-4 pb-6'>
                        <DonateContent />
                    </div>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className='sm:max-w-md'>
                <DialogHeader className='text-start sm:text-start'>
                    <DialogTitle className='flex items-center gap-2'>
                        תמכו במיזם
                        <Heart className='w-5 h-5 fill-action text-action' />
                    </DialogTitle>
                </DialogHeader>
                <DonateContent />
            </DialogContent>
        </Dialog>
    );
}
