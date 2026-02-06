'use client';

import * as Clerk from '@clerk/elements/common';
import * as SignUp from '@clerk/elements/sign-up';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';

export default function SignUpPage() {
    return (
        <div className='grid w-full h-full grow items-center px-4 sm:justify-center'>
            <SignUp.Root>
                <Clerk.Loading>
                    {(isGlobalLoading) => (
                        <SignUp.Step name='start'>
                            <Card className='w-full sm:w-96'>
                                <CardHeader className='text-center'>
                                    <CardTitle className='text-2xl'>הרשמה</CardTitle>
                                    <CardDescription>צור חשבון חדש כדי להתחיל</CardDescription>
                                </CardHeader>
                                <CardContent className='grid gap-y-4'>
                                    <Clerk.Connection name='google' asChild>
                                        <Button
                                            size='lg'
                                            variant='outline'
                                            type='button'
                                            disabled={isGlobalLoading}
                                            className='w-full'
                                        >
                                            <Clerk.Loading scope='provider:google'>
                                                {(isLoading) =>
                                                    isLoading ? (
                                                        <Loader2 className='size-4 animate-spin' />
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
                                </CardContent>
                                <CardFooter className='flex flex-col items-center gap-2'>
                                    <p className='text-sm text-muted-foreground'>
                                        יש לך כבר חשבון?{' '}
                                        <Clerk.Link navigate='sign-in' className='text-primary underline hover:no-underline'>
                                            התחברות
                                        </Clerk.Link>
                                    </p>
                                </CardFooter>
                            </Card>
                        </SignUp.Step>
                    )}
                </Clerk.Loading>
            </SignUp.Root>
        </div>
    );
}
