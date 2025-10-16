
'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, setDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { Loader2, PlayCircle, Lock } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const courseId = params.id as string;
  const [isEnrolled, setIsEnrolled] = useState(false);

  const courseRef = useMemoFirebase(() => 
    firestore && courseId ? doc(firestore, 'courses', courseId) : null,
    [firestore, courseId]
  );
  const { data: course, isLoading: isCourseLoading } = useDoc(courseRef);

  const enrollmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'enrollments'),
      where('studentId', '==', user.uid),
      where('itemId', '==', courseId)
    );
  }, [firestore, user, courseId]);

  const { data: enrollments, isLoading: isEnrollmentsLoading } = useCollection(enrollmentsQuery);

  useEffect(() => {
    if (enrollments && enrollments.length > 0) {
      setIsEnrolled(true);
    } else {
      setIsEnrolled(false);
    }
  }, [enrollments]);

  const handleFreeEnrollment = async () => {
    if (!user || !firestore || !course) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to enroll.' });
      return;
    }
     if (isEnrolled) {
      toast({ title: 'Already Enrolled', description: 'You are already enrolled in this course.' });
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


  if (isCourseLoading || isEnrollmentsLoading) {
    return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="h-16 w-16 animate-spin" /></div>;
  }

  if (!course) {
    return <div className="text-center">Course not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card className="overflow-hidden">
        <CardHeader className="p-0">
          <Image src={course.imageUrl} alt={course.title} width={1200} height={400} className="w-full h-64 object-cover"/>
        </CardHeader>
        <CardContent className="p-6">
          <CardTitle className="text-3xl font-bold font-headline mb-2">{course.title}</CardTitle>
          <CardDescription className="text-lg text-muted-foreground mb-4">{course.description}</CardDescription>
          <div className="flex items-center justify-between mt-6">
             <p className="text-3xl font-bold text-primary">{course.isFree ? 'Free' : `₹${course.price}`}</p>
             {isEnrolled ? (
                <Button size="lg" asChild>
                    <Link href={`/courses/content/${course.id}`}>
                        <PlayCircle className="mr-2 h-5 w-5" />
                        Start Learning
                    </Link>
                </Button>
             ) : course.isFree ? (
                <Button size="lg" onClick={handleFreeEnrollment}>
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Enroll Now
                </Button>
             ) : (
                <Button size="lg" asChild>
                    <Link href={`/checkout/${course.id}?type=course`}>
                        <Lock className="mr-2 h-5 w-5" />
                        Buy Now
                    </Link>
                </Button>
             )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
