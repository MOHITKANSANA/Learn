
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
import { Loader2, Rss, ImagePlus, ThumbsUp, MessageSquare, PlusCircle } from 'lucide-react';
import { useFirestore, useUser, useCollection, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp, updateDoc, arrayUnion, arrayRemove, query, orderBy } from 'firebase/firestore';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';


function PostCard({ post }: { post: any }) {
    const { user } = useUser();
    const firestore = useFirestore();

    const handleLike = async () => {
        if (!user || !firestore) return;

        const postRef = doc(firestore, 'feed_posts', post.id);
        if (post.likes.includes(user.uid)) {
            await updateDoc(postRef, { likes: arrayRemove(user.uid) });
        } else {
            await updateDoc(postRef, { likes: arrayUnion(user.uid) });
        }
    };

    const isLiked = user && post.likes.includes(user.uid);

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
            </CardContent>
            <CardFooter className="flex justify-between items-center border-t pt-2 pb-2">
                <Button variant="ghost" onClick={handleLike} className={`${isLiked ? 'text-primary' : 'text-muted-foreground'}`}>
                    <ThumbsUp className={`mr-2 h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                    {post.likes.length} {post.likes.length === 1 ? 'Like' : 'Likes'}
                </Button>
                <Button variant="ghost" className="text-muted-foreground">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Comment
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function FeedPage() {
    const firestore = useFirestore();
    const postsQuery = useMemoFirebase(() => 
        firestore ? query(collection(firestore, 'feed_posts'), orderBy('createdAt', 'desc')) : null,
        [firestore]
    );
    const { data: posts, isLoading } = useCollection(postsQuery);

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
                posts.map(post => <PostCard key={post.id} post={post} />)
            ) : (
                <p className="text-center text-muted-foreground py-10">The feed is empty. Be the first to post!</p>
            )}
        </div>
      )}
    </div>
  );
}
