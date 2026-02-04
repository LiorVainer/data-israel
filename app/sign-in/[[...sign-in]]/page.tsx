'use client';

import Link from 'next/link';
import { GoogleOneTap, SignIn } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignInPage() {
    return (
        <div className='flex min-h-screen items-center justify-center px-4' dir='rtl'>
            <GoogleOneTap signInForceRedirectUrl='/' signUpForceRedirectUrl='/' />

            <Card className='w-full max-w-md'>
                <CardHeader className='text-center'>
                    <CardTitle className='text-2xl'>התחברות</CardTitle>
                    <CardDescription>התחבר לחשבונך כדי להמשיך</CardDescription>
                </CardHeader>
                <CardContent className='flex flex-col items-center gap-4'>
                    <p className='text-sm text-muted-foreground text-center'>
                        התחבר באמצעות חשבון Google שלך
                    </p>
                    <SignIn
                        appearance={{
                            elements: {
                                rootBox: 'w-full',
                                card: 'shadow-none border-none p-0 bg-transparent',
                                headerTitle: 'hidden',
                                headerSubtitle: 'hidden',
                                socialButtonsBlockButton: 'w-full',
                                footer: 'hidden',
                            },
                        }}
                        routing='path'
                        path='/sign-in'
                        signUpUrl='/sign-up'
                        forceRedirectUrl='/'
                    />
                </CardContent>
                <CardFooter className='flex flex-col items-center gap-2'>
                    <p className='text-sm text-muted-foreground'>
                        אין לך חשבון?{' '}
                        <Link href='/sign-up' className='text-primary underline hover:no-underline'>
                            הרשמה
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
