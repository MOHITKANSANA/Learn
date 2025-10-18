
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, addDoc, serverTimestamp, query, orderBy, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Loader2, Send, ThumbsUp, MessageSquare, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

function CommentSection({ doubtId }: { doubtId: string }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const [comment, setComment] = useState('');
    const [isSending, setIsSending] = useState(false);
    const { toast } = useToast();

    const commentsQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, `doubts/${doubtId}/comments`), orderBy('createdAt', 'asc')) : null,
        [firestore, doubtId]
    );
    const { data: comments, isLoading, forceRefresh } = useCollection(commentsQuery);

    const handleSendMessage = async () => {
        if (!user || !firestore || !comment.trim()) return;
        setIsSending(true);
        try {
            await addDoc(collection(firestore, `doubts/${doubtId}/comments`), {
                authorId: user.uid,
                authorName: user.displayName,
                authorImage: user.photoURL,
                text: comment,
                likes: [],
                createdAt: serverTimestamp()
            });
            setComment('');
            toast({ title: 'Success', description: 'Your comment has been posted.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to post comment.' });
        } finally {
            setIsSending(false);
        }
    };
    
    const handleLike = async (commentId: string) => {
        if (!user || !firestore) return;

        const commentRef = doc(firestore, `doubts/${doubtId}/comments`, commentId);
        const targetComment = comments?.find(c => c.id === commentId);
        
        if (!targetComment) return;

        const newLikes = targetComment.likes?.includes(user.uid) ? arrayRemove(user.uid) : arrayUnion(user.uid);
        await updateDoc(commentRef, { likes: newLikes });
        forceRefresh();
    };

    return (
        <div className="space-y-4 p-4 flex-grow overflow-y-auto">
            {isLoading ? <Loader2 className="mx-auto animate-spin" /> : 
             comments && comments.length > 0 ? (
                comments.map(c => {
                    const isLiked = user && c.likes?.includes(user.uid);
                    return (
                        <div key={c.id} className="flex items-start gap-3">
                             <Avatar className="h-8 w-8">
                                <AvatarImage src={c.authorImage} />
                                <AvatarFallback>{c.authorName?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="w-full">
                                <div className="bg-muted p-3 rounded-lg">
                                    <p className="font-semibold text-sm">{c.authorName}</p>
                                    <p className="text-sm">{c.text}</p>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <Button variant="ghost" size="sm" onClick={() => handleLike(c.id)} className={`h-auto p-1 text-xs ${isLiked ? 'text-primary' : 'text-muted-foreground'}`}>
                                        <ThumbsUp className={`mr-1 h-3 w-3 ${isLiked ? 'fill-current' : ''}`} />
                                        {c.likes?.length || 0}
                                    </Button>
                                    <p className="text-xs text-muted-foreground">
                                        {c.createdAt ? formatDistanceToNow(c.createdAt.toDate(), { addSuffix: true }) : '...'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })
             ) : (
                <p className="text-center py-8 text-muted-foreground">No comments yet. Be the first to reply!</p>
             )}

             <div className="border-t pt-4">
                 {user && (
                    <div className="flex gap-2">
                        <Input
                            placeholder="Add a comment..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            disabled={isSending}
                        />
                        <Button onClick={handleSendMessage} disabled={isSending || !comment.trim()}>
                            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                )}
             </div>
        </div>
    );
}


export default function DoubtRoomPage() {
    const params = useParams();
    const doubtId = params.id as string;
    const { user } = useUser();
    const firestore = useFirestore();

    const doubtRef = useMemoFirebase(
        () => firestore && doubtId ? doc(firestore, 'doubts', doubtId) : null,
        [firestore, doubtId]
    );
    const { data: doubt, isLoading } = useDoc(doubtRef);

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
                        <div className="flex items-center gap-4">
                             <Button asChild variant="ghost" size="icon">
                                <Link href="/doubts">
                                    <ArrowLeft />
                                </Link>
                            </Button>
                            <div>
                                 <p className="text-sm text-muted-foreground">Doubt from {doubt.authorName}</p>
                                 <CardTitle className="flex items-center gap-2 text-lg">
                                    {doubt.text}
                                </CardTitle>
                            </div>
                        </div>
                         <Avatar className="h-10 w-10">
                            <AvatarImage src={doubt.authorImage} />
                            <AvatarFallback>{doubt.authorName?.[0]}</AvatarFallback>
                        </Avatar>
                    </div>
                </CardHeader>
                <CommentSection doubtId={doubtId} />
            </Card>
        </div>
    );
}
