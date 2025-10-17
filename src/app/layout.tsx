
'use client';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { MobileSidebar } from '@/components/layout/mobile-sidebar';
import { usePathname } from 'next/navigation';
import { useUser } from '@/firebase';

const metadata: Metadata = {
  title: 'Learn with munedra',
  description: 'Your personalized learning platform',
};

function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isVideoPage = pathname.startsWith('/courses/video/');

  if (isVideoPage) {
    return <>{children}</>;
  }

  if (isUserLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        {/* You can add a global spinner here */}
      </div>
    );
  }

  if (isAuthPage) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex items-center flex-1">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="relative flex min-h-screen flex-col overflow-x-hidden">
        <Header />
        <MobileSidebar />
        <main>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8 h-full">
            {children}
          </div>
        </main>
        <Footer />
      </div>
      <Toaster />
    </SidebarProvider>
  );
}


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
        <title>{String(metadata.title)}</title>
        <meta name="description" content={metadata.description ?? ''} />
      </head>
      <body className="font-body bg-background antialiased h-full">
        <FirebaseClientProvider>
          <AppLayout>{children}</AppLayout>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
