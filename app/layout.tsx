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

const VERSION = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ?? Date.now().toString();

export async function generateMetadata(): Promise<Metadata> {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://data-israel.org';
    const title = 'סוכן המידע הציבורי של ישראל';
    const description =
        'שוחח עם סוכן AI חכם שמחובר למאות אלפי מאגרי מידע פתוחים מ-data.gov.il והלמ"ס - חיפוש, ניתוח וויזואליזציה של נתונים ציבוריים בעברית';
    const ogImage = `/og.png?v=${VERSION}`;

    return {
        title,
        description,
        metadataBase: new URL(siteUrl),
        openGraph: {
            type: 'website',
            url: siteUrl,
            title,
            description,
            siteName: 'סוכן המידע הציבורי',
            locale: 'he_IL',
            images: [
                {
                    url: ogImage,
                    width: 1200,
                    height: 630,
                    alt: 'סוכן המידע הציבורי - AI למידע הפתוח של ישראל',
                    type: 'image/png',
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [
                {
                    url: ogImage,
                    alt: 'סוכן המידע הציבורי - AI למידע הפתוח של ישראל',
                },
            ],
        },
    };
}

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
