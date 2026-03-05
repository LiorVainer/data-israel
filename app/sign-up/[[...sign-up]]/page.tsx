'use client';

import * as Clerk from '@clerk/elements/common';
import * as SignUp from '@clerk/elements/sign-up';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { AmbientGlow } from '@/components/ui/AmbientGlow';
import { GeometricBackground } from '@/components/ui/shape-landing-hero';
import { Loader2 } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';

export default function SignUpPage() {
    return (
        <div className='relative flex w-full min-h-dvh items-center justify-center bg-background overflow-hidden'>
            <GeometricBackground noShapes />
            <AmbientGlow top='30%' left='25%' size={600} />
            <AmbientGlow top='70%' left='75%' size={500} />

            <SignUp.Root>
                <Clerk.Loading>
                    {(isGlobalLoading) => (
                        <SignUp.Step name='start'>
                            <div className='relative z-10 w-full sm:w-[32rem] sm:bg-card/80 sm:backdrop-blur-xl text-card-foreground sm:rounded-3xl sm:border sm:border-border/40 sm:shadow-2xl px-6 sm:px-12 py-14 flex flex-col items-center gap-10'>
                                <div className='flex flex-col items-center gap-5'>
                                    <div className='rounded-2xl bg-background/60 p-4 border border-border/30 shadow-sm'>
                                        <Logo className='size-14' />
                                    </div>
                                    <div className='text-center space-y-2.5'>
                                        <h1 className='text-3xl font-bold tracking-tight'>הצטרפו לדאטה ישראל</h1>
                                        <p className='text-base text-muted-foreground'>
                                            צרו חשבון כדי להתחיל לחקור נתונים ציבוריים
                                        </p>
                                    </div>
                                </div>

                                <div className='w-full space-y-4'>
                                    <Clerk.Connection name='google' asChild>
                                        <Button
                                            size='lg'
                                            variant='outline'
                                            type='button'
                                            disabled={isGlobalLoading}
                                            className='w-full h-13 text-base gap-3 rounded-xl border-border/50 bg-background/50 hover:bg-background/80 transition-colors'
                                        >
                                            <Clerk.Loading scope='provider:google'>
                                                {(isLoading) =>
                                                    isLoading ? (
                                                        <Loader2 className='size-5 animate-spin' />
                                                    ) : (
                                                        <>
                                                            <FcGoogle className='size-5' />
                                                            המשך עם Google
                                                        </>
                                                    )
                                                }
                                            </Clerk.Loading>
                                        </Button>
                                    </Clerk.Connection>
                                </div>

                                <p className='text-center text-xs leading-relaxed text-muted-foreground/80 max-w-xs'>
                                    בלחיצה על &quot;המשך עם Google&quot; הנך מסכים/ה ל
                                    <a
                                        href='/terms'
                                        className='underline underline-offset-2 hover:text-foreground transition-colors'
                                    >
                                        תנאי השימוש
                                    </a>{' '}
                                    ול
                                    <a
                                        href='/privacy'
                                        className='underline underline-offset-2 hover:text-foreground transition-colors'
                                    >
                                        מדיניות הפרטיות
                                    </a>{' '}
                                    שלנו. אנו שומרים על פרטיותך ומגנים על המידע האישי שלך.
                                </p>
                            </div>
                        </SignUp.Step>
                    )}
                </Clerk.Loading>
            </SignUp.Root>
        </div>
    );
}
