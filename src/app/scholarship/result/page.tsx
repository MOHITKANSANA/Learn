
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
import { doc, getDoc } from 'firebase/firestore';
import { Loader2, ArrowLeft, ThumbsUp, ThumbsDown, Trophy, Clock } from 'lucide-react';
import Link from 'next/link';

const resultSchema = z.object({
  applicationId: z.string().length(5, 'Application ID must be 5 digits.'),
});

export default function ScholarshipResultPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof resultSchema>>({
    resolver: zodResolver(resultSchema),
    defaultValues: { applicationId: '' },
  });

  const onSubmit = async (data: z.infer<typeof resultSchema>) => {
    if (!firestore) return;
    setIsLoading(true);
    setResult(null);

    try {
      const appRef = doc(firestore, 'scholarshipApplications', data.applicationId);
      const appDoc = await getDoc(appRef);

      if (!appDoc.exists()) {
        toast({
          variant: 'destructive',
          title: 'Not Found',
          description: 'No application found with the provided ID.',
        });
      } else {
        const appData = appDoc.data();
        if (appData.result) {
            setResult(appData);
        } else {
            setResult({ ...appData, result: 'Pending' });
             toast({
                title: 'Result Not Declared',
                description: 'Your result is pending.',
            });
        }
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'An error occurred while fetching the result.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
        <div className='flex items-center gap-4 mb-6'>
            <Button asChild variant="ghost" size="icon">
                <Link href="/scholarship">
                    <ArrowLeft />
                </Link>
            </Button>
            <h1 className="text-3xl font-bold font-headline">Check Your Result</h1>
         </div>
      <Card>
        <CardHeader>
          <CardTitle>VSP Examination Result</CardTitle>
          <CardDescription>Enter your 5-digit Application ID to see your result.</CardDescription>
        </CardHeader>
        <CardContent>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField name="applicationId" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Application ID</FormLabel>
                  <FormControl><Input maxLength={5} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Check Result'}
              </Button>
            </form>
          </FormProvider>

          {result && (
            <div className="mt-6 text-center">
                <Trophy className="h-16 w-16 mx-auto text-yellow-400 mb-4" />
                <h3 className="font-semibold text-lg">{result.fullName}</h3>
                <p className="text-sm text-muted-foreground">Application ID: {result.id}</p>
                {result.result === 'Pending' ? (
                   <div className="mt-4 p-4 rounded-lg flex items-center justify-center gap-2 font-bold text-2xl bg-yellow-500/10 text-yellow-500">
                        <Clock />
                        <span>Result Pending</span>
                   </div>
                ) : (
                    <div className={`mt-4 p-4 rounded-lg flex items-center justify-center gap-2 font-bold text-2xl ${result.result === 'Pass' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {result.result === 'Pass' ? <ThumbsUp/> : <ThumbsDown/>}
                        You have {result.result}ed!
                    </div>
                )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
