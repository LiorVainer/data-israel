/**
 * Main layout for authenticated/guest app routes.
 * AppSidebar is now provided by the root layout.
 */
export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <>{children}</>;
}
