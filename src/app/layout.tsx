import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppHeader } from '@/components/AppHeader';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'MealBridge · Hyper-local food rescue',
  description:
    'Prototype for connecting donors, volunteers, and admins around surplus food within five kilometers.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-slate-50 antialiased`}>
        <AuthProvider>
          <AppHeader />
          <main className="mx-auto min-h-screen max-w-6xl px-4 pb-16 pt-8">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
