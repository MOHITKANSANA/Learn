

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
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { doc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

const metadata: Metadata = {
  title: 'Learn with Munedra',
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
              {settings?.logoUrl ? 
                  <Image 
                      src={settings.logoUrl} 
                      alt="App Logo" 
                      width={160} 
                      height={160} 
                      className="rounded-full object-cover p-2 animate-pulse"
                  /> :
                  <Image 
                      src="/logo-512.png" 
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
  const auth = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState('dark');
  const [showSplash, setShowSplash] = useState(true);

  // Use a separate hook/state to track profile data from Firestore
  const firestore = useFirestore(); // Get firestore instance
  const userDocRef = useMemo(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);
  
  // A new state to determine if initial checks are complete
  const [isInitialCheckComplete, setIsInitialCheckComplete] = useState(false);

  // Checks if the user's profile is complete based on Firestore data.
  const isProfileComplete = !!userProfile?.name && !!userProfile?.mobileNumber;

  useEffect(() => {
    // Automatically sign in users anonymously if they aren't logged in.
    const handleAnonymousSignIn = async () => {
        if (!user && !isUserLoading && !auth.currentUser) {
            try {
                await signInAnonymously(auth);
            } catch (error) {
                console.error("Anonymous sign-in failed:", error);
            }
        }
    };
    handleAnonymousSignIn();
  }, [user, isUserLoading, auth]);

  useEffect(() => {
    // Show splash screen for a minimum duration
    const splashTimer = setTimeout(() => {
        setShowSplash(false);
    }, 2500);

    return () => clearTimeout(splashTimer);
  }, []);

  useEffect(() => {
    // This effect runs once all loading is done.
    if (!showSplash && !isUserLoading && !isProfileLoading) {
      setIsInitialCheckComplete(true);
    }
  }, [showSplash, isUserLoading, isProfileLoading]);

  useEffect(() => {
    // This effect handles redirection once the initial checks are complete.
    if (!isInitialCheckComplete) return;

    if (user && !user.isAnonymous && !isProfileComplete && pathname !== '/profile-setup' && !pathname.startsWith('/admin')) {
        router.replace('/profile-setup');
    }
  }, [isInitialCheckComplete, user, isProfileComplete, pathname, router]);

  useEffect(() => {
    // PWA and theme setup
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => console.log('Service Worker registered with scope:', registration.scope))
        .catch((error) => console.log('Service Worker registration failed:', error));
    }
    const storedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(storedTheme);
    document.documentElement.className = storedTheme;
  }, []);

  const isAuthPage = pathname === '/signup' || pathname === '/admin/login' || pathname === '/profile-setup';
  const isVideoPage = pathname.startsWith('/courses/video/') || pathname.startsWith('/live-classes/');

  if (showSplash || (!isInitialCheckComplete && !isAuthPage)) {
    return <SplashScreen />;
  }
  
  if (isAuthPage && pathname !== '/profile-setup') {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex items-center flex-1 justify-center">
            {children}
        </main>
      </div>
    );
  }
  
  // This allows the profile setup page to render within the main layout if needed, or standalone.
  if (pathname === '/profile-setup' && (!user || (user && !user.isAnonymous && !isProfileComplete))) {
       return (
            <div className="flex flex-col min-h-screen">
                <main className="flex items-center flex-1 justify-center p-4">
                    {children}
                </main>
            </div>
       );
  }


  return (
    <SidebarProvider>
      <div className="relative flex min-h-screen flex-col">
        <Header />
        <MobileSidebar />
        <main className="flex-1">
          <div className="container mx-auto px-1 py-8 pb-20 md:pb-8">
            {children}
          </div>
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#facc15" />
        <link rel="apple-touch-icon" href="/logo-192.png" />
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
