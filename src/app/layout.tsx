import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { MobileSidebar } from '@/components/layout/mobile-sidebar';

export const metadata: Metadata = {
  title: 'Learn with munedra',
  description: 'Your personalized learning platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body bg-background antialiased h-full">
        <FirebaseClientProvider>
          <SidebarProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <MobileSidebar />
              <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
                {children}
              </main>
              <Footer />
            </div>
            <Toaster />
          </SidebarProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
