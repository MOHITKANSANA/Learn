
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, addDoc, serverTimestamp, query, orderBy, updateDoc, deleteDoc } from 'firebase/firestore';
import { Loader2, Send, X, Check, Brain, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

function ChatMessages({ doubtId }: { doubtId: string }) {
    const firestore = useFirestore();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const messagesQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, `live_doubts/${doubtId}/messages`), orderBy('createdAt', 'asc')) : null,
        [firestore, doubtId]
    );
    const { data: messages, isLoading } = useCollection(messagesQuery);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    return (
        <div className="space-y-4 p-4 flex-grow overflow-y-auto">
            {isLoading && <Loader2 className="mx-auto animate-spin" />}
            {messages?.map(msg => (
                <div key={msg.id} className="flex items-start gap-3">
                     <Avatar className="h-8 w-8">
                        <AvatarImage src={msg.authorImage} />
                        <AvatarFallback>{msg.authorName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold text-sm">{msg.authorName}</p>
                        <div className="bg-muted p-3 rounded-lg mt-1">
                            <p className="text-sm">{msg.text}</p>
                        </div>
                         <p className="text-xs text-muted-foreground mt-1">
                            {msg.createdAt ? formatDistanceToNow(msg.createdAt.toDate(), { addSuffix: true }) : '...'}
                        </p>
                    </div>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
}


export default function DoubtRoomPage() {
    const params = useParams();
    const doubtId = params.id as string;
    const { user } = useUser();
    const firestore = useFirestore();
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const { toast } = useToast();
    const router = useRouter();


    const doubtRef = useMemoFirebase(
        () => firestore && doubtId ? doc(firestore, 'live_doubts', doubtId) : null,
        [firestore, doubtId]
    );
    const { data: doubt, isLoading } = useDoc(doubtRef);

    const isStudent = user?.uid === doubt?.studentId;
    const isSolver = user?.uid === doubt?.solverId;

    const handleSendMessage = async () => {
        if (!user || !firestore || !message.trim()) return;
        setIsSending(true);
        try {
            await addDoc(collection(firestore, `live_doubts/${doubtId}/messages`), {
                authorId: user.uid,
                authorName: user.displayName,
                authorImage: user.photoURL,
                text: message,
                createdAt: serverTimestamp()
            });
            setMessage('');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to send message.' });
        } finally {
            setIsSending(false);
        }
    };
    
    const handleEndSession = async (markAsSolved: boolean) => {
        if (!firestore) return;

        if (markAsSolved) {
            await updateDoc(doubtRef, { status: 'solved' });
            toast({ title: 'Session Ended', description: 'This doubt has been marked as solved.' });
        } else {
            // Re-open the doubt for other solvers
            await updateDoc(doubtRef, { status: 'open', solverId: null, solverName: null, solverImage: null });
            toast({ title: 'Session Ended', description: 'This doubt is now open for other solvers.' });
        }
        router.push('/doubts');
    }

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin" /></div>;
    }
    
    if (!doubt) {
        return <div className="text-center mt-10">Doubt not found or has been deleted.</div>
    }

    return (
        <div className="max-w-4xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
            <Card className="flex-grow flex flex-col">
                <CardHeader className="border-b">
                    <div className="flex justify-between items-center">
                        <div>
                             <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-6 w-6 text-primary" />
                                Doubt Room
                            </CardTitle>
                             <p className="text-sm text-muted-foreground mt-2">{doubt.text}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-xs text-muted-foreground">Asked by</p>
                             <div className="flex items-center gap-2">
                                 <p className="font-semibold">{doubt.studentName}</p>
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={doubt.studentImage} />
                                    <AvatarFallback>{doubt.studentName?.[0]}</AvatarFallback>
                                </Avatar>
                            </div>
                        </div>
                    </div>
                   
                    {doubt.solverId && (
                         <div className="pt-2 text-sm flex items-center justify-center gap-2 text-muted-foreground border-t mt-2">
                            <Brain className="h-4 w-4 text-green-500" />
                            <span><span className="font-semibold text-green-500">{doubt.solverName}</span> is solving this doubt.</span>
                        </div>
                    )}
                </CardHeader>

                <ChatMessages doubtId={doubtId} />

                {isSolver || isStudent ? (
                    <CardContent className="p-4 border-t">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Type your message..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                disabled={isSending}
                            />
                            <Button onClick={handleSendMessage} disabled={isSending || !message.trim()}>
                                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </div>
                        {(isSolver || isStudent) && (
                            <div className="flex justify-center gap-4 mt-4">
                                <Button variant="destructive" size="sm" onClick={() => handleEndSession(false)}>
                                    <X className="mr-2 h-4 w-4"/> End Session
                                </Button>
                                {isSolver && (
                                     <Button variant="default" size="sm" onClick={() => handleEndSession(true)} className="bg-green-600 hover:bg-green-700">
                                        <Check className="mr-2 h-4 w-4"/> Mark as Solved
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                ) : (
                    <CardContent className="p-4 border-t text-center text-muted-foreground text-sm">
                        You are viewing this doubt as a spectator.
                    </CardContent>
                )}
            </Card>
        </div>
    );
}

