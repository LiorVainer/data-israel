'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Home } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorDetails } from '@/components/ErrorDetails';

/**
 * Chat route error boundary.
 * Catches errors from ChatThread (e.g. stream resume failures, render crashes)
 * and shows a friendly Hebrew error card with retry, home, and copyable details.
 */
export default function ChatError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    const router = useRouter();

    useEffect(() => {
        Sentry.captureException(error);
    }, [error]);

    return (
        <div className='flex h-full w-full items-center justify-center p-4'>
            <Card className='w-full max-w-md border-border/60 bg-card/50 backdrop-blur-sm'>
                <CardContent className='flex flex-col items-center gap-4 pt-2 text-center'>
                    <div className='flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive'>
                        <span className='text-xl font-semibold'>!</span>
                    </div>

                    <div className='space-y-1.5'>
                        <h2 className='text-lg font-semibold'>לא הצלחנו לטעון את השיחה</h2>
                        <p className='text-sm text-muted-foreground'>
                            אירעה שגיאה בטעינת השיחה. ניתן לנסות שוב או להתחיל שיחה חדשה.
                        </p>
                    </div>

                    <div className='flex gap-2'>
                        <Button onClick={reset} variant='default' size='sm' className='gap-1.5'>
                            <RefreshCw className='h-3.5 w-3.5' />
                            <span>נסה שוב</span>
                        </Button>
                        <Button onClick={() => router.push('/')} variant='outline' size='sm' className='gap-1.5'>
                            <Home className='h-3.5 w-3.5' />
                            <span>דף הבית</span>
                        </Button>
                    </div>

                    <ErrorDetails error={error} />
                </CardContent>
            </Card>
        </div>
    );
}
