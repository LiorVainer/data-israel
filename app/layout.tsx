import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import ConvexClientProvider from '@/context/ConvexClientProvider';
import QueryClientProvider from '@/context/QueryClientProvider';
import { UserProvider } from '@/context/UserContext';
import { AppSidebar } from '@/components/navigation/AppSidebar';
import { Toaster } from '@/components/ui/sonner';

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
    title: 'סוכן המידע הציבורי של ישראל',
    description: 'חקור מאגרי נתונים ציבוריים מ-data.gov.il באמצעות בינה מלאכותית',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang='he' dir='rtl'>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <ClerkProvider>
                    <QueryClientProvider>
                        <ConvexClientProvider>
                            <UserProvider>
                                <AppSidebar>{children}</AppSidebar>
                            </UserProvider>
                        </ConvexClientProvider>
                    </QueryClientProvider>
                </ClerkProvider>
                <Toaster />
            </body>
        </html>
    );
}
