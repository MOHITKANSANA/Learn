
'use client';

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, PlusCircle, Trash2, Mic, FileQuestion } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';


const pollOptionSchema = z.object({
  text: z.string().min(1, 'Option text cannot be empty.'),
});

const postSchema = z.object({
  type: z.enum(['post', 'poll', 'qa']).default('post'),
  content: z.string().min(1, 'Content cannot be empty.'),
  image: z.any().optional(),
  pollOptions: z.array(pollOptionSchema).max(4, 'You can add a maximum of 4 options.').optional(),
});


export default function CreatePostPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('post');

  const form = useForm<z.infer<typeof postSchema>>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      type: 'post',
      content: '',
      pollOptions: [{ text: '' }, { text: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'pollOptions',
  });

  const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });

  async function onSubmit(values: z.infer<typeof postSchema>) {
    if (!user || !firestore) return;

    if (values.type === 'poll' && (values.pollOptions?.filter(opt => opt.text.trim() !== '').length ?? 0) < 2) {
        form.setError('pollOptions', { type: 'manual', message: 'Please provide at least two poll options.' });
        return;
    }

    setIsSubmitting(true);

    let imageUrl: string | null = null;
    if (values.image && values.image.length > 0) {
      imageUrl = await fileToDataUrl(values.image[0]);
    }

    const postRef = doc(collection(firestore, 'feed_posts'));
    const postData: any = {
      id: postRef.id,
      authorId: user.uid,
      authorName: user.displayName || 'Anonymous',
      authorImage: user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`,
      content: values.content,
      imageUrl: imageUrl,
      type: values.type,
      likes: [],
      createdAt: serverTimestamp(),
    };
    
    if (values.type === 'poll') {
        postData.pollOptions = values.pollOptions?.map(opt => ({ ...opt, votes: 0 }));
        postData.votes = {}; // To store user votes
    }


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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
               <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <Tabs
                    defaultValue={field.value}
                    onValueChange={(value) => {
                        field.onChange(value);
                        setActiveTab(value);
                    }}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="post">Post</TabsTrigger>
                      <TabsTrigger value="poll"><Mic className="mr-2 h-4 w-4" />Poll</TabsTrigger>
                      <TabsTrigger value="qa"><FileQuestion className="mr-2 h-4 w-4" />Q&A</TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{activeTab === 'poll' ? 'Your Poll Question' : activeTab === 'qa' ? 'Your Question' : 'Your Message'}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={
                            activeTab === 'poll' ? "e.g., What should I learn next?" :
                            activeTab === 'qa' ? "e.g., How does the stock market work?" :
                            "Share your thoughts..."
                        }
                        className="min-h-[150px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {activeTab === 'poll' && (
                <div className="space-y-2">
                    <FormLabel>Poll Options</FormLabel>
                    {fields.map((field, index) => (
                       <FormField
                          key={field.id}
                          control={form.control}
                          name={`pollOptions.${index}.text`}
                          render={({ field: optionField }) => (
                            <FormItem>
                                <div className="flex items-center gap-2">
                                <FormControl>
                                    <Input {...optionField} placeholder={`Option ${index + 1}`} />
                                </FormControl>
                                {fields.length > 2 && (
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive"/>
                                    </Button>
                                )}
                                </div>
                                <FormMessage />
                            </FormItem>
                          )}
                        />
                    ))}
                    {fields.length < 4 && (
                        <Button type="button" variant="outline" size="sm" onClick={() => append({ text: '' })}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Option
                        </Button>
                    )}
                    <FormMessage>{form.formState.errors.pollOptions?.message}</FormMessage>
                </div>
              )}

              {activeTab === 'post' && (
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
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                  Publish
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
