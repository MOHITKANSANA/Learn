
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
import { collection, query, where, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());

  const educatorsQuery = useMemoFirebase(() => collection(firestore, 'educators'), [firestore]);
  const { data: educators, isLoading: isLoadingEducators } = useCollection(educatorsQuery);
  
  const promotionsQuery = useMemoFirebase(() => collection(firestore, 'promotions'), [firestore]);
  const { data: promotions, isLoading: isLoadingPromotions } = useCollection(promotionsQuery);

  const freeCoursesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'courses'), where('isFree', '==', true)) : null, [firestore]);
  const { data: freeCourses, isLoading: isLoadingFreeCourses } = useCollection(freeCoursesQuery);
  
  const paidCoursesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'courses'), where('isFree', '==', false)) : null, [firestore]);
  const { data: paidCourses, isLoading: isLoadingPaidCourses } = useCollection(paidCoursesQuery);
  
  const enrollmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid), where('itemType', '==', 'course'));
  }, [firestore, user]);
  const { data: enrollments, isLoading: areEnrollmentsLoading } = useCollection(enrollmentsQuery);
  
  useEffect(() => {
    if (enrollments) {
      setEnrolledCourseIds(new Set(enrollments.map(e => e.itemId)));
    }
  }, [enrollments]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading]);

  const handleFreeEnrollment = async (course: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to enroll.' });
      return;
    }
     if (enrolledCourseIds.has(course.id)) {
      toast({ title: 'Already Enrolled', description: 'This course is already in your library.' });
      return;
    }

    const enrollmentRef = doc(collection(firestore, 'enrollments'));
    const enrollmentData = {
      id: enrollmentRef.id,
      studentId: user.uid,
      itemId: course.id,
      itemType: 'course',
      enrollmentDate: serverTimestamp(),
      isApproved: true,
      itemName: course.title,
      itemImage: course.imageUrl,
    };
    try {
      await setDoc(enrollmentRef, enrollmentData);
      toast({ title: 'Success!', description: `You have enrolled in ${course.title}.` });
      router.push('/my-library');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not enroll in the course.' });
    }
  };


  const colors = [
    "bg-blue-500", "bg-orange-500", "bg-green-500",
    "bg-purple-500", "bg-pink-500", "bg-red-500",
    "bg-rose-500", "bg-yellow-500", "bg-gray-500"
  ];

  if (isUserLoading || !user || areEnrollmentsLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
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
        <h2 className="text-xl font-bold mb-4">Free Courses</h2>
        {isLoadingFreeCourses ? (
          <div className="flex justify-center items-center h-48">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : freeCourses && freeCourses.length > 0 ? (
          <Carousel opts={{ align: "start", loop: freeCourses.length > 4 }} plugins={[Autoplay({ delay: 5000 })]} className="w-full">
            <CarouselContent>
                {freeCourses.map(course => {
                    const isEnrolled = enrolledCourseIds.has(course.id);
                    return (
                        <CarouselItem key={course.id} className="basis-1/2 sm:basis-1/3 md:basis-1/4">
                            <Card className="flex flex-col overflow-hidden h-full hover:shadow-lg transition-shadow duration-300">
                                <Link href={`/courses/${course.id}`} className="flex flex-col flex-grow">
                                    <Image src={course.imageUrl} alt={course.title} width={300} height={170} className="w-full h-32 object-cover" />
                                    <CardHeader className="p-3 flex-grow"><CardTitle className="text-sm font-semibold truncate">{course.title}</CardTitle></CardHeader>
                                </Link>
                                <CardFooter className="p-3 mt-auto">
                                    {isEnrolled ? (
                                        <Button variant="secondary" size="sm" asChild className="w-full"><Link href={`/courses/content/${course.id}`}>Start Learning</Link></Button>
                                    ) : (
                                        <Button size="sm" className="w-full" onClick={(e) => handleFreeEnrollment(course, e)}>Enroll Now</Button>
                                    )}
                                </CardFooter>
                            </Card>
                        </CarouselItem>
                    )
                })}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
          </Carousel>
        ) : <p className="text-muted-foreground">No free courses available at the moment.</p>}
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Paid Courses</h2>
        {isLoadingPaidCourses ? (
          <div className="flex justify-center items-center h-48">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : paidCourses && paidCourses.length > 0 ? (
           <Carousel opts={{ align: "start", loop: paidCourses.length > 4 }} plugins={[Autoplay({ delay: 4000 })]} className="w-full">
            <CarouselContent>
                {paidCourses.map(course => {
                     const isEnrolled = enrolledCourseIds.has(course.id);
                    return (
                        <CarouselItem key={course.id} className="basis-1/2 sm:basis-1/3 md:basis-1/4">
                            <Card className="flex flex-col overflow-hidden h-full hover:shadow-lg transition-shadow duration-300">
                                <Link href={`/courses/${course.id}`} className="flex flex-col flex-grow">
                                    <Image src={course.imageUrl} alt={course.title} width={300} height={170} className="w-full h-32 object-cover" />
                                    <CardHeader className="p-3 flex-grow"><CardTitle className="text-sm font-semibold truncate">{course.title}</CardTitle></CardHeader>
                                </Link>
                                <CardFooter className="p-3 mt-auto flex justify-between items-center">
                                    <p className="font-bold text-primary">₹{course.price}</p>
                                    {isEnrolled ? (
                                        <Button variant="secondary" size="sm" asChild><Link href={`/courses/content/${course.id}`}>Start Learning</Link></Button>
                                    ) : (
                                        <Button size="sm" asChild><Link href={`/checkout/${course.id}?type=course`}>Buy Now</Link></Button>
                                    )}
                                </CardFooter>
                            </Card>
                        </CarouselItem>
                    )
                })}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
          </Carousel>
        ) : <p className="text-muted-foreground">No paid courses available at the moment.</p>}
      </section>

       <section>
        <h2 className="text-xl font-bold mb-4">Our Educators</h2>
        {isLoadingEducators ? (
          <div className="flex justify-center items-center h-24">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Carousel opts={{ align: "start" }} className="w-full">
            <CarouselContent>
              {educators?.map((educator) => (
                <CarouselItem key={educator.id} className="basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6">
                  <div className="text-center p-1">
                    <Image
                      src={educator.imageUrl}
                      alt={educator.name}
                      width={120}
                      height={120}
                      className="rounded-full mx-auto mb-2 border-2 border-primary aspect-square object-cover"
                    />
                    <p className="font-semibold text-sm sm:text-base truncate">{educator.name}</p>
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
