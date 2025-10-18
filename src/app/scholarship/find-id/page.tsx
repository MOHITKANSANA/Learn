
'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const findIdSchema = z.object({
  mobile: z.string().length(10, 'Please enter a valid 10-digit mobile number.'),
  dob: z.string().min(1, 'Date of birth is required.'),
});

export default function FindApplicationIdPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [foundId, setFoundId] = useState<string | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof findIdSchema>>({
    resolver: zodResolver(findIdSchema),
    defaultValues: { mobile: '', dob: '' },
  });

  const onSubmit = async (data: z.infer<typeof findIdSchema>) => {
    if (!firestore) return;
    setIsLoading(true);
    setFoundId(null);

    try {
      const q = query(
        collection(firestore, 'scholarshipApplications'),
        where('mobile', '==', data.mobile),
        where('dob', '==', data.dob)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          variant: 'destructive',
          title: 'Not Found',
          description: 'No application found with the provided details.',
        });
      } else {
        const appId = querySnapshot.docs[0].data().id;
        setFoundId(appId);
        toast({ title: 'Success!', description: 'Your Application ID has been found.' });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'An error occurred while searching.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
        <div className='flex items-center gap-4 mb-6'>
            <Button asChild variant="ghost" size="icon">
                <Link href="/scholarship/admit-card">
                    <ArrowLeft />
                </Link>
            </Button>
            <h1 className="text-3xl font-bold font-headline">Find Application ID</h1>
         </div>
      <Card>
        <CardHeader>
          <CardTitle>Retrieve Your ID</CardTitle>
          <CardDescription>Enter your registered mobile number and date of birth to find your application ID.</CardDescription>
        </CardHeader>
        <CardContent>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField name="mobile" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Number</FormLabel>
                  <FormControl><Input type="tel" maxLength={10} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="dob" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Find ID'}
              </Button>
            </form>
          </FormProvider>

          {foundId && (
            <div className="mt-6 text-center">
              <p>Your Application ID is:</p>
              <div className="bg-muted p-3 rounded-lg mt-2">
                <p className="text-2xl font-bold tracking-widest text-primary">{foundId}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
