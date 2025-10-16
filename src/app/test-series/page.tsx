
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function TestSeriesPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const testSeriesQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'test_series'), where('isStandalone', '==', true)) : null, 
    [firestore]
  );
  const { data: testSeries, isLoading } = useCollection(testSeriesQuery);

  const handleFreeEnrollment = async (item: any) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to enroll.' });
      return;
    }

    const enrollmentRef = doc(collection(firestore, 'enrollments'));
    const enrollmentData = {
      id: enrollmentRef.id,
      studentId: user.uid,
      itemId: item.id,
      itemType: 'testSeries',
      enrollmentDate: serverTimestamp(),
      isApproved: true, 
      itemName: item.title,
      itemImage: item.imageUrl,
    };

    try {
      await setDoc(enrollmentRef, enrollmentData);
      toast({ title: 'Success!', description: `You have enrolled in ${item.title}.` });
      router.push('/my-library');
    } catch (error) {
      console.error("Free enrollment error: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not enroll in the test series.' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-headline">Test Series</h1>
        <p className="text-muted-foreground mt-2">Challenge yourself with our expert-curated test series.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {testSeries && testSeries.length > 0 ? (
          testSeries.map((item) => (
            <Card key={item.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="p-0">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  width={300}
                  height={170}
                  className="object-cover w-full h-40"
                />
              </CardHeader>
              <CardContent className="flex-grow p-4">
                <CardTitle className="text-lg font-headline mb-1">{item.title}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
              </CardContent>
              <CardFooter className="p-4 flex justify-between items-center">
                <p className="text-lg font-bold text-primary">{item.isFree ? 'Free' : `₹${item.price}`}</p>
                {item.isFree ? (
                  <Button onClick={() => handleFreeEnrollment(item)}>Start Now</Button>
                ) : (
                  <Button asChild>
                    <Link href={`/checkout/${item.id}?type=testSeries`}>Buy Now</Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))
        ) : (
          <p className="col-span-full text-center text-muted-foreground">No test series available at the moment.</p>
        )}
      </div>
    </div>
  );
}

    