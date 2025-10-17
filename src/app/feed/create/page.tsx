
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const postSchema = z.object({
  content: z.string().min(1, 'Post cannot be empty.'),
  image: z.any().optional(),
});

export default function CreatePostPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof postSchema>>({
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
            router.push('/feed');
        })
        .catch(err => toast({ variant: 'destructive', title: 'Error', description: 'Failed to publish post.' }))
        .finally(() => setIsSubmitting(false));
  }

  return (
    <div className="max-w-2xl mx-auto">
         <div className='flex items-center gap-4 mb-6'>
            <Button asChild variant="ghost" size="icon">
                <Link href="/feed">
                    <ArrowLeft />
                </Link>
            </Button>
            <h1 className="text-3xl font-bold font-headline">Create a new post</h1>
         </div>
     
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Message</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Share your thoughts, ask a question, or start a discussion..."
                      className="min-h-[150px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Add an image (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={e => field.onChange(e.target.files)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Publish Post
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
