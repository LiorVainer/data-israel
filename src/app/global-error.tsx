'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect, useState } from 'react';

/**
 * Global error boundary — catches unhandled errors from the root layout.
 * Cannot use @/* imports or component library since it replaces the entire HTML.
 * Uses inline styles to remain self-contained.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    const [copied, setCopied] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        Sentry.captureException(error);
    }, [error]);

    const errorText = [
        `${error.name}: ${error.message}`,
        error.digest ? `Digest: ${error.digest}` : null,
        error.stack ? `\nStack:\n${error.stack}` : null,
    ]
        .filter(Boolean)
        .join('\n');

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(errorText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // noop
        }
    };

    return (
        <html lang='he' dir='rtl'>
            <body
                style={{
                    margin: 0,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    backgroundColor: '#0a0a0a',
                    color: '#fafafa',
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                }}
            >
                <div
                    style={{
                        maxWidth: '28rem',
                        width: '100%',
                        borderRadius: '0.75rem',
                        border: '1px solid rgba(255,255,255,0.1)',
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        padding: '2rem 1.5rem',
                        textAlign: 'center',
                    }}
                >
                    <div
                        style={{
                            width: '3rem',
                            height: '3rem',
                            margin: '0 auto 1rem',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(239,68,68,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.25rem',
                        }}
                    >
                        !
                    </div>

                    <h1 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 0.5rem' }}>
                        משהו השתבש
                    </h1>
                    <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', margin: '0 0 1.5rem' }}>
                        אירעה שגיאה בלתי צפויה. ניתן לנסות שוב או לחזור לדף הבית.
                    </p>

                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1rem' }}>
                        <button
                            onClick={reset}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '0.5rem',
                                border: 'none',
                                backgroundColor: '#3b82f6',
                                color: '#fff',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                            }}
                        >
                            נסה שוב
                        </button>
                        <a
                            href='/'
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '0.5rem',
                                border: '1px solid rgba(255,255,255,0.15)',
                                backgroundColor: 'transparent',
                                color: '#fafafa',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                            }}
                        >
                            דף הבית
                        </a>
                    </div>

                    {/* Collapsible error details */}
                    <div style={{ textAlign: 'start' }}>
                        <button
                            onClick={() => setOpen((prev) => !prev)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'rgba(255,255,255,0.4)',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                padding: '0.25rem 0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                width: '100%',
                            }}
                        >
                            <span>פרטי השגיאה</span>
                            <span
                                style={{
                                    transition: 'transform 0.2s',
                                    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                                    fontSize: '0.625rem',
                                }}
                            >
                                ▼
                            </span>
                        </button>

                        {open && (
                            <div
                                style={{
                                    marginTop: '0.5rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    backgroundColor: 'rgba(255,255,255,0.02)',
                                    padding: '0.75rem',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '0.5rem',
                                    }}
                                >
                                    <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)' }}>
                                        מידע טכני
                                    </span>
                                    <button
                                        onClick={() => void handleCopy()}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'rgba(255,255,255,0.5)',
                                            fontSize: '0.6875rem',
                                            cursor: 'pointer',
                                            padding: '0.125rem 0.375rem',
                                            borderRadius: '0.25rem',
                                        }}
                                    >
                                        {copied ? 'הועתק!' : 'העתק'}
                                    </button>
                                </div>
                                <pre
                                    dir='ltr'
                                    style={{
                                        maxHeight: '10rem',
                                        overflow: 'auto',
                                        borderRadius: '0.375rem',
                                        backgroundColor: 'rgba(0,0,0,0.3)',
                                        padding: '0.625rem',
                                        fontSize: '0.6875rem',
                                        lineHeight: 1.6,
                                        color: 'rgba(255,255,255,0.5)',
                                        margin: 0,
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                    }}
                                >
                                    {errorText}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            </body>
        </html>
    );
}
