
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

const shippingSchema = z.object({
  name: z.string().min(2, 'Full name is required.'),
  address: z.string().min(10, 'Full address is required.'),
  city: z.string().min(2, 'City is required.'),
  state: z.string().min(2, 'State is required.'),
  zipCode: z.string().min(5, 'A valid ZIP code is required.'),
  mobile: z.string().min(10, 'A valid 10-digit mobile number is required.'),
});

const verificationSchema = z.object({
    paymentMobileNumber: z.string().min(10, 'Please enter a valid 10-digit mobile number.').max(10, 'Mobile number must be 10 digits.'),
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
    defaultValues: { paymentMobileNumber: '' }
  });
  
  const handleShippingSubmit = (values: z.infer<typeof shippingSchema>) => {
    setShippingData(values);
    setStep(2);
  };
  
  async function handleVerificationSubmit(values: z.infer<typeof verificationSchema>) {
    if (!user || !firestore || items.length === 0 || !shippingData) {
        toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred. Please try again.' });
        return;
    }
    
    setIsSubmitting(true);
    
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
            paymentMethod: 'qr_mobile_number',
            paymentMobileNumber: values.paymentMobileNumber,
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

    try {
        await batch.commit();
        toast({
            title: 'आदेश अनुरोध भेजा गया!',
            description: 'आपका ऑर्डर सत्यापन के लिए लंबित है। स्थिति को "मेरे आदेश" में ट्रैक करें।',
        });
        router.push('/my-orders');
    } catch (serverError) {
        console.error("Order failed:", serverError);
        toast({ variant: 'destructive', title: 'त्रुटि', description: 'ऑर्डर देने में विफल।' });
    } finally {
        setIsSubmitting(false);
    }
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
                        
                        {settings?.qrCodeImageUrl && (
                            <div className='flex flex-col items-center gap-2'>
                                <Image src={settings.qrCodeImageUrl} alt="Payment QR Code" width={150} height={150} className="rounded-md border p-1"/>
                                <p className="text-xs text-muted-foreground text-center">1. इस QR कोड को स्कैन करके ₹{verificationCharge.toFixed(2)} का भुगतान करें।</p>
                            </div>
                        )}

                        <FormField
                          control={verificationForm.control}
                          name="paymentMobileNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>2. अपना 10 अंकों का UPI मोबाइल नंबर दर्ज करें</FormLabel>
                              <FormControl>
                                <Input type="tel" placeholder="10-Digit Mobile Number" {...field} maxLength={10} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            ऑर्डर कन्फर्म करें
                        </Button>
                        
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
