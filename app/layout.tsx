import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "סוכן נתונים פתוחים ישראלי",
  description: "חקור מאגרי נתונים ציבוריים מ-data.gov.il באמצעות בינה מלאכותית",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
