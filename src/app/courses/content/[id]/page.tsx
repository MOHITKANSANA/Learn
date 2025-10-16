'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { Loader2, Video, FileText, MessageSquare, BookOpen, ExternalLink, PlayCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CourseContentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const courseId = params.id as string;

  const courseRef = useMemoFirebase(() => 
    firestore && courseId ? doc(firestore, 'courses', courseId) : null,
    [firestore, courseId]
  );
  const { data: course, isLoading: isCourseLoading } = useDoc(courseRef);

  // Check enrollment
  const enrollmentQuery = useMemoFirebase(() => 
    firestore && user ? query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid), where('itemId', '==', courseId)) : null,
    [firestore, user, courseId]
  );
  const { data: enrollments, isLoading: isEnrollmentLoading } = useCollection(enrollmentQuery);

  useEffect(() => {
    if (!isEnrollmentLoading && (!enrollments || enrollments.length === 0)) {
        toast({
            variant: 'destructive',
            title: 'Access Denied',
            description: 'You are not enrolled in this course.',
        });
        router.push(`/courses/${courseId}`);
    }
  }, [enrollments, isEnrollmentLoading, router, courseId]);

  if (isCourseLoading || isEnrollmentLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin" /></div>;
  }

  if (!course) {
    return <div className="text-center mt-10">Course not found.</div>;
  }
  
  const { videos = [], notes = [], tests = [] } = course;

  return (
    <div className="max-w-5xl mx-auto">
        <header className="mb-8 text-center">
            <h1 className="text-4xl font-bold font-headline">{course.title}</h1>
            <p className="text-muted-foreground mt-2">{course.description}</p>
        </header>
        
        <Tabs defaultValue="videos" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="videos"><Video className="mr-2"/>Videos ({videos.length})</TabsTrigger>
                <TabsTrigger value="notes"><FileText className="mr-2"/>Notes ({notes.length})</TabsTrigger>
                <TabsTrigger value="tests"><BookOpen className="mr-2"/>Test Series ({tests.length})</TabsTrigger>
                <TabsTrigger value="doubts"><MessageSquare className="mr-2"/>Doubts</TabsTrigger>
            </TabsList>
            
            <TabsContent value="videos" className="mt-6">
                <div className="space-y-4">
                    {videos.length > 0 ? videos.map((video: any, index: number) => (
                        <Card key={index}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <p className="font-semibold">{video.title}</p>
                                <Button asChild>
                                    <Link href={`/courses/video/${video.id}?courseId=${courseId}`}>
                                        <PlayCircle className="mr-2"/>
                                        Watch Video
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )) : (
                        <p className="text-center text-muted-foreground py-10">No videos available for this course yet.</p>
                    )}
                </div>
            </TabsContent>
            
            <TabsContent value="notes" className="mt-6">
                 <div className="space-y-4">
                    {notes.length > 0 ? notes.map((note: any, index: number) => (
                        <Card key={index}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <p className="font-semibold">{note.title}</p>
                                <Button asChild variant="outline">
                                    <a href={note.url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="mr-2"/>
                                        Open PDF
                                    </a>
                                </Button>
                            </CardContent>
                        </Card>
                    )) : (
                        <p className="text-center text-muted-foreground py-10">No notes available for this course yet.</p>
                    )}
                </div>
            </TabsContent>

            <TabsContent value="tests" className="mt-6">
                <div className="space-y-4">
                     {tests.length > 0 ? tests.map((test: any, index: number) => (
                        <Card key={index}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <p className="font-semibold">{test.title}</p>
                                <Button disabled>Start Test</Button>
                            </CardContent>
                        </Card>
                    )) : (
                        <p className="text-center text-muted-foreground py-10">No tests available for this course yet.</p>
                    )}
                </div>
            </TabsContent>

             <TabsContent value="doubts" className="mt-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Ask a Doubt</CardTitle>
                        <CardDescription>Have a question? Post it here for educators and fellow students to answer.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center text-muted-foreground py-10">
                            <p>Doubt forum coming soon!</p>
                        </div>
                    </CardContent>
                 </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}

// We need a toast definition for the useEffect
import { useToast } from '@/hooks/use-toast';
const { toast } = useToast();
