
'use client';
import Link from 'next/link';
import Image from 'next/image';
import {
  Card,
  CardContent
} from '@/components/ui/card';
import { dashboardItems } from '@/lib/data';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { CountdownTimer } from '@/components/countdown-timer';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay"
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { collection } from 'firebase/firestore';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const educatorsQuery = useMemoFirebase(() => collection(firestore, 'educators'), [firestore]);
  const { data: educators, isLoading: isLoadingEducators } = useCollection(educatorsQuery);
  const promotionsQuery = useMemoFirebase(() => collection(firestore, 'promotions'), [firestore]);
  const { data: promotions, isLoading: isLoadingPromotions } = useCollection(promotionsQuery);


  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const colors = [
    "bg-blue-500", "bg-orange-500", "bg-green-500",
    "bg-purple-500", "bg-pink-500", "bg-red-500",
    "bg-rose-500", "bg-yellow-500", "bg-gray-500"
  ];

  if (isUserLoading || !user) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Hello {user?.displayName?.split(' ')[0] || 'Student'}!</h1>
          <Button>Support</Button>
        </div>
        {isLoadingPromotions ? (
          <Card className="bg-primary/90">
             <CardContent className="p-3">
               <Loader2 className="h-4 w-4 animate-spin text-primary-foreground mx-auto" />
             </CardContent>
           </Card>
        ) : promotions && promotions.length > 0 ? (
          <Carousel
            plugins={[Autoplay({ delay: 3000 })]}
            opts={{ align: "start", loop: true }}
          >
            <CarouselContent>
              {promotions.map((promo) => (
                <CarouselItem key={promo.id}>
                   <Link href={promo.link || '#'} target="_blank" rel="noopener noreferrer">
                    <Card className="bg-primary/90">
                      <CardContent className="p-3">
                        <p className="text-center text-primary-foreground font-semibold">
                          {promo.text}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        ) : null}
      </section>

      <section>
        <div className="grid grid-cols-3 gap-3">
          {dashboardItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link href={item.href} key={item.title}>
                <Card className={`${colors[index % colors.length]} text-white h-full hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1 group`}>
                  <CardContent className="flex flex-col items-center justify-center p-2 sm:p-4 aspect-square">
                    <Icon className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />
                    <p className="font-semibold text-center text-xs sm:text-sm">{item.title}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

       <section>
        <h2 className="text-xl font-bold mb-4">Our Educators</h2>
        {isLoadingEducators ? (
          <div className="flex justify-center items-center h-24">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Carousel opts={{ align: "start", loop: true }}>
            <CarouselContent>
              {educators?.map((educator) => (
                <CarouselItem key={educator.id} className="basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6">
                  <div className="text-center">
                    <Image
                      src={educator.imageUrl}
                      alt={educator.name}
                      width={100}
                      height={100}
                      className="rounded-full mx-auto mb-2 border-2 border-primary"
                    />
                    <p className="font-semibold text-sm sm:text-base">{educator.name}</p>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
          </Carousel>
        )}
      </section>

      <section>
        <Card className="bg-card/80">
          <CardContent className="p-4 text-center">
            <h3 className="text-lg font-semibold mb-2">Next Live Class</h3>
            <CountdownTimer />
          </CardContent>
        </Card>
      </section>

    </div>
  );
}
