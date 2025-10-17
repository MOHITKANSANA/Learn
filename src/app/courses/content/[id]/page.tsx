
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, addDoc } from 'firebase/firestore';
import { Loader2, Video, FileText, MessageSquare, BookOpen, ExternalLink, PlayCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

function DoubtSection({ courseId }: { courseId: string }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [doubt, setDoubt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const doubtsQuery = useMemoFirebase(() =>
    firestore ? query(collection(firestore, `courses/${courseId}/doubts`)) : null,
    [firestore, courseId]
  );
  const { data: doubts, isLoading: isLoadingDoubts } = useCollection(doubtsQuery);

  const handleDoubtSubmit = async () => {
    if (!doubt.trim() || !user || !firestore) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, `courses/${courseId}/doubts`), {
        text: doubt,
        author: user.displayName || 'Anonymous',
        authorId: user.uid,
        authorImage: user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`,
        createdAt: new Date(),
      });
      setDoubt('');
      toast({ title: 'Success', description: 'Your doubt has been posted.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to post your doubt.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ask a Doubt</CardTitle>
        <CardDescription>Have a question? Post it here for educators and fellow students to answer.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {user && (
          <div className="space-y-2">
            <Textarea
              placeholder="Type your doubt here..."
              value={doubt}
              onChange={(e) => setDoubt(e.target.value)}
              disabled={isSubmitting}
            />
            <Button onClick={handleDoubtSubmit} disabled={isSubmitting || !doubt.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Post Doubt
            </Button>
          </div>
        )}
        <div className="space-y-4">
          <h3 className="font-semibold">Recent Doubts</h3>
          {isLoadingDoubts ? <Loader2 className="animate-spin" /> :
            doubts && doubts.length > 0 ? doubts.map((d: any) => (
              <div key={d.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                 <Image src={d.authorImage} alt={d.author} width={40} height={40} className="rounded-full" />
                 <div>
                    <p className="font-semibold text-sm">{d.author}</p>
                    <p>{d.text}</p>
                 </div>
              </div>
            )) : (
              <p className="text-center text-muted-foreground py-10">No doubts have been asked yet.</p>
            )
          }
        </div>
      </CardContent>
    </Card>
  );
}


export default function CourseContentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const courseId = params.id as string;
  const { toast } = useToast();


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
        router.push(`/courses`);
    }
  }, [enrollments, isEnrollmentLoading, router, courseId, toast]);

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
                <TabsTrigger value="videos"><Video className="mr-2"/>Videos</TabsTrigger>
                <TabsTrigger value="notes"><FileText className="mr-2"/>Notes</TabsTrigger>
                <TabsTrigger value="tests"><BookOpen className="mr-2"/>Test Series</TabsTrigger>
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
                 <DoubtSection courseId={courseId} />
            </TabsContent>
        </Tabs>
    </div>
  );
}
