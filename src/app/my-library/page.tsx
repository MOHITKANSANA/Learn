
'use client';

import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Loader2, BookOpen, PlayCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

export default function MyLibraryPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const enrollmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid), where('isApproved', '==', true));
  }, [firestore, user]);

  const { data: enrollments, isLoading } = useCollection(enrollmentsQuery);

  const courses = enrollments?.filter(e => e.itemType === 'course') || [];
  const ebooks = enrollments?.filter(e => e.itemType === 'ebook') || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-headline">My Library</h1>
        <p className="text-muted-foreground mt-2">All your enrolled courses and e-books in one place.</p>
      </div>

      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="courses">Courses ({courses.length})</TabsTrigger>
          <TabsTrigger value="ebooks">E-books ({ebooks.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="courses">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {courses.length > 0 ? courses.map(item => (
              <Card key={item.id} className="overflow-hidden">
                <Image src={item.itemImage} alt={item.itemName} width={400} height={225} className="w-full h-48 object-cover" />
                <CardHeader>
                  <CardTitle>{item.itemName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href={`/courses/${item.itemId}`}>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Start Learning
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )) : <p className="col-span-full text-center text-muted-foreground">You have not enrolled in any courses yet.</p>}
          </div>
        </TabsContent>
        <TabsContent value="ebooks">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
                 {ebooks.length > 0 ? ebooks.map(item => (
                     <Card key={item.id} className="overflow-hidden">
                        <Image src={item.itemImage} alt={item.itemName} width={300} height={400} className="w-full h-60 object-cover" />
                        <CardHeader>
                            <CardTitle className="text-lg">{item.itemName}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button asChild className="w-full">
                                <Link href={`/ebooks/read/${item.itemId}`}>
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    Read Now
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                 )) : <p className="col-span-full text-center text-muted-foreground">You have not acquired any e-books yet.</p>}
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    