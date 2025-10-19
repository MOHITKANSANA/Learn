
'use client';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { MobileSidebar } from '@/components/layout/mobile-sidebar';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { doc } from 'firebase/firestore';

const metadata: Metadata = {
  title: 'Learn with munedra',
  description: 'Your personalized learning platform',
};

function SplashScreen() {
  const firestore = useFirestore();
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'payment') : null, [firestore]);
  const { data: settings } = useDoc(settingsRef);

  return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background gap-4">
          <div className="relative w-40 h-40">
              <div className="absolute inset-0 border-4 border-primary rounded-full animate-spin"></div>
              {settings?.logoUrl && 
                  <Image 
                      src={settings.logoUrl} 
                      alt="App Logo" 
                      width={160} 
                      height={160} 
                      className="rounded-full object-cover p-2 animate-pulse"
                  />
              }
          </div>
          <h2 className="text-2xl font-bold text-primary animate-fade-in-up">Learn with Munedra</h2>
          <p className="text-muted-foreground animate-fade-in-up" style={{animationDelay: '0.2s'}}>Made with ❤️ in India</p>
      </div>
  );
}


function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState('dark');
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(storedTheme);
    document.documentElement.className = storedTheme;

    const timer = setTimeout(() => {
        setShowSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isVideoPage = pathname.startsWith('/courses/video/') || pathname.startsWith('/live-classes/');

  if (showSplash || isUserLoading) {
    return <SplashScreen />;
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

  if (!user && !isUserLoading) {
    router.push('/login');
    return <SplashScreen />; // Or some other loading state
  }


  return (
    <SidebarProvider>
      <div className="relative flex min-h-screen flex-col overflow-x-hidden">
        <Header />
        <MobileSidebar />
        <main className={`transition-all duration-300 ${isVideoPage ? '' : 'pt-16 md:pt-0'}`}>
          {!isVideoPage && (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8 h-full">
                {children}
            </div>
          )}
          {isVideoPage && children}
        </main>
        {!isVideoPage && <Footer />}
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
    <html lang="en" className="h-full">
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
