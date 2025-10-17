
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Loader2, MessageCircle, FileText, ArrowLeft, Send, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';

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

function ChatSection({ videoId }: { videoId: string }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const chatQuery = useMemoFirebase(() => 
        firestore ? query(collection(firestore, 'video_chat'), where('videoId', '==', videoId)) : null
    , [firestore, videoId]);

    const { data: messages, isLoading } = useCollection(chatQuery);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!message.trim() || !user || !firestore) return;
        setIsSending(true);

        const chatMessage = {
            userId: user.uid,
            authorName: user.displayName || 'Anonymous',
            authorImage: user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`,
            videoId: videoId,
            text: message,
            createdAt: serverTimestamp(),
        };

        try {
            await addDoc(collection(firestore, 'video_chat'), chatMessage);
            setMessage('');
        } catch (error) {
            console.error("Error sending message: ", error);
        } finally {
            setIsSending(false);
        }
    };
    
    const sortedMessages = useMemo(() => {
        if (!messages) return [];
        return [...messages].sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds);
    }, [messages]);

    return (
        <Card className="h-full flex flex-col">
            <CardContent className="p-4 flex-grow overflow-auto space-y-4">
                {isLoading ? <Loader2 className="animate-spin mx-auto" /> :
                    sortedMessages && sortedMessages.length > 0 ? (
                        sortedMessages.map(msg => (
                            <div key={msg.id} className="flex items-start gap-3">
                                <Image src={msg.authorImage} alt={msg.authorName} width={32} height={32} className="rounded-full" />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-sm">{msg.authorName}</p>
                                        <p className="text-xs text-muted-foreground">
                                           {msg.createdAt ? formatDistanceToNow(msg.createdAt.toDate(), { addSuffix: true }) : ''}
                                        </p>
                                    </div>
                                    <p className="text-sm">{msg.text}</p>
                                </div>
                            </div>
                        ))
                    ) : <p className="text-center text-muted-foreground">No messages yet. Start the conversation!</p>
                }
                <div ref={messagesEndRef} />
            </CardContent>
            {user && (
                 <CardContent className="p-4 border-t">
                    <div className="flex gap-2">
                        <Input 
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your message..."
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            disabled={isSending}
                        />
                        <Button onClick={handleSendMessage} disabled={isSending || !message.trim()}>
                            {isSending ? <Loader2 className="animate-spin" /> : <Send />}
                        </Button>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}

function NotesSection({ courseId, videoId }: { courseId: string, videoId: string }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [noteContent, setNoteContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [noteId, setNoteId] = useState<string | null>(null);

    const noteQuery = useMemoFirebase(() =>
        firestore && user ? query(
            collection(firestore, 'video_notes'),
            where('userId', '==', user.uid),
            where('videoId', '==', videoId)
        ) : null,
        [firestore, user, videoId]
    );

    const { data: notes, isLoading } = useCollection(noteQuery);

    useEffect(() => {
        if (notes && notes.length > 0) {
            setNoteContent(notes[0].content);
            setNoteId(notes[0].id);
        } else {
            setNoteContent('');
            setNoteId(null);
        }
    }, [notes]);

    const handleSaveNote = async () => {
        if (!user || !firestore) return;
        setIsSaving(true);
        try {
            if (noteId) { // Update existing note
                const noteRef = doc(firestore, 'video_notes', noteId);
                await updateDoc(noteRef, {
                    content: noteContent,
                    updatedAt: serverTimestamp(),
                });
            } else { // Create new note
                const noteRef = doc(collection(firestore, 'video_notes'));
                await setDoc(noteRef, {
                    id: noteRef.id,
                    userId: user.uid,
                    courseId,
                    videoId,
                    content: noteContent,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
                setNoteId(noteRef.id);
            }
            toast({ title: 'Success', description: 'Note saved successfully.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save note.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className="h-full flex flex-col">
            <CardContent className="p-4 flex-grow">
                {isLoading ? <Loader2 className="animate-spin mx-auto" /> :
                 <Textarea
                    placeholder="Write your personal notes for this video here..."
                    className="w-full h-full resize-none border-0 focus:ring-0 focus-visible:ring-0"
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    disabled={isSaving}
                />}
            </CardContent>
             {user && (
                 <CardContent className="p-4 border-t">
                    <Button onClick={handleSaveNote} disabled={isSaving} className="w-full">
                        {isSaving ? <Loader2 className="animate-spin" /> : <Save className="mr-2"/>}
                        Save Note
                    </Button>
                </CardContent>
            )}
        </Card>
    );
}


export default function VideoPlayerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const videoId = params.id as string;
  const courseId = searchParams.get('courseId');

  const firestore = useFirestore();

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
        router.push(`/courses/content/${courseId}`);
      }
    }
  }, [course, videoId, courseId, router]);


  if (isLoading || !video) {
    return <div className="flex justify-center items-center h-screen bg-background"><Loader2 className="h-16 w-16 animate-spin" /></div>;
  }
  
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
       <div className="flex-shrink-0 p-2 flex items-center gap-4 border-b">
            <Button variant="ghost" size="icon" asChild>
                <Link href={`/courses/content/${courseId}`}>
                    <ArrowLeft />
                </Link>
            </Button>
            <h1 className="text-lg font-semibold truncate">{video.title}</h1>
       </div>

      <div className="w-full max-w-7xl mx-auto flex-grow flex flex-col md:flex-row gap-4 p-4">
        <div className="flex-grow-[3] flex-shrink-0">
             {youtubeVideoId ? (
                <YouTubePlayer videoId={youtubeVideoId} />
             ) : (
                <div className="aspect-video w-full bg-muted flex items-center justify-center rounded-lg">
                    <p className="text-destructive">Invalid YouTube Video Link</p>
                </div>
             )}
        </div>

        <div className="flex-grow-[2] flex-shrink-0 min-h-[300px] md:min-h-0">
          <Tabs defaultValue="chat" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat"><MessageCircle className="mr-2"/>Chat</TabsTrigger>
              <TabsTrigger value="notes"><FileText className="mr-2"/>Notes</TabsTrigger>
            </TabsList>
            <TabsContent value="chat" className="flex-grow mt-4">
                {videoId && <ChatSection videoId={videoId}/>}
            </TabsContent>
            <TabsContent value="notes" className="flex-grow mt-4">
               {videoId && courseId && <NotesSection courseId={courseId} videoId={videoId}/>}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
