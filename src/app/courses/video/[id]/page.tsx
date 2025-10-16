'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, MessageCircle, FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

function YouTubePlayer({ videoId }: { videoId: string }) {  
  return (
    <div className="aspect-video w-full">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      ></iframe>
    </div>
  );
}

export default function VideoPlayerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const videoId = params.id as string;
  const courseId = searchParams.get('courseId');

  const firestore = useFirestore();
  const { user } = useUser();

  const courseRef = useMemoFirebase(() =>
    firestore && courseId ? doc(firestore, 'courses', courseId) : null,
    [firestore, courseId]
  );
  const { data: course, isLoading } = useDoc(courseRef);

  const [video, setVideo] = useState<any>(null);

  useEffect(() => {
    if (course && course.videos) {
      const foundVideo = course.videos.find((v: any) => v.id === videoId);
      if (foundVideo) {
        setVideo(foundVideo);
      } else {
        // Handle case where video is not found in the course
        router.push(`/courses/content/${courseId}`);
      }
    }
  }, [course, videoId, courseId, router]);


  if (isLoading || !video) {
    return <div className="flex justify-center items-center h-screen bg-background"><Loader2 className="h-16 w-16 animate-spin" /></div>;
  }
  
  // Extract YouTube video ID from URL
  let youtubeVideoId = '';
  try {
    const url = new URL(video.url);
    if (url.hostname === 'youtu.be') {
        youtubeVideoId = url.pathname.slice(1);
    } else {
        youtubeVideoId = url.searchParams.get('v') || '';
    }
  } catch (error) {
    console.error('Invalid YouTube URL:', video.url);
  }


  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
       <div className="flex-shrink-0 p-2 flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
                <Link href={`/courses/content/${courseId}`}>
                    <ArrowLeft />
                </Link>
            </Button>
            <h1 className="text-lg font-semibold truncate">{video.title}</h1>
       </div>

      <div className="w-full max-w-5xl mx-auto flex-grow flex flex-col">
        <div className="flex-shrink-0">
             {youtubeVideoId ? (
                <YouTubePlayer videoId={youtubeVideoId} />
             ) : (
                <div className="aspect-video w-full bg-muted flex items-center justify-center">
                    <p className="text-destructive">Invalid YouTube Video Link</p>
                </div>
             )}
        </div>

        <div className="flex-grow overflow-auto p-4">
          <Tabs defaultValue="chat" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat"><MessageCircle className="mr-2"/>Chat</TabsTrigger>
              <TabsTrigger value="notes"><FileText className="mr-2"/>Notes</TabsTrigger>
            </TabsList>
            <TabsContent value="chat" className="flex-grow mt-4">
              <Card className="h-full">
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">Live chat coming soon!</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="notes" className="flex-grow mt-4">
               <Card className="h-full">
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">Take personal notes here. Feature coming soon!</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// This page should hide the global layout
export function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
