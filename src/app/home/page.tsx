

'use client';
import Link from 'next/link';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { dashboardItems } from '@/lib/data';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay"
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { Loader2, ArrowRight, Video, BookOpen, User as UserIcon, Info } from 'lucide-react';
import { collection, query, where, doc, setDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';


export default function Home() {
  const { user } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  
  const promotionsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'promotions')) : null, [firestore]);
  const { data: promotions, isLoading: isLoadingPromotions } = useCollection(promotionsQuery);
  
  const handleWhatsAppSupport = () => {
    const phoneNumber = "918949814095";
    const message = "Hello, I need help with my book order or enrollment.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <section className='space-y-4'>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-muted-foreground">Welcome back,</p>
            <h1 className="text-2xl font-bold">{user?.displayName || 'Student'}!</h1>
          </div>
           <Button variant="ghost" size="icon" asChild><Link href="/profile"><UserIcon /></Link></Button>
        </div>
        {isLoadingPromotions ? (
          <Skeleton className="w-full h-36 rounded-lg" />
        ) : promotions && promotions.length > 0 ? (
          <Carousel
            plugins={[Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: false })]}
            opts={{ align: "start", loop: true }}
            className="w-full"
          >
            <CarouselContent>
              {promotions.map((promo) => (
                <CarouselItem key={promo.id}>
                   <Link href={promo.link || '#'} target="_blank" rel="noopener noreferrer">
                    <div className="relative w-full h-36 bg-primary/20 rounded-lg overflow-hidden flex items-center justify-center p-6">
                       <div className="absolute inset-0 bg-gradient-to-r from-primary/50 to-transparent"></div>
                       <p className="relative text-center text-lg font-bold text-primary-foreground">
                          {promo.text}
                        </p>
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        ) : null}
      </section>

       <section>
        <div className="grid grid-cols-3 gap-3">
            {dashboardItems.map((item) => {
                const Icon = item.icon;
                return (
                <Link href={item.href} key={item.title}>
                    <div className="flex flex-col items-center justify-center text-center p-2 gap-1 rounded-lg bg-card hover:bg-muted transition-colors aspect-square">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <p className="font-semibold text-center text-xs leading-tight mt-1">{item.title}</p>
                    </div>
                </Link>
                );
            })}
        </div>
      </section>

      <section>
        <Card className="mt-8 bg-blue-900/20 border-blue-500/30">
          <CardHeader className="flex flex-row items-center gap-4">
              <Info className="h-6 w-6 text-blue-400"/>
              <div>
                <CardTitle className='text-blue-300'>Need Help?</CardTitle>
                <CardContent className="p-0 pt-2 text-blue-400/80">If your order or enrollment is not verified, please contact us on WhatsApp.</CardContent>
              </div>
          </CardHeader>
          <CardFooter>
              <Button onClick={handleWhatsAppSupport} className="w-full bg-green-500 hover:bg-green-600">
                  Contact Support on WhatsApp
              </Button>
          </CardFooter>
      </Card>
      </section>

    </div>
  );
}
