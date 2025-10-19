

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
import { useEffect, useMemo } from 'react';
import { Loader2, ArrowRight, Video, BookOpen, User as UserIcon } from 'lucide-react';
import { collection, query, where, doc, setDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const educatorsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'educators') : null, [firestore]);
  const { data: educators, isLoading: isLoadingEducators } = useCollection(educatorsQuery);
  
  const promotionsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'promotions')) : null, [firestore]);
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
  
  const enrollmentStatus = useMemo(() => {
    const statusMap = new Map<string, 'approved' | 'pending'>();
    if (enrollments) {
      for (const e of enrollments) {
        if (e.isApproved) {
          statusMap.set(e.itemId, 'approved');
        } else if (!statusMap.has(e.itemId)) {
          statusMap.set(e.itemId, 'pending');
        }
      }
    }
    return statusMap;
  }, [enrollments]);

  const handleFreeEnrollment = async (course: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
        toast({
            title: "Please complete your profile",
            description: "To enroll in courses, please complete your profile first.",
            action: <Button onClick={() => router.push('/profile-setup')}>Complete Profile</Button>
        });
        return;
    }

    if (user.isAnonymous) {
        toast({
            title: "Please Sign Up",
            description: "To enroll in courses, please create an account first.",
            action: <Button onClick={() => router.push('/signup')}>Sign Up</Button>
        })
        return;
    }

    const q = query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid), where('itemId', '==', course.id));
    const existingEnrollment = await getDocs(q);
    if (!existingEnrollment.empty) {
      toast({ title: 'Already Enrolled', description: 'This course is already in your library.' });
      router.push(`/courses/content/${course.id}`);
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


  const handlePaidCourseClick = (courseId: string) => {
    if (!user) {
         toast({
            title: "Please complete your profile",
            description: "To purchase courses, please complete your profile first.",
            action: <Button onClick={() => router.push('/profile-setup')}>Complete Profile</Button>
        });
    } else if (user.isAnonymous) {
        toast({
            title: "Please Sign Up",
            description: "To purchase courses, please create an account first.",
            action: <Button onClick={() => router.push('/signup')}>Sign Up</Button>
        })
    } else {
        router.push(`/checkout/${courseId}?type=course`);
    }
  }

  const renderPaidCourseButton = (course: any) => {
    const status = enrollmentStatus.get(course.id);
    if (status === 'approved') {
        return (
            <Button variant="secondary" size="sm" asChild><Link href={`/courses/content/${course.id}`}>Start Learning</Link></Button>
        );
    }
    if (status === 'pending') {
        return <Button disabled size="sm">Pending Approval</Button>;
    }
    return (
        <Button size="sm" onClick={() => handlePaidCourseClick(course.id)}>Buy Now</Button>
    );
  };
  
  const renderFreeCourseButton = (course: any) => {
    const status = enrollmentStatus.get(course.id);
    if (status === 'approved') {
        return (
            <Button variant="secondary" size="sm" asChild className="w-full"><Link href={`/courses/content/${course.id}`}>Start Learning</Link></Button>
        );
    }
    return (
        <Button size="sm" className="w-full" onClick={(e) => handleFreeEnrollment(course, e)}>Enroll Now</Button>
    );
  };

  const mainFeatures = dashboardItems.slice(0, 3);
  const otherFeatures = dashboardItems.slice(3);


  if (isUserLoading || areEnrollmentsLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <div className="space-y-8">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mainFeatures.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link href={item.href} key={item.title}>
                <Card className={`text-white h-full hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group ${['bg-blue-500', 'bg-orange-500', 'bg-green-500'][index]}`}>
                  <CardContent className="flex flex-col items-start justify-between p-4 aspect-video">
                    <div className="p-2 bg-white/20 rounded-full">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">{item.title}</p>
                      <p className="text-xs opacity-80">Explore now</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
            {otherFeatures.map((item) => {
                const Icon = item.icon;
                return (
                <Link href={item.href} key={item.title}>
                    <div className="flex flex-col items-center justify-center text-center p-2 gap-1 rounded-lg hover:bg-muted transition-colors">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <p className="font-semibold text-center text-xs leading-tight">{item.title}</p>
                    </div>
                </Link>
                );
            })}
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Free Courses</h2>
           <Button variant="link" asChild><Link href="/free-courses">View All <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
        </div>
        {isLoadingFreeCourses ? (
          <div className="flex justify-center items-center h-48">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : freeCourses && freeCourses.length > 0 ? (
          <Carousel opts={{ align: "start", loop: false }} className="w-full -ml-4">
            <CarouselContent className="px-4">
                {freeCourses.map(course => {
                    return (
                        <CarouselItem key={course.id} className="basis-2/3 sm:basis-1/2 md:basis-1/3">
                            <Card className="flex flex-col overflow-hidden h-full hover:shadow-lg transition-shadow duration-300">
                                {renderFreeCourseButton(course)}
                                <Image src={course.imageUrl} alt={course.title} width={300} height={170} className="w-full aspect-video object-cover" />
                                <CardHeader className="p-3 flex-grow">
                                    <CardTitle className="text-base font-semibold h-12 line-clamp-2">{course.title}</CardTitle>
                                </CardHeader>
                            </Card>
                        </CarouselItem>
                    )
                })}
            </CarouselContent>
          </Carousel>
        ) : <p className="text-muted-foreground">No free courses available at the moment.</p>}
      </section>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Paid Courses</h2>
           <Button variant="link" asChild><Link href="/courses">View All <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
        </div>
        {isLoadingPaidCourses ? (
          <div className="flex justify-center items-center h-48">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : paidCourses && paidCourses.length > 0 ? (
           <Carousel opts={{ align: "start", loop: false }} className="w-full -ml-4">
            <CarouselContent className="px-4">
                {paidCourses.map(course => {
                    return (
                        <CarouselItem key={course.id} className="basis-2/3 sm:basis-1/2 md:basis-1/3">
                            <Card className="flex flex-col overflow-hidden h-full hover:shadow-lg transition-shadow duration-300">
                                <Image src={course.imageUrl} alt={course.title} width={300} height={170} className="w-full aspect-video object-cover" />
                                <CardHeader className="p-3 flex-grow">
                                    <CardTitle className="text-base font-semibold h-12 line-clamp-2">{course.title}</CardTitle>
                                </CardHeader>
                                <CardFooter className="p-3 mt-auto flex justify-between items-center">
                                    <p className="font-bold text-lg text-primary">₹{course.price}</p>
                                    {renderPaidCourseButton(course)}
                                </CardFooter>
                            </Card>
                        </CarouselItem>
                    )
                })}
            </CarouselContent>
          </Carousel>
        ) : <p className="text-muted-foreground">No paid courses available at the moment.</p>}
      </section>

       <section>
        <h2 className="text-xl font-bold mb-4">Our Educators</h2>
        {isLoadingEducators ? (
          <div className="flex justify-center items-center h-48">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {educators?.slice(0, 4).map((educator) => (
                <Link href={`/educators/${educator.id}`} key={educator.id} className="group">
                  <Card className="text-center p-4 h-full bg-card hover:bg-muted transition-colors">
                     <Image
                      src={educator.imageUrl}
                      alt={educator.name}
                      width={120}
                      height={120}
                      className="rounded-full mx-auto mb-3 border-2 border-primary aspect-square object-cover"
                    />
                    <p className="font-bold text-sm truncate">{educator.name}</p>
                    <p className="text-xs text-muted-foreground">{educator.subject}</p>
                  </Card>
                </Link>
              ))}
            </div>
        )}
      </section>

      <section>
        <Card className="bg-gradient-to-r from-blue-900 via-purple-900 to-pink-900 text-primary-foreground">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Next Live Class</h3>
            <CountdownTimer />
            <Button asChild variant="secondary" className="mt-4"><Link href="/live-classes">View Schedule</Link></Button>
          </CardContent>
        </Card>
      </section>

    </div>
  );
}
