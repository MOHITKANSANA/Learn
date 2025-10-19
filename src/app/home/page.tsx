
'use client';
import Link from 'next/link';
import Image from 'next/image';
import {
  Card,
  CardContent,
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
import { Loader2, User as UserIcon, BookOpenCheck, Gift, Trophy, FileText, PlaySquare, Book, Briefcase } from 'lucide-react';
import { collection, query, where, limit } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const primaryButtons = [
  { title: 'Courses', href: '/courses', icon: BookOpenCheck, color: 'bg-blue-500' },
  { title: 'Free Courses', href: '/free-courses', icon: Gift, color: 'bg-orange-500' },
  { title: 'Scholarship', href: '/scholarship', icon: Trophy, color: 'bg-green-500' },
  { title: 'Test Series', href: '/test-series', icon: FileText, color: 'bg-purple-500' },
  { title: 'Live Classes', href: '/live-classes', icon: PlaySquare, color: 'bg-pink-500' },
  { title: 'Book Shala', href: '/book-shala', icon: Book, color: 'bg-red-500' },
];

export default function Home() {
  const { user } = useUser();
  const firestore = useFirestore();
  
  const promotionsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'promotions'), limit(1)) : null, [firestore]);
  const { data: promotions, isLoading: isLoadingPromotions } = useCollection(promotionsQuery);
  
  const educatorsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'educators') : null, [firestore]);
  const { data: educators, isLoading: isLoadingEducators } = useCollection(educatorsQuery);

  const coursesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'courses') : null, [firestore]);
  const { data: courses, isLoading: isLoadingCourses } = useCollection(coursesQuery);
  
  const handleWhatsAppSupport = () => {
    const phoneNumber = "918949814095"; 
    const message = "Hello, I need help with my book order or enrollment.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const currentPromotion = promotions?.[0];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <section className='space-y-4'>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Hello {user?.displayName?.split(' ')[0] || 'Student'}!</h1>
          </div>
           <Button variant="outline" size="sm" onClick={handleWhatsAppSupport}>Support</Button>
        </div>
        
        {/* Promotion Banner */}
        {isLoadingPromotions ? (
          <Skeleton className="w-full h-14 rounded-lg" />
        ) : currentPromotion ? (
           <Link href={currentPromotion.link || '#'} target="_blank" rel="noopener noreferrer">
            <div className="relative w-full h-14 bg-primary rounded-lg overflow-hidden flex items-center justify-center p-2">
               <p className="relative text-center text-md font-bold text-primary-foreground">
                  {currentPromotion.text} 👍👍 click now
                </p>
            </div>
          </Link>
        ) : null}
      </section>

      {/* 6-Button Grid */}
       <section>
        <div className="grid grid-cols-3 gap-3">
            {primaryButtons.map((item) => {
                const Icon = item.icon;
                return (
                <Link href={item.href} key={item.title}>
                    <div className={`flex flex-col items-center justify-center text-center p-4 gap-2 rounded-lg ${item.color} text-white hover:opacity-90 transition-opacity aspect-square`}>
                        <Icon className="h-8 w-8" />
                        <p className="font-semibold text-center text-sm leading-tight mt-1">{item.title}</p>
                    </div>
                </Link>
                );
            })}
        </div>
      </section>

      {/* Our Educators Carousel */}
      <section>
        <h2 className="text-xl font-bold mb-3">Our Educators</h2>
        {isLoadingEducators ? <Skeleton className="w-full h-36 rounded-lg" /> :
          educators && educators.length > 0 && (
            <Carousel opts={{ align: "start", loop: true }} className="w-full">
              <CarouselContent>
                {educators.map(educator => (
                   <CarouselItem key={educator.id} className="basis-1/2 sm:basis-1/3">
                     <Link href={`/educators/${educator.id}`}>
                      <Card className="overflow-hidden">
                        <CardContent className="p-0 flex flex-col items-center text-center">
                          <Avatar className="h-20 w-20 mt-4 border-2 border-primary">
                            <AvatarImage src={educator.imageUrl} />
                            <AvatarFallback>{educator.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="p-2">
                            <p className="font-semibold text-sm">{educator.name}</p>
                            <p className="text-xs text-muted-foreground">{educator.subject}</p>
                          </div>
                        </CardContent>
                      </Card>
                     </Link>
                   </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          )
        }
      </section>
      
      {/* Top Courses Carousel */}
       <section>
        <h2 className="text-xl font-bold mb-3">Top Courses</h2>
        {isLoadingCourses ? <Skeleton className="w-full h-48 rounded-lg" /> :
          courses && courses.length > 0 && (
            <Carousel opts={{ align: "start" }} className="w-full">
              <CarouselContent>
                {courses.map(course => (
                   <CarouselItem key={course.id} className="basis-2/3 sm:basis-1/2">
                     <Link href={`/courses/content/${course.id}`}>
                      <Card className="overflow-hidden">
                          <Image src={course.imageUrl} alt={course.title} width={300} height={170} className="w-full aspect-video object-cover"/>
                          <p className="font-semibold text-sm p-2 truncate">{course.title}</p>
                      </Card>
                     </Link>
                   </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex" />
              <CarouselNext className="hidden sm:flex"/>
            </Carousel>
          )
        }
      </section>


    </div>
  );
}
