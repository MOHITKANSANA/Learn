
'use client';
import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useFirestore, useUser, useDoc, useMemoFirebase, errorEmitter } from '@/firebase';
import { doc, collection, setDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Link from 'next/link';

const paymentSchema = z.object({
  paymentMobileNumber: z.string().min(10, 'Please enter a valid 10-digit mobile number.').max(10),
  examMode: z.enum(['online', 'offline'], { required_error: 'Please select an exam mode.' }),
});

export default function ScholarshipPaymentPage() {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const firestore = useFirestore();
    const { user } = useUser();
    const router = useRouter();

    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'payment') : null, [firestore]);
    const { data: settings, isLoading: isLoadingSettings } = useDoc(settingsRef);

    const form = useForm<z.infer<typeof paymentSchema>>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            paymentMobileNumber: '',
            examMode: 'offline',
        }
    });
    
    const watchExamMode = form.watch('examMode');
    const fee = watchExamMode === 'online' ? settings?.onlineScholarshipFee : settings?.offlineScholarshipFee;

    const applicationQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'scholarshipApplications'), where('userId', '==', user.uid));
    }, [user, firestore]);
    
    const {data: applications, isLoading: isLoadingApps} = useCollection(applicationQuery);

    if(isLoadingApps) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin"/></div>;

    if (applications && applications.length > 0) {
        return (
             <div className="max-w-md mx-auto text-center">
                <Card>
                    <CardHeader>
                        <CardTitle>Application Already Submitted</CardTitle>
                        <CardDescription>You have already applied for the scholarship.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Your Application ID is: <span className="font-bold">{applications[0].id}</span></p>
                         <Button asChild className="mt-4">
                            <Link href="/scholarship/my-applications">Check Status</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    async function onSubmit(values: z.infer<typeof paymentSchema>) {
        if (!user || !firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'User not logged in.' });
            return;
        }

        setIsSubmitting(true);
        const paymentRef = doc(collection(firestore, 'scholarshipPayments'));
        const paymentData = {
            id: paymentRef.id,
            userId: user.uid,
            examMode: values.examMode,
            amount: fee,
            paymentMobileNumber: values.paymentMobileNumber,
            status: 'pending', // Admin will approve this
            createdAt: serverTimestamp(),
        };

        try {
            await setDoc(paymentRef, paymentData);
            toast({
                title: 'Payment Request Sent!',
                description: 'Your application payment is pending approval. You can now fill the application form.',
            });
            router.push(`/scholarship/apply?pid=${paymentRef.id}&mode=${values.examMode}`);
        } catch (error) {
            console.error("Error sending payment request: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to send payment request.' });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    if (isLoadingSettings) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin"/></div>
    }

    return (
         <div className="max-w-md mx-auto">
             <div className='flex items-center gap-4 mb-6'>
                <Button asChild variant="ghost" size="icon">
                    <Link href="/scholarship">
                        <ArrowLeft />
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold font-headline">Apply for Scholarship</h1>
            </div>
             <Card className="bg-gradient-to-br from-primary/10 to-background">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl text-primary">Application Fee Payment</CardTitle>
                    <CardDescription>Complete the payment to proceed to the application form.</CardDescription>
                </CardHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-6">
                         <FormField
                            control={form.control}
                            name="examMode"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                <FormLabel>1. Select Exam Mode</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex items-center gap-4"
                                    >
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="offline" />
                                        </FormControl>
                                        <FormLabel className="font-normal">Offline (Fee: ₹{settings?.offlineScholarshipFee || 60})</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="online" />
                                        </FormControl>
                                        <FormLabel className="font-normal">Online (Fee: ₹{settings?.onlineScholarshipFee || 30})</FormLabel>
                                    </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />

                        <div className="text-sm font-semibold text-center bg-primary/20 p-3 rounded-md border border-primary/30">
                            <p>You need to pay ₹{fee || '...'} as application fee.</p>
                        </div>
                        
                        {settings?.qrCodeImageUrl && (
                            <div className='flex flex-col items-center gap-2'>
                                <Image src={settings.qrCodeImageUrl} alt="Payment QR Code" width={150} height={150} className="rounded-md border p-1"/>
                                <p className="text-xs text-muted-foreground text-center">2. Scan this QR to pay ₹{fee || '...'}</p>
                            </div>
                        )}

                        <FormField
                          control={form.control}
                          name="paymentMobileNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>3. Enter your 10-digit UPI Mobile Number</FormLabel>
                              <FormControl>
                                <Input type="tel" placeholder="10-Digit Mobile Number" {...field} maxLength={10} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={isSubmitting || isLoadingSettings}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Proceed to Application Form
                        </Button>
                    </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
    )
}
