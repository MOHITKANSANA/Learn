
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Rss, ImagePlus, ThumbsUp, MessageSquare, PlusCircle, Send } from 'lucide-react';
import { useFirestore, useUser, useCollection, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp, updateDoc, arrayUnion, arrayRemove, query, orderBy, increment, writeBatch, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';

function CommentSection({ post }: { post: any }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const commentsQuery = useMemoFirebase(() => 
        firestore ? query(collection(firestore, `feed_posts/${post.id}/comments`), orderBy('createdAt', 'asc')) : null,
        [firestore, post.id]
    );
    const { data: comments, isLoading } = useCollection(commentsQuery);

    const handleCommentSubmit = async () => {
        if (!user || !firestore || !comment.trim()) return;
        setIsSubmitting(true);
        try {
            await addDoc(collection(firestore, `feed_posts/${post.id}/comments`), {
                authorId: user.uid,
                authorName: user.displayName || 'Anonymous',
                authorImage: user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`,
                text: comment,
                createdAt: serverTimestamp(),
            });
            setComment('');
            toast({ title: 'Success', description: 'Your comment has been posted.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to post comment.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 space-y-4">
            {user && (
                 <div className="flex gap-2">
                    <Input 
                        placeholder="Add a comment..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        disabled={isSubmitting}
                    />
                    <Button onClick={handleCommentSubmit} disabled={isSubmitting || !comment.trim()}>
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                 </div>
            )}
             <div>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin"/> :
                comments && comments.length > 0 ? (
                    comments.map(c => (
                        <div key={c.id} className="flex items-start gap-3 mt-4">
                             <Avatar className='h-8 w-8'>
                                <AvatarImage src={c.authorImage} />
                                <AvatarFallback>{c.authorName?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className='bg-muted p-2 rounded-lg'>
                                <p className="font-semibold text-sm">{c.authorName}</p>
                                <p className="text-sm">{c.text}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-xs text-muted-foreground text-center py-2">No comments yet.</p>
                )}
            </div>
        </div>
    );
}


function PollSection({ post, forceRefresh }: { post: any, forceRefresh: () => void }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isVoting, setIsVoting] = useState(false);

    const userVote = post.votes?.[user?.uid || ''];
    const totalVotes = post.pollOptions.reduce((acc: number, opt: any) => acc + opt.votes, 0);

    const handleVote = async (optionIndex: number) => {
        if (!user || !firestore || isVoting || userVote !== undefined) return;
        setIsVoting(true);

        const postRef = doc(firestore, 'feed_posts', post.id);

        try {
            const currentPostDoc = await getDoc(postRef);
            if (!currentPostDoc.exists()) {
                toast({ variant: "destructive", title: "Error", description: "Post not found." });
                return;
            }

            const currentPostData = currentPostDoc.data();
            const newPollOptions = [...currentPostData.pollOptions];
            
            // Ensure the vote count is a number before incrementing
            newPollOptions[optionIndex].votes = (newPollOptions[optionIndex].votes || 0) + 1;

            const newVotes = { ...currentPostData.votes, [user.uid]: optionIndex };
            
            await updateDoc(postRef, {
                pollOptions: newPollOptions,
                votes: newVotes,
            });
            
            toast({ title: "Vote Cast!", description: "Your vote has been recorded." });
            forceRefresh(); // Force a refresh of the post data from the parent
        } catch (error) {
            console.error("Error casting vote: ", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not cast your vote." });
        } finally {
            setIsVoting(false);
        }
    };
    
    return (
        <div className="space-y-2 mt-4">
            {post.pollOptions.map((option: any, index: number) => {
                const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                const isSelectedByUser = userVote === index;

                return (
                    <div key={index}>
                         <Button 
                            variant={isSelectedByUser ? 'default' : 'outline'}
                            className="w-full justify-start h-auto p-0"
                            onClick={() => handleVote(index)}
                            disabled={isVoting || userVote !== undefined}
                         >
                            <div className="relative w-full text-left p-3">
                                {userVote !== undefined && (
                                     <div 
                                        className="absolute top-0 left-0 h-full bg-primary/20 rounded-md" 
                                        style={{ width: `${percentage}%`}}
                                    />
                                )}
                                <div className="relative flex justify-between">
                                    <span>{option.text}</span>
                                     {userVote !== undefined && <span>{percentage.toFixed(0)}%</span>}
                                </div>
                            </div>
                         </Button>
                    </div>
                );
            })}
             {userVote !== undefined && <p className="text-xs text-muted-foreground text-right mt-2">{totalVotes} votes</p>}
        </div>
    );
}

function PostCard({ post, forceRefresh }: { post: any, forceRefresh: () => void }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const [showComments, setShowComments] = useState(false);

    const handleLike = async () => {
        if (!user || !firestore) return;

        const postRef = doc(firestore, 'feed_posts', post.id);
        const newLikes = post.likes?.includes(user.uid) ? arrayRemove(user.uid) : arrayUnion(user.uid);
        await updateDoc(postRef, { likes: newLikes });
        forceRefresh();
    };

    const isLiked = user && post.likes?.includes(user.uid);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-3">
                 <Avatar>
                    <AvatarImage src={post.authorImage} />
                    <AvatarFallback>{post.authorName?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{post.authorName}</p>
                    <p className="text-xs text-muted-foreground">
                        {post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : '...'}
                    </p>
                </div>
            </CardHeader>
            <CardContent>
                <p className="whitespace-pre-wrap">{post.content}</p>
                 {post.imageUrl && (
                    <div className="mt-4 relative w-full">
                        <Image 
                            src={post.imageUrl} 
                            alt="Post image" 
                            width={0}
                            height={0}
                            sizes="100vw"
                            style={{ width: '100%', height: 'auto' }}
                            className="rounded-lg object-contain" 
                        />
                    </div>
                 )}
                 {post.type === 'poll' && <PollSection post={post} forceRefresh={forceRefresh} />}
            </CardContent>
            <CardFooter className="flex justify-between items-center border-t pt-2 pb-2">
                <Button variant="ghost" onClick={handleLike} className={`${isLiked ? 'text-primary' : 'text-muted-foreground'}`}>
                    <ThumbsUp className={`mr-2 h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                    {post.likes?.length || 0} {post.likes?.length === 1 ? 'Like' : 'Likes'}
                </Button>
                <Button variant="ghost" className="text-muted-foreground" onClick={() => setShowComments(!showComments)}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Comment
                </Button>
            </CardFooter>
            {showComments && <CommentSection post={post} />}
        </Card>
    );
}

export default function FeedPage() {
    const firestore = useFirestore();
    const postsQuery = useMemoFirebase(() => 
        firestore ? query(collection(firestore, 'feed_posts'), orderBy('createdAt', 'desc')) : null,
        [firestore]
    );
    const { data: posts, isLoading, forceRefresh } = useCollection(postsQuery);

  return (
    <div className="max-w-2xl mx-auto">
      <header className="flex items-center justify-between gap-2 mb-6">
        <div className='flex items-center gap-2'>
            <Rss className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold font-headline">Feed</h1>
        </div>
        <Button asChild>
            <Link href="/feed/create">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Post
            </Link>
        </Button>
      </header>

      {isLoading ? (
        <div className="flex justify-center mt-10">
            <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
            {posts && posts.length > 0 ? (
                posts.map(post => <PostCard key={post.id} post={post} forceRefresh={forceRefresh} />)
            ) : (
                <p className="text-center text-muted-foreground py-10">The feed is empty. Be the first to post!</p>
            )}
        </div>
      )}
    </div>
  );
}
