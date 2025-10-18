
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, addDoc, serverTimestamp, query, orderBy, updateDoc, deleteDoc } from 'firebase/firestore';
import { Loader2, Send, X, Check, Brain, MessageSquare, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const fileToDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
});


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
                            {msg.imageUrl ? (
                                <Image src={msg.imageUrl} alt="Uploaded image" width={200} height={200} className="rounded-md max-w-full h-auto" />
                            ) : (
                                <p className="text-sm">{msg.text}</p>
                            )}
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
    const [imageFile, setImageFile] = useState<File | null>(null);
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

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            setMessage(''); // Clear text message if image is selected
        }
    };


    const handleSendMessage = async () => {
        if (!user || !firestore || (!message.trim() && !imageFile)) return;
        setIsSending(true);
        try {
            let imageUrl: string | null = null;
            if (imageFile) {
                imageUrl = await fileToDataUrl(imageFile);
            }

            await addDoc(collection(firestore, `live_doubts/${doubtId}/messages`), {
                authorId: user.uid,
                authorName: user.displayName,
                authorImage: user.photoURL,
                text: message,
                imageUrl: imageUrl,
                createdAt: serverTimestamp()
            });

            setMessage('');
            setImageFile(null);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to send message.' });
        } finally {
            setIsSending(false);
        }
    };
    
    const handleEndSession = async (markAsSolved: boolean) => {
        if (!firestore || !doubtRef) return;

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
    
    const handleReDoubt = () => {
        const phoneNumber = "918949814095"; // Replace with your target phone number
        const doubtText = `नमस्ते, मुझे मेरे संदेह (ID: ${doubtId}) के समाधान में और सहायता चाहिए: "${doubt.text}"`;
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(doubtText)}`;
        window.open(whatsappUrl, '_blank');
    };


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
                                onChange={(e) => { setMessage(e.target.value); setImageFile(null); }}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                disabled={isSending || !!imageFile}
                            />
                             <Button asChild variant="ghost" size="icon" className="relative">
                                 <>
                                <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} disabled={isSending} />
                                <ImageIcon className="h-5 w-5" />
                                </>
                            </Button>
                            <Button onClick={handleSendMessage} disabled={isSending || (!message.trim() && !imageFile)}>
                                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </div>
                         {imageFile && <p className="text-xs text-muted-foreground mt-2">Image selected: {imageFile.name}</p>}
                        {(isSolver || (isStudent && doubt.status === 'solved')) && (
                            <div className="flex justify-center gap-4 mt-4">
                               {isStudent && doubt.status === 'solved' && (
                                     <Button variant="outline" size="sm" onClick={handleReDoubt}>
                                        <RefreshCw className="mr-2 h-4 w-4"/> Re-Doubt
                                    </Button>
                               )}
                                {isSolver && (
                                    <>
                                     <Button variant="destructive" size="sm" onClick={() => handleEndSession(false)}>
                                        <X className="mr-2 h-4 w-4"/> End Session
                                    </Button>
                                    <Button variant="default" size="sm" onClick={() => handleEndSession(true)} className="bg-green-600 hover:bg-green-700">
                                        <Check className="mr-2 h-4 w-4"/> Mark as Solved
                                    </Button>
                                    </>
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
