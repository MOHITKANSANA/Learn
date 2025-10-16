'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function PreviousPapersPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const papersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'previousYearPapers') : null, [firestore]);
  const { data: papers, isLoading } = useCollection(papersQuery);

  const handleFreeEnrollment = async (paper: any) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to enroll.' });
      return;
    }

    const enrollmentRef = doc(collection(firestore, 'enrollments'));
    const enrollmentData = {
      id: enrollmentRef.id,
      studentId: user.uid,
      itemId: paper.id,
      itemType: 'previous-year-paper',
      enrollmentDate: serverTimestamp(),
      isApproved: true, // Auto-approve free items
      itemName: paper.title,
      itemImage: paper.imageUrl,
      fileUrl: paper.fileUrl,
    };

    try {
      await setDoc(enrollmentRef, enrollmentData);
      toast({ title: 'Success!', description: `You now have access to ${paper.title}.` });
      router.push('/my-library');
    } catch (error) {
      console.error("Free enrollment error: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not get access to the paper.' });
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
        <h1 className="text-4xl font-bold font-headline">Previous Year Papers</h1>
        <p className="text-muted-foreground mt-2">Boost your preparation with our collection of past papers.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {papers && papers.length > 0 ? (
          papers.map((paper) => (
            <Card key={paper.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="p-0">
                <Image
                  src={paper.imageUrl}
                  alt={paper.title}
                  width={300}
                  height={170}
                  className="object-cover w-full h-40"
                />
              </CardHeader>
              <CardContent className="flex-grow p-4">
                <CardTitle className="text-lg font-headline mb-1">{paper.title}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2">{paper.description}</p>
              </CardContent>
              <CardFooter className="p-4 flex justify-between items-center">
                <p className="text-lg font-bold text-primary">{paper.isFree ? 'Free' : `₹${paper.price}`}</p>
                {paper.isFree ? (
                   <Button onClick={() => handleFreeEnrollment(paper)}>
                     <Download className="mr-2 h-4 w-4" />
                     Get Now
                   </Button>
                ) : (
                  <Button asChild>
                    <Link href={`/checkout/${paper.id}?type=previous-year-paper`}>Buy Now</Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))
        ) : (
          <p className="col-span-full text-center text-muted-foreground">No papers available at the moment.</p>
        )}
      </div>
    </div>
  );
}
