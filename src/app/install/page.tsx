'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Download } from 'lucide-react';
import Image from 'next/image';

// Custom Google Play-like icon
const GooglePlayIcon = () => (
  <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.30101 1.146C4.89101 0.706 5.86101 1.016 6.07101 1.716L10.821 17.276C10.921 17.626 10.681 17.976 10.321 17.976L3.25101 17.986C2.18101 17.986 1.63101 16.716 2.37101 15.986L4.30101 1.146Z" fill="#00A050"/>
    <path d="M19.699 1.146C19.109 0.706 18.139 1.016 17.929 1.716L13.179 17.276C13.079 17.626 13.319 17.976 13.679 17.976L20.749 17.986C21.819 17.986 22.369 16.716 21.629 15.986L19.699 1.146Z" fill="#FFC900"/>
    <path d="M10.8203 17.276L6.07031 1.716C5.86031 1.016 4.89031 0.706 4.30031 1.146L12.0003 12L10.8203 17.276Z" fill="#FF7000"/>
    <path d="M13.1797 17.276L17.9297 1.716C18.1397 1.016 19.1097 0.706 19.6997 1.146L12.0003 12L13.1797 17.276Z" fill="#E00000"/>
  </svg>
);


export default function InstallPwaPage() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if the app is already running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      router.replace('/'); // Already installed, redirect to home
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [router]);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    setInstallPrompt(null);
    router.push('/'); // Navigate to home page after prompt is handled
  };
  
  const handleSkip = () => {
    router.push('/');
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-background opacity-80"></div>
            <div className="absolute w-96 h-96 bg-primary/20 rounded-full -top-20 -left-20 animate-pulse"></div>
            <div className="absolute w-96 h-96 bg-accent/20 rounded-full -bottom-20 -right-20 animate-pulse delay-500"></div>
        </div>
      
      <Card className="w-full max-w-md z-10 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
               <Image src="/icons/icon-192x192.png" alt="App Logo" width={80} height={80} />
            </div>
          <CardTitle className="text-3xl font-bold">Install the App</CardTitle>
          <CardDescription>Get the full experience by installing our app on your device.</CardDescription>
        </CardHeader>
        <CardContent>
            {installPrompt ? (
                <Button onClick={handleInstallClick} className="w-full h-14 text-lg">
                    <GooglePlayIcon />
                    Install App
                </Button>
            ) : (
                <p className="text-center text-muted-foreground">
                    Installation is not available right now. You can continue to the web version.
                </p>
            )}
        </CardContent>
        <CardContent>
            <Button onClick={handleSkip} variant="link" className="w-full">
                Skip for now
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
