
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
import { useEffect, useState, useMemo } from 'react';

export default function CoursesPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const coursesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'courses'), where('isFree', '==', false)) : null, [firestore]);
  const { data: courses, isLoading: areCoursesLoading } = useCollection(coursesQuery);
  
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

  if (areCoursesLoading || areEnrollmentsLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  const renderButton = (course: any) => {
    const status = enrollmentStatus.get(course.id);
    if (status === 'approved') {
        return (
            <Button variant="secondary" asChild>
                <Link href={`/courses/content/${course.id}`}>Start Learning</Link>
            </Button>
        );
    }
    if (status === 'pending') {
        return <Button disabled>Pending Approval</Button>;
    }
    return (
        <Button asChild>
            <Link href={`/checkout/${course.id}?type=course`}>Buy Now</Link>
        </Button>
    );
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-headline">All Paid Courses</h1>
        <p className="text-muted-foreground mt-2">Find your next learning adventure.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {courses && courses.length > 0 ? (
          courses.map((course) => {
            const status = enrollmentStatus.get(course.id);
            const isClickable = status === 'approved';

            return (
              <Card key={course.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full">
                <Link href={isClickable ? `/courses/content/${course.id}` : '#'} className={`flex flex-col flex-grow ${!isClickable ? 'cursor-default' : ''}`}>
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
                    <p className="text-lg font-bold text-primary">₹{course.price}</p>
                    {renderButton(course)}
                  </div>
                </CardFooter>
              </Card>
            )
          })
        ) : (
          <p className="col-span-full text-center text-muted-foreground">No paid courses available at the moment.</p>
        )}
      </div>
    </div>
  );
}

    