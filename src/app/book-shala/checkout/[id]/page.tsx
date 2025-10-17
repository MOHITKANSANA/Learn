
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
import { doc, collection, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

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
    paymentMobileNumber: z.string().optional(),
    paymentScreenshot: z.any().optional(),
}).refine(data => {
    if (data.paymentMethod === 'qr') {
        return data.paymentScreenshot?.length > 0 || !!data.paymentMobileNumber;
    }
    if (data.paymentMethod === 'upi_intent') {
        return !!data.paymentMobileNumber;
    }
    return true;
}, {
    message: 'Please provide either a screenshot or the mobile number for QR payment.',
    path: ['paymentMethod'],
});

type CartItem = {
    id: string;
    title: string;
    price: number;
    quantity: number;
    verificationCharge?: number;
    imageUrl?: string;
};

export default function BookCheckoutPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [step, setStep] = useState(1);
  const [shippingData, setShippingData] = useState<z.infer<typeof shippingSchema> | null>(null);
  
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const bookId = params.id as string;

  const { data: singleBookData, isLoading: isBookLoading } = useDoc(useMemoFirebase(() => {
    if (!firestore || bookId === 'cart') return null;
    return doc(firestore, 'books', bookId);
  }, [firestore, bookId]));
  
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'payment') : null, [firestore]);
  const { data: settings, isLoading: isLoadingSettings } = useDoc(settingsRef);

  useEffect(() => {
    if (bookId === 'cart') {
      const itemsQuery = searchParams.get('items');
      if (itemsQuery) {
        try {
          const parsedItems = JSON.parse(decodeURIComponent(itemsQuery));
          setItems(parsedItems);
        } catch (e) {
          console.error("Failed to parse cart items from URL");
          toast({ variant: "destructive", title: "Error", description: "Could not load cart items." });
          router.push('/cart');
        }
      }
    } else if (singleBookData) {
      setItems([{ ...singleBookData, quantity: 1 }]);
    }
  }, [bookId, searchParams, singleBookData, router, toast]);

  const { total, verificationCharge, codAmount } = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const totalVerification = items.reduce((acc, item) => acc + ((item.verificationCharge || 5) * item.quantity), 0);
    return {
        total: subtotal + totalVerification,
        verificationCharge: totalVerification,
        codAmount: subtotal,
    };
  }, [items]);

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
    if (!settings?.upiId || !verificationCharge) return '#';
    const amount = (verificationCharge).toFixed(2);
    const payeeName = "Learn with Munedra";
    const note = `Order verification for ${items.length} item(s)`;
    return `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
  }, [settings, verificationCharge, items]);

  async function handleVerificationSubmit(values: z.infer<typeof verificationSchema>) {
    if (!user || !firestore || items.length === 0 || !shippingData) {
        toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred. Please try again.' });
        return;
    }
    
    setIsSubmitting(true);
    
    let screenshotUrl: string | null = null;
    if (values.paymentMethod === 'qr' && values.paymentScreenshot?.[0]) {
        screenshotUrl = await fileToDataUrl(values.paymentScreenshot[0]);
    }
    
    const batch = writeBatch(firestore);

    items.forEach(item => {
        const orderRef = doc(collection(firestore, 'bookOrders'));
        const orderData = {
            id: orderRef.id,
            bookId: item.id,
            bookTitle: item.title,
            quantity: item.quantity,
            studentId: user.uid,
            shippingAddress: shippingData,
            status: 'pending',
            paymentMethod: values.paymentMethod === 'qr' 
                ? (screenshotUrl ? 'qr_screenshot' : 'qr_mobile')
                : 'upi_intent',
            paymentScreenshotUrl: screenshotUrl, 
            paymentMobileNumber: values.paymentMobileNumber || null,
            orderDate: serverTimestamp(),
            price: item.price,
            verificationCharge: item.verificationCharge || 5,
        };
        batch.set(orderRef, orderData);
    });

    if (bookId === 'cart') {
        items.forEach(item => {
            const cartItemRef = doc(firestore, `users/${user.uid}/cart`, item.id);
            batch.delete(cartItemRef);
        });
    }

    batch.commit()
      .then(() => {
          toast({
            title: 'आदेश दिया गया!',
            description: 'आपका ऑर्डर सत्यापन के लिए लंबित है। स्थिति को "मेरे आदेश" में ट्रैक करें।',
          });
          if (values.paymentMethod === 'upi_intent') {
             window.location.href = upiDeepLink;
          } else {
             router.push('/my-orders');
          }
      })
      .catch(async (serverError) => {
          console.error("Order failed:", serverError);
          toast({ variant: 'destructive', title: 'त्रुटि', description: 'ऑर्डर देने में विफल।' });
      })
      .finally(() => {
          setIsSubmitting(false);
      });
  }

  if ((isBookLoading && bookId !== 'cart') || items.length === 0 || isLoadingSettings) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin"/></div>
  }

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map(item => (
                <div key={item.id} className="flex items-center gap-4">
                    <Image src={item.imageUrl || 'https://picsum.photos/seed/book/100/120'} alt={item.title} width={60} height={75} className="rounded-md object-cover" />
                    <div>
                        <h3 className="font-semibold text-base">{item.title}</h3>
                        <p className="text-muted-foreground text-sm">Qty: {item.quantity}</p>
                    </div>
                    <p className="ml-auto font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                </div>
            ))}
            <div className="mt-4 pt-4 border-t space-y-2">
               <div className="flex justify-between">
                <span>सत्यापन शुल्क:</span>
                <span>₹{verificationCharge.toFixed(2)}</span>
              </div>
               <div className="flex justify-between">
                <span>कैश ऑन डिलीवरी (COD):</span>
                <span>₹{codAmount.toFixed(2)}</span>
              </div>
               <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>कुल राशि:</span>
                <span>₹{total.toFixed(2)}</span>
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
              <CardDescription>Where should we send your book(s)?</CardDescription>
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
                            <p>आपको अभी केवल ₹{verificationCharge.toFixed(2)} का सत्यापन शुल्क देना होगा।</p>
                            <p className="font-normal text-xs mt-1">बाकी राशि (₹{codAmount.toFixed(2)}) कैश ऑन डिलीवरी (COD) है।</p>
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
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Proceed to Pay &amp; Confirm
                            </Button>
                          </div>
                        )}

                        {paymentMethod === 'qr' && (
                          <div className="space-y-4">
                             {settings?.qrCodeImageUrl && (
                                <div className='flex flex-col items-center gap-2'>
                                    <Image src={settings.qrCodeImageUrl} alt="Payment QR Code" width={150} height={150} className="rounded-md border p-1"/>
                                    <p className="text-xs text-muted-foreground text-center">इस QR कोड को स्कैन करके ₹{verificationCharge.toFixed(2)} का भुगतान करें।</p>
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
                               <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                ऑर्डर कन्फर्म करें
                               </Button>
                          </div>
                        )}
                        <FormMessage>{verificationForm.formState.errors.paymentMethod?.message}</FormMessage>

                    </CardContent>
                    <CardFooter className="flex-col gap-4">
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
