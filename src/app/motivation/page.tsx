
'use client';
import { Sparkles, Loader2, PlayCircle } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo } from 'react';

function YouTubePlayer({ videoId }: { videoId: string }) {
  return (
    <div className="aspect-video w-full rounded-lg overflow-hidden">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      ></iframe>
    </div>
  );
}

export default function MotivationPage() {
  const firestore = useFirestore();
  const contentQuery = useMemoFirebase(() => firestore ? collection(firestore, 'motivational_content') : null, [firestore]);
  const { data: content, isLoading: isLoadingContent } = useCollection(contentQuery);

  const quotes = useMemo(() => content?.filter(item => item.type === 'quote') || [], [content]);
  const videos = useMemo(() => content?.filter(item => item.type === 'video') || [], [content]);

  const randomQuote = useMemo(() => {
    if (!quotes || quotes.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
  }, [quotes]);

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      <div className="text-center flex flex-col items-center justify-center">
        <Sparkles className="h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-bold font-headline">Stay Motivated!</h1>
        {isLoadingContent ? (
          <Loader2 className="h-8 w-8 animate-spin mt-6" />
        ) : (
          randomQuote ? (
            <Card className="mt-8 w-full bg-primary/10 border-primary/20">
              <CardContent className="p-6">
                <blockquote className="text-xl italic">
                  "{randomQuote.text}"
                </blockquote>
                {randomQuote.author && (
                  <p className="text-right mt-4 text-muted-foreground">- {randomQuote.author}</p>
                )}
              </CardContent>
            </Card>
          ) : (
             <p className="text-muted-foreground mt-4 text-lg max-w-md">
              "सफलता का रहस्य आगे बढ़ना है।" – मार्क ट्वेन
            </p>
          )
        )}
      </div>

       <div>
        <h2 className="text-2xl font-bold mb-4 text-center">Motivational Videos</h2>
         {isLoadingContent ? (
            <Loader2 className="h-8 w-8 animate-spin mt-6 mx-auto" />
         ) : videos.length > 0 ? (
            <div className="space-y-6">
                {videos.map(video => {
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
                        return null;
                    }

                    if (!youtubeVideoId) return null;

                    return (
                        <Card key={video.id}>
                            <CardContent className="p-4">
                               <YouTubePlayer videoId={youtubeVideoId} />
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
         ): (
            <p className="text-center text-muted-foreground">No videos available right now. Check back later!</p>
         )}
       </div>

    </div>
  );
}

    