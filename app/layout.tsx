import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { AIDevtools } from '@ai-sdk-tools/devtools';

import './globals.css';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'סוכן נתונים פתוחים ישראלי',
    description: 'חקור מאגרי נתונים ציבוריים מ-data.gov.il באמצעות בינה מלאכותית',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang='he' dir='rtl'>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
        </html>
    );
}
