
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useFirestore, useUser, useDoc, useMemoFirebase, errorEmitter } from '@/firebase';
import { doc, collection, setDoc, serverTimestamp } from 'firebase/firestore';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

const shippingSchema = z.object({
  name: z.string().min(2, 'Full name is required.'),
  address: z.string().min(10, 'Full address is required.'),
  city: z.string().min(2, 'City is required.'),
  state: z.string().min(2, 'State is required.'),
  zipCode: z.string().min(5, 'A valid ZIP code is required.'),
  mobile: z.string().min(10, 'A valid 10-digit mobile number is required.'),
});

const verificationSchema = z.object({
  paymentMethod: z.enum(['upi_intent', 'qr']),
  transactionId: z.string().optional(),
  paymentMobileNumber: z.string().optional(),
  paymentScreenshot: z.any().optional(),
});


export default function BookCheckoutPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [book, setBook] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [shippingData, setShippingData] = useState<z.infer<typeof shippingSchema> | null>(null);
  
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const params = useParams();
  const bookId = params.id as string;

  const bookRef = useMemoFirebase(() => {
    if (!firestore || !bookId) return null;
    return doc(firestore, 'books', bookId);
  }, [firestore, bookId]);

  const { data: bookData, isLoading: isBookLoading } = useDoc(bookRef);
  
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'payment') : null, [firestore]);
  const { data: settings, isLoading: isLoadingSettings } = useDoc(settingsRef);


  useEffect(() => {
    if (bookData) {
      setBook(bookData);
    }
  }, [bookData]);

  const shippingForm = useForm<z.infer<typeof shippingSchema>>({
    resolver: zodResolver(shippingSchema),
    defaultValues: { name: '', address: '', city: '', state: '', zipCode: '', mobile: '' },
  });

  const verificationForm = useForm<z.infer<typeof verificationSchema>>({
    resolver: zodResolver(verificationSchema),
    defaultValues: { paymentMethod: 'upi_intent' }
  });
  
  const paymentMethod = verificationForm.watch('paymentMethod');

  const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });

  const handleShippingSubmit = (values: z.infer<typeof shippingSchema>) => {
    setShippingData(values);
    setStep(2);
  };
  
  const upiDeepLink = useMemo(() => {
    if (!settings?.upiId || !book) return '#';
    const amount = (book.verificationCharge).toFixed(2);
    const payeeName = "Learn with Munedra";
    const note = `Order for ${book.title}`;
    return `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
  }, [settings, book]);


  async function handleVerificationSubmit(values: z.infer<typeof verificationSchema>) {
    if (!user || !firestore || !book || !shippingData) {
        toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred. Please try again.' });
        return;
    }
    
    if (values.paymentMethod === 'qr') {
        if (!values.paymentScreenshot && !values.paymentMobileNumber) {
            return verificationForm.setError('root', { message: 'Please upload a screenshot or enter your mobile number.' });
        }
    }
    
    setIsSubmitting(true);

    let screenshotUrl: string | null = null;
    if (values.paymentMethod === 'qr' && values.paymentScreenshot?.[0]) {
        screenshotUrl = await fileToDataUrl(values.paymentScreenshot[0]);
    }
    
    const orderRef = doc(collection(firestore, 'bookOrders'));
    const orderData = {
        id: orderRef.id,
        bookId: book.id,
        studentId: user.uid,
        shippingAddress: shippingData,
        status: 'pending', // Initial status
        paymentMethod: values.paymentMethod,
        paymentScreenshotUrl: screenshotUrl, 
        paymentMobileNumber: values.paymentMobileNumber || null,
        orderDate: serverTimestamp(),
        price: book.price,
        verificationCharge: book.verificationCharge,
    };

    setDoc(orderRef, orderData)
      .then(() => {
          toast({
            title: 'आदेश दिया गया!',
            description: 'आपका ऑर्डर सत्यापन के लिए लंबित है। स्थिति को "मेरे आदेश" में ट्रैक करें।',
          });
          router.push('/my-orders');
      })
      .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: orderRef.path,
            operation: 'create',
            requestResourceData: orderData,
          });
          errorEmitter.emit('permission-error', permissionError);
          toast({ variant: 'destructive', title: 'त्रुटि', description: 'ऑर्डर देने में विफल।' });
      })
      .finally(() => {
          setIsSubmitting(false);
      });
  }

  if (isBookLoading || !book || isLoadingSettings) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin"/></div>
  }

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Image src={book.imageUrl} alt={book.title} width={100} height={120} className="rounded-md object-cover" />
              <div>
                <h3 className="font-semibold text-lg">{book.title}</h3>
                <p className="text-muted-foreground">by {book.author}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span>किताब का मूल्य:</span>
                <span>₹{book.price.toFixed(2)}</span>
              </div>
               <div className="flex justify-between">
                <span>सत्यापन शुल्क:</span>
                <span>₹{book.verificationCharge.toFixed(2)}</span>
              </div>
               <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>कुल राशि:</span>
                <span>₹{(book.price + book.verificationCharge).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Shipping Address</CardTitle>
              <CardDescription>Where should we send your book?</CardDescription>
            </CardHeader>
            <Form {...shippingForm}>
              <form onSubmit={shippingForm.handleSubmit(handleShippingSubmit)}>
                <CardContent className="space-y-4">
                  <FormField control={shippingForm.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={shippingForm.control} name="address" render={({ field }) => (
                    <FormItem><FormLabel>Address</FormLabel><FormControl><Textarea placeholder="123 Main St, Apt 4B" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <div className="grid grid-cols-2 gap-4">
                    <FormField control={shippingForm.control} name="city" render={({ field }) => (
                        <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="Anytown" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={shippingForm.control} name="state" render={({ field }) => (
                        <FormItem><FormLabel>State</FormLabel><FormControl><Input placeholder="CA" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                    <FormField control={shippingForm.control} name="zipCode" render={({ field }) => (
                        <FormItem><FormLabel>ZIP Code</FormLabel><FormControl><Input placeholder="12345" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={shippingForm.control} name="mobile" render={({ field }) => (
                        <FormItem><FormLabel>Mobile Number</FormLabel><FormControl><Input type="tel" placeholder="9876543210" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                   </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full">
                    Proceed to Payment
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        )}
        
        {step === 2 && (
            <Card className="bg-gradient-to-br from-primary/10 to-background">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl text-primary">Shiksha Pay</CardTitle>
                    <CardDescription>अंतिम चरण पूरा करें।</CardDescription>
                </CardHeader>
                <Form {...verificationForm}>
                    <form onSubmit={verificationForm.handleSubmit(handleVerificationSubmit)}>
                    <CardContent className="space-y-6">
                        <div className="text-sm font-semibold text-center bg-primary/20 p-3 rounded-md border border-primary/30">
                            <p>आपको अभी केवल ₹{book.verificationCharge.toFixed(2)} का सत्यापन शुल्क देना होगा।</p>
                            <p className="font-normal text-xs mt-1">बाकी राशि (₹{book.price.toFixed(2)}) कैश ऑन डिलीवरी (COD) है।</p>
                        </div>
                        
                        <FormField
                          control={verificationForm.control}
                          name="paymentMethod"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="font-bold">Select Verification Method:</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="flex flex-col space-y-2"
                                >
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl><RadioGroupItem value="upi_intent" /></FormControl>
                                    <FormLabel className="font-normal">Pay with UPI App</FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl><RadioGroupItem value="qr" /></FormControl>
                                    <FormLabel className="font-normal">Pay with QR Code</FormLabel>
                                  </FormItem>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {paymentMethod === 'upi_intent' && (
                          <div className="space-y-4">
                             <FormField
                              control={verificationForm.control}
                              name="paymentMobileNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Your UPI Mobile Number</FormLabel>
                                  <FormControl>
                                    <div className="flex items-center">
                                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground sm:text-sm">+91</span>
                                      <Input type="tel" placeholder="Enter number you will pay from" {...field} className="rounded-l-none" />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button asChild className='w-full'>
                                <Link href={upiDeepLink}>Proceed to Pay</Link>
                            </Button>
                          </div>
                        )}

                        {paymentMethod === 'qr' && (
                          <div className="space-y-4">
                             {settings?.qrCodeImageUrl && (
                                <div className='flex flex-col items-center gap-2'>
                                    <Image src={settings.qrCodeImageUrl} alt="Payment QR Code" width={150} height={150} className="rounded-md border p-1"/>
                                    <p className="text-xs text-muted-foreground text-center">इस QR कोड को स्कैन करके ₹{book.verificationCharge.toFixed(2)} का भुगतान करें।</p>
                                </div>
                            )}
                             <FormField
                                control={verificationForm.control}
                                name="paymentScreenshot"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>1. Upload Screenshot</FormLabel>
                                    <FormControl><Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="relative">
                                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or</span></div>
                              </div>
                               <FormField
                                control={verificationForm.control}
                                name="paymentMobileNumber"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>2. Enter Mobile Number</FormLabel>
                                     <FormControl>
                                        <div className="flex items-center">
                                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground sm:text-sm">+91</span>
                                            <Input type="tel" placeholder="जिस नंबर से भुगतान किया है" {...field} className="rounded-l-none" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                          </div>
                        )}
                        {verificationForm.formState.errors.root && <p className="text-sm font-medium text-destructive">{verificationForm.formState.errors.root.message}</p>}
                    </CardContent>
                    <CardFooter className="flex-col gap-4">
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            ऑर्डर कन्फर्म करें
                        </Button>
                        <Button variant="ghost" className="w-full" onClick={() => setStep(1)}>Back to Address</Button>
                    </CardFooter>
                    </form>
                </Form>
            </Card>
        )}

      </div>
    </div>
  );
}

    