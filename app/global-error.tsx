'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
    useEffect(() => {
        Sentry.captureException(error);
    }, [error]);

    return (
        <html lang='he' dir='rtl'>
            <body>
                <div className='flex min-h-screen items-center justify-center'>
                    <h1 className='text-2xl font-bold'>שגיאה בלתי צפויה אירעה</h1>
                </div>
            </body>
        </html>
    );
}
