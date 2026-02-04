'use client';

import Link from 'next/link';
import { GoogleOneTap, SignUp } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignUpPage() {
    return (
        <div className='flex min-h-screen items-center justify-center px-4' dir='rtl'>
            <GoogleOneTap signInForceRedirectUrl='/' signUpForceRedirectUrl='/' />

            <Card className='w-full max-w-md'>
                <CardHeader className='text-center'>
                    <CardTitle className='text-2xl'>הרשמה</CardTitle>
                    <CardDescription>צור חשבון חדש כדי להתחיל</CardDescription>
                </CardHeader>
                <CardContent className='flex flex-col items-center gap-4'>
                    <p className='text-sm text-muted-foreground text-center'>
                        הרשם באמצעות חשבון Google שלך
                    </p>
                    <SignUp
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
                        path='/sign-up'
                        signInUrl='/sign-in'
                        forceRedirectUrl='/'
                    />
                </CardContent>
                <CardFooter className='flex flex-col items-center gap-2'>
                    <p className='text-sm text-muted-foreground'>
                        יש לך כבר חשבון?{' '}
                        <Link href='/sign-in' className='text-primary underline hover:no-underline'>
                            התחברות
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
