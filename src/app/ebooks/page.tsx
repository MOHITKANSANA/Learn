
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function EbooksPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const ebooksQuery = useMemoFirebase(() => firestore ? collection(firestore, 'ebooks') : null, [firestore]);
  const { data: ebooks, isLoading } = useCollection(ebooksQuery);

  const handleFreeEnrollment = async (ebook: any) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to enroll.' });
      return;
    }

    const enrollmentRef = doc(collection(firestore, `users/${user.uid}/enrollments`));
    const enrollmentData = {
      id: enrollmentRef.id,
      studentId: user.uid,
      itemId: ebook.id,
      itemType: 'ebook',
      enrollmentDate: serverTimestamp(),
      isApproved: true, // Auto-approve free items
      itemName: ebook.title,
      itemImage: ebook.imageUrl,
    };

    try {
      await setDoc(enrollmentRef, enrollmentData);
      toast({ title: 'Success!', description: `You have enrolled in ${ebook.title}.` });
      router.push('/my-library');
    } catch (error) {
      console.error("Free enrollment error: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not enroll in the e-book.' });
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
        <h1 className="text-4xl font-bold font-headline">E-books</h1>
        <p className="text-muted-foreground mt-2">Browse our collection of digital books.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {ebooks && ebooks.length > 0 ? (
          ebooks.map((ebook) => (
            <Card key={ebook.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="p-0">
                <Image
                  src={ebook.imageUrl}
                  alt={ebook.title}
                  width={300}
                  height={400}
                  className="object-cover w-full h-60"
                />
              </CardHeader>
              <CardContent className="flex-grow p-4">
                <CardTitle className="text-lg font-headline mb-1">{ebook.title}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2">{ebook.description}</p>
              </CardContent>
              <CardFooter className="p-4 flex justify-between items-center">
                <p className="text-lg font-bold text-primary">{ebook.isFree ? 'Free' : `₹${ebook.price}`}</p>
                {ebook.isFree ? (
                  <Button onClick={() => handleFreeEnrollment(ebook)}>Read Now</Button>
                ) : (
                  <Button asChild>
                    <Link href={`/checkout/${ebook.id}?type=ebook`}>Buy Now</Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))
        ) : (
          <p className="col-span-full text-center text-muted-foreground">No e-books available at the moment.</p>
        )}
      </div>
    </div>
  );
}

    