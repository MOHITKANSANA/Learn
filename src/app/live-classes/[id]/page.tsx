
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, MessageCircle, ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import Image from 'next/image';
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
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const chatQuery = useMemoFirebase(() =>
        firestore ? query(collection(firestore, 'video_chat'), where('videoId', '==', videoId)) : null,
        [firestore, videoId]
    );

    const { data: messages, isLoading } = useCollection(chatQuery);

    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
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
        <div className="h-full flex flex-col">
            <div ref={messagesContainerRef} className="flex-grow overflow-auto p-4 space-y-4">
                {isLoading ? <Loader2 className="animate-spin mx-auto" /> :
                    sortedMessages && sortedMessages.length > 0 ? (
                        sortedMessages.map(msg => (
                            <div key={msg.id} className="flex items-start gap-3">
                                <Image src={msg.authorImage} alt={msg.authorName} width={32} height={32} className="rounded-full" />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-sm">{msg.authorName}</p>
                                    </div>
                                    <p className="text-sm">{msg.text}</p>
                                </div>
                            </div>
                        ))
                    ) : <p className="text-center text-muted-foreground">No messages yet. Start the conversation!</p>
                }
            </div>
            {user && (
                <div className="p-4 border-t bg-background">
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
                </div>
            )}
        </div>
    );
}

export default function LiveClassPlayerPage() {
    const params = useParams();
    const searchParams = useSearchParams();

    const liveClassId = params.id as string;
    const youtubeVideoId = searchParams.get('videoId');

    const firestore = useFirestore();

    const liveClassRef = useMemoFirebase(() =>
        firestore && liveClassId ? doc(firestore, 'live_classes', liveClassId) : null,
        [firestore, liveClassId]
    );
    const { data: liveClass, isLoading } = useDoc(liveClassRef);

    if (isLoading || !liveClass) {
        return <div className="flex justify-center items-center h-screen bg-background"><Loader2 className="h-16 w-16 animate-spin" /></div>;
    }

    return (
        <div className="fixed inset-0 bg-background z-50 flex flex-col">
            <div className="flex-shrink-0 p-2 flex items-center gap-4 border-b">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/live-classes">
                        <ArrowLeft />
                    </Link>
                </Button>
                <h1 className="text-lg font-semibold truncate">{liveClass.title}</h1>
            </div>

            <div className="w-full max-w-7xl mx-auto flex-grow flex flex-col md:flex-row gap-4 p-4 min-h-0">
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
                        <TabsList className="grid w-full grid-cols-1">
                            <TabsTrigger value="chat"><MessageCircle className="mr-2" />Live Chat</TabsTrigger>
                        </TabsList>
                        <TabsContent value="chat" className="flex-grow mt-4 min-h-0">
                           <Card className="h-full w-full">
                             {liveClassId && <ChatSection videoId={liveClassId} />}
                           </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}

    