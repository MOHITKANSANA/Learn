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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"

const postSchema = z.object({
  content: z.string().min(1, 'Post cannot be empty.'),
  image: z.any().optional(),
});

function CreatePost() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(postSchema),
    defaultValues: { content: '' },
  });

  const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });

  async function onSubmit(values: z.infer<typeof postSchema>) {
    if (!user || !firestore) return;
    setIsSubmitting(true);

    let imageUrl: string | null = null;
    if (values.image && values.image.length > 0) {
      imageUrl = await fileToDataUrl(values.image[0]);
    }

    const postRef = doc(collection(firestore, 'feed_posts'));
    const postData = {
      id: postRef.id,
      authorId: user.uid,
      authorName: user.displayName || 'Anonymous',
      authorImage: user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`,
      content: values.content,
      imageUrl: imageUrl,
      likes: [],
      comments: 0,
      createdAt: serverTimestamp(),
    };
    
    setDoc(postRef, postData)
        .then(() => {
            toast({ title: 'Success', description: 'Your post has been published.' });
            form.reset();
            setOpen(false);
        })
        .catch(err => toast({ variant: 'destructive', title: 'Error', description: 'Failed to publish post.' }))
        .finally(() => setIsSubmitting(false));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
             <Card className="mb-6 cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                    <Avatar>
                        <AvatarImage src={user?.photoURL || ''} />
                        <AvatarFallback>{user?.displayName?.[0]}</AvatarFallback>
                    </Avatar>
                    <p className="text-muted-foreground">What's on your mind, {user?.displayName?.split(' ')[0] || 'User'}?</p>
                </CardContent>
            </Card>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Create a new post</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Textarea
                    {...form.register('content')}
                    placeholder="Share your thoughts, ask a question, or start a discussion..."
                    className="min-h-[120px]"
                />
                 <Controller
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={e => field.onChange(e.target.files)}
                        />
                    )}
                />
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Post
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
  );
}

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
      <header className="flex items-center gap-2 mb-6">
        <Rss className="h-8 w-8 text-primary" />
        <h1 className="text-4xl font-bold font-headline">Feed</h1>
      </header>

      <CreatePost />

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

    