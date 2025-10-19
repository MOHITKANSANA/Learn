
'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ImagePlus, Send, MessageSquare } from 'lucide-react';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

export default function PublicSquarePage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    const [message, setMessage] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isSending, setIsSending] = useState(false);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const messagesQuery = useMemoFirebase(() => 
        firestore ? query(collection(firestore, 'public_chat'), orderBy('createdAt', 'desc')) : null,
        [firestore]
    );
    const { data: messages, isLoading } = useCollection(messagesQuery);

    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const fileToDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });

    const handleSendMessage = async () => {
        if (!user || !firestore || (!message.trim() && !imageFile)) return;
        setIsSending(true);

        let imageUrl: string | null = null;
        if (imageFile) {
            try {
                imageUrl = await fileToDataUrl(imageFile);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to upload image.' });
                setIsSending(false);
                return;
            }
        }

        const messageData = {
            authorId: user.uid,
            authorName: user.displayName || 'Anonymous',
            authorImage: user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`,
            text: message,
            imageUrl,
            createdAt: serverTimestamp(),
        };

        try {
            await setDoc(doc(collection(firestore, 'public_chat')), messageData);
            setMessage('');
            setImageFile(null);
            if(fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to send message.' });
        } finally {
            setIsSending(false);
        }
    };
    
    const sortedMessages = useMemo(() => {
        if (!messages) return [];
        // The query is already ordered by descending, but onSnapshot might deliver them out of order initially
        // So we sort them descending by time, then reverse for display
        return [...messages].sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds).reverse();
    }, [messages]);

    return (
        <div className="h-[calc(100vh-4rem)] max-w-4xl mx-auto flex flex-col bg-slate-800 rounded-lg shadow-2xl" style={{backgroundImage: "url('/whatsapp-bg.png')"}}>
            <header className="flex-shrink-0 flex items-center p-3 gap-3 bg-[#202c33] text-white">
                <MessageSquare className="h-8 w-8"/>
                <div>
                     <h1 className="text-xl font-bold">Public Square</h1>
                     <p className="text-xs text-gray-300">A place for all students to connect</p>
                </div>
            </header>

            <div ref={messagesContainerRef} className="flex-grow p-4 space-y-4 overflow-y-auto">
                {isLoading ? <Loader2 className="mx-auto animate-spin text-white" /> :
                sortedMessages.map(msg => (
                     <div key={msg.id} className={`flex items-end gap-2 ${msg.authorId === user?.uid ? 'justify-end' : ''}`}>
                         {msg.authorId !== user?.uid && <Avatar className="h-6 w-6"><AvatarImage src={msg.authorImage} /><AvatarFallback>{msg.authorName?.[0]}</AvatarFallback></Avatar>}
                        <div className={`max-w-xs md:max-w-md p-2 rounded-lg ${msg.authorId === user?.uid ? 'bg-[#005c4b] text-white' : 'bg-[#202c33] text-white'}`}>
                            {msg.authorId !== user?.uid && <p className="font-bold text-xs text-primary mb-1">{msg.authorName}</p>}
                            {msg.imageUrl && <Image src={msg.imageUrl} alt="chat image" width={250} height={250} className="rounded-md mb-1 object-cover" />}
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            <p className="text-right text-xs text-gray-400 mt-1">
                                {msg.createdAt ? formatDistanceToNow(msg.createdAt.toDate(), { addSuffix: true }) : ''}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            
            {imageFile && (
                 <div className="p-4 border-t border-gray-700 bg-[#202c33]">
                     <div className="flex items-center gap-2">
                        <Image src={URL.createObjectURL(imageFile)} alt="preview" width={40} height={40} className="rounded-md"/>
                        <p className="text-sm text-gray-300 truncate">{imageFile.name}</p>
                         <Button variant="ghost" size="icon" onClick={() => setImageFile(null)} className="ml-auto text-red-500 h-6 w-6"><X className="h-4 w-4"/></Button>
                     </div>
                 </div>
            )}
            
            <footer className="flex-shrink-0 p-3 bg-[#202c33] flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" onClick={() => fileInputRef.current?.click()}>
                    <ImagePlus />
                </Button>
                <Input type="file" ref={fileInputRef} onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="hidden" accept="image/*" />

                <Input 
                    placeholder="Type a message"
                    className="bg-[#2a3942] border-none text-white focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-primary"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    disabled={isSending}
                />
                <Button variant="default" size="icon" className="rounded-full bg-primary" onClick={handleSendMessage} disabled={isSending || (!message.trim() && !imageFile)}>
                    {isSending ? <Loader2 className="animate-spin" /> : <Send />}
                </Button>
            </footer>
        </div>
    );
}

    