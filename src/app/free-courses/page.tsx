
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function FreeCoursesPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const coursesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'courses'), where('isFree', '==', true)) : null, [firestore]);
  const { data: courses, isLoading: areCoursesLoading } = useCollection(coursesQuery);
  
  const enrollmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid), where('itemType', '==', 'course'));
  }, [firestore, user]);
  const { data: enrollments, isLoading: areEnrollmentsLoading } = useCollection(enrollmentsQuery);

  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (enrollments) {
      setEnrolledCourseIds(new Set(enrollments.map(e => e.itemId)));
    }
  }, [enrollments]);

  const handleFreeEnrollment = async (course: any) => {
     if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to enroll.' });
      return;
    }
    // Prevent re-enrollment
    const q = query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid), where('itemId', '==', course.id));
    const existingEnrollment = await getDocs(q);
    if (!existingEnrollment.empty) {
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
      isApproved: true, // Auto-approve free items
      itemName: course.title,
      itemImage: course.imageUrl,
    };

    try {
      await setDoc(enrollmentRef, enrollmentData);
      toast({ title: 'Success!', description: `You have enrolled in ${course.title}.` });
      router.push('/my-library');
    } catch (error) {
      console.error("Free enrollment error: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not enroll in the course.' });
    }
  };

  if (areCoursesLoading || areEnrollmentsLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-headline">All Free Courses</h1>
        <p className="text-muted-foreground mt-2">Start learning for free today.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {courses && courses.length > 0 ? (
          courses.map((course) => {
            const isEnrolled = enrolledCourseIds.has(course.id);
            return (
              <Card key={course.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full">
                <Link href={isEnrolled ? `/courses/content/${course.id}` : `/checkout/${course.id}?type=course`} className="flex flex-col flex-grow">
                  <CardHeader className="p-0">
                    <Image
                      src={course.imageUrl}
                      alt={course.title}
                      width={300}
                      height={170}
                      className="object-cover w-full h-40"
                    />
                  </CardHeader>
                  <CardContent className="flex-grow p-4">
                    <CardTitle className="text-lg font-headline mb-1 h-12 line-clamp-2">{course.title}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-3 h-[60px]">{course.description}</p>
                  </CardContent>
                </Link>
                <CardFooter className="p-4 mt-auto">
                    <div className="flex justify-between items-center w-full">
                        <p className="text-lg font-bold text-primary">Free</p>
                        {isEnrolled ? (
                        <Button variant="secondary" asChild>
                            <Link href={`/courses/content/${course.id}`}>Start Learning</Link>
                        </Button>
                        ) : (
                        <Button onClick={() => handleFreeEnrollment(course)}>Enroll Now</Button>
                        )}
                    </div>
                </CardFooter>
              </Card>
            )
          })
        ) : (
          <p className="col-span-full text-center text-muted-foreground">No free courses available at the moment.</p>
        )}
      </div>
    </div>
  );
}

    