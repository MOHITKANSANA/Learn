
'use client';

import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, deleteDoc, doc } from 'firebase/firestore';
import { Loader2, BookOpen, PlayCircle, FileText, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { useMemo } from 'react';


export default function MyLibraryPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const enrollmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid), where('isApproved', '==', true));
  }, [firestore, user]);

  const { data: enrollments, isLoading, forceRefresh } = useCollection(enrollmentsQuery);

  const handleUnenroll = async (enrollmentId: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'enrollments', enrollmentId));
      toast({ title: 'Success', description: 'You have been un-enrolled.' });
      forceRefresh(); // Refresh the data after deletion
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to un-enroll.' });
    }
  };
  
  // Memoize to prevent re-computation on every render
  const { courses, pdfs, testSeries } = useMemo(() => {
    const uniqueEnrollments = new Map<string, any>();
    enrollments?.forEach(e => {
        // Use itemId as the key to filter out duplicate enrollments for the same course/item
        if (!uniqueEnrollments.has(e.itemId)) {
            uniqueEnrollments.set(e.itemId, e);
        }
    });

    const uniqueEnrolledItems = Array.from(uniqueEnrollments.values());

    return {
      courses: uniqueEnrolledItems?.filter(e => e.itemType === 'course') || [],
      pdfs: uniqueEnrolledItems?.filter(e => e.itemType === 'ebook' || e.itemType === 'previous-year-paper') || [],
      testSeries: uniqueEnrolledItems?.filter(e => e.itemType === 'testSeries') || [],
    };
  }, [enrollments]);


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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="courses">Courses ({courses.length})</TabsTrigger>
          <TabsTrigger value="pdfs">PDFs ({pdfs.length})</TabsTrigger>
          <TabsTrigger value="test-series">Test Series ({testSeries.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="courses">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {courses.length > 0 ? courses.map(item => (
              <Card key={item.id} className="overflow-hidden flex flex-col">
                <Image src={item.itemImage} alt={item.itemName} width={400} height={225} className="w-full h-48 object-cover" />
                <CardHeader>
                  <CardTitle>{item.itemName}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <Button asChild className="w-full">
                    <Link href={`/courses/content/${item.itemId}`}>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Start Learning
                    </Link>
                  </Button>
                </CardContent>
                <CardFooter>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        <Trash2 className="mr-2 h-4 w-4" /> Un-enroll
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove the course from your library. You will need to purchase it again to regain access.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleUnenroll(item.id)}>Continue</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            )) : <p className="col-span-full text-center text-muted-foreground py-10">You have not enrolled in any courses yet.</p>}
          </div>
        </TabsContent>
        <TabsContent value="pdfs">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
                 {pdfs.length > 0 ? pdfs.map(item => (
                     <Card key={item.id} className="overflow-hidden flex flex-col">
                        <Image src={item.itemImage} alt={item.itemName} width={300} height={400} className="w-full h-60 object-cover" />
                        <CardHeader className="flex-grow">
                            <CardTitle className="text-lg">{item.itemName}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button asChild className="w-full">
                                <Link href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    Read Now
                                </Link>
                            </Button>
                        </CardContent>
                         <CardFooter>
                            <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="destructive" className="w-full"><Trash2 className="mr-2 h-4 w-4" /> Remove</Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>This will permanently remove the item from your library.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleUnenroll(item.id)}>Continue</AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardFooter>
                    </Card>
                 )) : <p className="col-span-full text-center text-muted-foreground py-10">You have not acquired any PDFs yet.</p>}
            </div>
        </TabsContent>
         <TabsContent value="test-series">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                 {testSeries.length > 0 ? testSeries.map(item => (
                     <Card key={item.id} className="overflow-hidden flex flex-col">
                        <Image src={item.itemImage} alt={item.itemName} width={400} height={225} className="w-full h-48 object-cover" />
                        <CardHeader className="flex-grow">
                            <CardTitle>{item.itemName}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button asChild className="w-full">
                                <Link href={`/test-series/${item.itemId}`}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Start Test
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                 )) : <p className="col-span-full text-center text-muted-foreground py-10">You have not enrolled in any test series yet.</p>}
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
