import { AppSidebar } from '@/components/navigation/AppSidebar';

/**
 * Main layout for authenticated/guest app routes.
 * Wraps children with AppSidebar for navigation.
 */
export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <AppSidebar>{children}</AppSidebar>;
}
