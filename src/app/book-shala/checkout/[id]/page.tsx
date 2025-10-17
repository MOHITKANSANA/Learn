
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
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
import { doc, collection, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const shippingSchema = z.object({
  name: z.string().min(2, 'Full name is required.'),
  address: z.string().min(10, 'Full address is required.'),
  city: z.string().min(2, 'City is required.'),
  state: z.string().min(2, 'State is required.'),
  zipCode: z.string().min(5, 'A valid ZIP code is required.'),
  mobile: z.string().min(10, 'A valid 10-digit mobile number is required.'),
});

const paymentSchema = z.object({
  paymentScreenshot: z.any().refine(
    (files) => files?.length === 1,
    'Payment screenshot is required.'
  ),
});

export default function BookCheckoutPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [book, setBook] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [shippingData, setShippingData] = useState<z.infer<typeof shippingSchema> | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'mobile'>('qr');


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

  const paymentForm = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
  });

  const handleShippingSubmit = (values: z.infer<typeof shippingSchema>) => {
    setShippingData(values);
    setStep(2);
  };
  
  const fileToDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });

  async function handlePaymentSubmit(values: z.infer<typeof paymentSchema>) {
    if (!user || !firestore || !book || !shippingData) {
        toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred. Please try again.' });
        return;
    }
    setIsSubmitting(true);

    const screenshotFile = values.paymentScreenshot[0];
    const screenshotUrl = await fileToDataUrl(screenshotFile);

    const orderRef = doc(collection(firestore, 'bookOrders'));
    const orderData = {
        id: orderRef.id,
        bookId: book.id,
        studentId: user.uid,
        shippingAddress: shippingData,
        status: 'pending', // Initial status
        paymentScreenshotUrl: screenshotUrl,
        orderDate: serverTimestamp(),
        price: book.price,
        verificationCharge: book.verificationCharge,
    };

    setDoc(orderRef, orderData)
      .then(() => {
          toast({
            title: 'Order Placed!',
            description: 'Your order is pending verification. You can track its status in "My Orders".',
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
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to place order.' });
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
                <span>Book Price:</span>
                <span>₹{book.price.toFixed(2)}</span>
              </div>
               <div className="flex justify-between">
                <span>Verification Charge:</span>
                <span>₹{book.verificationCharge.toFixed(2)}</span>
              </div>
               <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total Amount:</span>
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
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Payment Verification</CardTitle>
                    <CardDescription>Complete the final step.</CardDescription>
                </CardHeader>
                <Form {...paymentForm}>
                    <form onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)}>
                    <CardContent className="space-y-4">
                        <div className="text-sm font-semibold text-center bg-primary/10 p-3 rounded-md">
                            <p>You only need to pay a verification charge of ₹{book.verificationCharge.toFixed(2)} now.</p>
                            <p className="font-normal text-xs mt-1">The rest of the amount (₹{book.price.toFixed(2)}) is Cash on Delivery (COD).</p>
                        </div>
                        
                        <RadioGroup defaultValue="qr" onValueChange={(value: 'qr' | 'mobile') => setPaymentMethod(value)}>
                           <div className="flex items-center space-x-2">
                             <RadioGroupItem value="qr" id="qr" />
                             <Label htmlFor="qr">Pay with QR Code</Label>
                           </div>
                           <div className="flex items-center space-x-2">
                             <RadioGroupItem value="mobile" id="mobile" />
                             <Label htmlFor="mobile">Pay to Mobile Number</Label>
                           </div>
                         </RadioGroup>

                        {paymentMethod === 'qr' && settings?.qrCodeImageUrl && (
                            <div className='flex flex-col items-center gap-2'>
                                <Image src={settings.qrCodeImageUrl} alt="Payment QR Code" width={200} height={200} className="rounded-md border p-2"/>
                                <p className="text-sm text-muted-foreground">Scan the QR code to pay.</p>
                            </div>
                        )}

                         {paymentMethod === 'mobile' && settings?.mobileNumber && (
                             <div className='text-center p-4 bg-muted rounded-md'>
                                 <p className="text-sm text-muted-foreground">Pay to the following mobile number:</p>
                                <p className="text-lg font-bold">{settings.mobileNumber}</p>
                            </div>
                        )}


                        <FormField
                        control={paymentForm.control}
                        name="paymentScreenshot"
                        render={({ field: { onChange, value, ...rest } }) => (
                            <FormItem>
                            <FormLabel>Upload Payment Screenshot</FormLabel>
                            <FormControl>
                                <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => onChange(e.target.files)}
                                {...rest}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </CardContent>
                    <CardFooter className="flex-col gap-4">
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Order
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => setStep(1)}>Back to Address</Button>
                    </CardFooter>
                    </form>
                </Form>
            </Card>
        )}

      </div>
    </div>
  );
}
