
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useFirestore, useUser, useDoc, useMemoFirebase, errorEmitter } from '@/firebase';
import { doc, collection, setDoc, serverTimestamp, getDoc, query, where, getDocs, updateDoc } from 'firebase/firestore';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const checkoutSchema = z.object({
  couponCode: z.string().optional(),
  paymentMethod: z.enum(['upi_intent', 'qr']),
  paymentMobileNumber: z.string().optional(),
  paymentScreenshot: z.any().optional(),
}).refine(data => {
    if (data.paymentMethod === 'upi_intent') {
        return !!data.paymentMobileNumber && data.paymentMobileNumber.length >= 10;
    }
    if (data.paymentMethod === 'qr') {
        return data.paymentScreenshot?.length > 0 || (!!data.paymentMobileNumber && data.paymentMobileNumber.length >= 10);
    }
    return true;
}, {
    message: 'Please provide the required information for your selected payment method.',
    path: ['paymentMethod'],
});


type ItemType = 'course' | 'ebook' | 'previous-year-paper' | 'testSeries';

export default function CheckoutPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [item, setItem] = useState<any>(null);
  const [finalPrice, setFinalPrice] = useState<number | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const itemId = params.id as string;
  const itemType = searchParams.get('type') as ItemType;

  const itemRef = useMemoFirebase(() => {
    if (!firestore || !itemId || !itemType) return null;
    let collectionName = '';
    switch(itemType) {
      case 'course': collectionName = 'courses'; break;
      case 'ebook': collectionName = 'ebooks'; break;
      case 'previous-year-paper': collectionName = 'previousYearPapers'; break;
      case 'testSeries': collectionName = 'test_series'; break;
      default: return null;
    }
    return doc(firestore, collectionName, itemId);
  }, [firestore, itemId, itemType]);

  const { data: itemData, isLoading: isItemLoading } = useDoc(itemRef);

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'payment') : null, [firestore]);
  const { data: settings, isLoading: isLoadingSettings } = useDoc(settingsRef);

  useEffect(() => {
    if (itemData) {
      setItem(itemData);
      setFinalPrice(itemData.price);
    }
  }, [itemData]);

  const form = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
        couponCode: '',
        paymentMethod: 'upi_intent',
        paymentMobileNumber: '',
    }
  });
  
  const paymentMethod = form.watch('paymentMethod');

  const upiDeepLink = useMemo(() => {
    if (!settings?.upiId || finalPrice === null || finalPrice <= 0) return '#';
    const amount = finalPrice.toFixed(2);
    const payeeName = "Learn with Munedra";
    const note = `Payment for ${item?.title}`;
    return `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
  }, [settings, finalPrice, item]);

  const handleApplyCoupon = async () => {
    const code = form.getValues('couponCode');
    if (!code || !firestore || !item) return;
    
    setIsApplyingCoupon(true);
    setCouponError(null);
    setAppliedCoupon(null);
    setFinalPrice(item.price);

    const couponsRef = collection(firestore, 'coupons');
    const q = query(couponsRef, where('code', '==', code.toUpperCase()));
    
    try {
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setCouponError('अमान्य कूपन कोड।');
          setIsApplyingCoupon(false);
          return;
        }

        const coupon = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
        
        if (new Date(coupon.expiryDate.seconds * 1000) < new Date()) {
            setCouponError('यह कूपन समाप्त हो गया है।');
            setIsApplyingCoupon(false);
            return;
        }
        if (coupon.usedCount >= coupon.maxUses) {
            setCouponError('यह कूपन अपनी उपयोग सीमा तक पहुँच गया है।');
            setIsApplyingCoupon(false);
            return;
        }

        let discountedPrice = item.price;
        if (coupon.discountType === 'percentage') {
          discountedPrice = item.price * (1 - coupon.discountValue / 100);
        } else {
          discountedPrice = item.price - coupon.discountValue;
        }

        setFinalPrice(Math.max(0, discountedPrice));
        setAppliedCoupon(coupon);
        toast({ title: 'सफलता!', description: 'कूपन सफलतापूर्वक लागू हो गया है।' });
    } catch (e) {
        setCouponError('कूपन लागू करने में त्रुटि हुई।');
    } finally {
        setIsApplyingCoupon(false);
    }
  };
  
    const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
  
  async function onSubmit(values: z.infer<typeof checkoutSchema>) {
    if (!user || !firestore || !item) {
        toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred.' });
        return;
    }

    const enrollmentsRef = collection(firestore, 'enrollments');
    const q = query(enrollmentsRef, where('studentId', '==', user.uid), where('itemId', '==', item.id), where('isApproved', '==', false));
    const existingEnrollments = await getDocs(q);

    if (!existingEnrollments.empty) {
        toast({ variant: 'destructive', title: 'Already Requested', description: 'You have already submitted a payment request for this item. Please wait for approval.' });
        return;
    }
    
    setIsSubmitting(true);

    let screenshotUrl: string | null = null;
    if (values.paymentMethod === 'qr' && values.paymentScreenshot?.[0]) {
        screenshotUrl = await fileToDataUrl(values.paymentScreenshot[0]);
    }

    const enrollmentRef = doc(collection(firestore, 'enrollments'));
    const enrollmentData = {
        id: enrollmentRef.id,
        studentId: user.uid,
        itemId: item.id,
        itemType: itemType,
        itemName: item.title,
        itemImage: item.imageUrl,
        pricePaid: finalPrice,
        couponUsed: appliedCoupon ? appliedCoupon.code : null,
        enrollmentDate: serverTimestamp(),
        paymentMethod: values.paymentMethod === 'qr' 
            ? (screenshotUrl ? 'qr_screenshot' : 'qr_mobile')
            : 'upi_intent',
        paymentScreenshotUrl: screenshotUrl,
        paymentMobileNumber: values.paymentMobileNumber || null,
        isApproved: false,
    };

    try {
        await setDoc(enrollmentRef, enrollmentData);
        
        if (appliedCoupon) {
            const couponRef = doc(firestore, 'coupons', appliedCoupon.id);
            await updateDoc(couponRef, {
                usedCount: appliedCoupon.usedCount + 1,
            });
        }
        
        toast({
            title: 'Payment Request Sent!',
            description: 'Your enrollment is pending approval. We will notify you shortly.',
        });

        if (values.paymentMethod === 'upi_intent' && upiDeepLink !== '#') {
            window.location.href = upiDeepLink;
        } else {
            router.push('/my-library');
        }

    } catch (error) {
        console.error("Error placing order: ", error);
        const permissionError = new FirestorePermissionError({
            path: (error as any).path || 'enrollments',
            operation: 'create',
            requestResourceData: enrollmentData,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to place order.' });
    } finally {
        setIsSubmitting(false);
    }
  }

  if (isItemLoading || !item || isLoadingSettings) {
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
              <Image src={item.imageUrl} alt={item.title} width={100} height={100} className="rounded-md object-cover" />
              <div>
                <h3 className="font-semibold text-lg">{item.title}</h3>
                <p className="text-muted-foreground capitalize">{itemType.replace('-', ' ')}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span>Original Price:</span>
                <span>₹{item.price.toFixed(2)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-green-500">
                  <span>Discount ({appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}%` : `₹${appliedCoupon.discountValue}`}):</span>
                  <span>- ₹{(item.price - (finalPrice ?? item.price)).toFixed(2)}</span>
                </div>
              )}
               <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total Amount:</span>
                <span>₹{(finalPrice ?? item.price).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card className="bg-gradient-to-br from-primary/10 to-background">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary">Shiksha Pay</CardTitle>
            <CardDescription>Complete your purchase to enroll.</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                 <div className="flex gap-2">
                     <FormField
                        control={form.control}
                        name="couponCode"
                        render={({ field }) => (
                            <FormItem className="flex-grow">
                            <FormLabel>Coupon Code (Optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter coupon" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <Button type="button" onClick={handleApplyCoupon} className="self-end" disabled={isApplyingCoupon}>
                        {isApplyingCoupon && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Apply
                    </Button>
                 </div>
                 {couponError && <p className="text-sm text-destructive">{couponError}</p>}
                
                <div className="text-center p-3 bg-primary/20 rounded-md border border-primary/30">
                    <p className="font-semibold"> कृपया ₹{(finalPrice ?? item.price).toFixed(2)} का भुगतान करें और सत्यापित करें।</p>
                </div>
                
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="font-bold">Select Verification Method:</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-2">
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="upi_intent" /></FormControl>
                            <FormLabel className="font-normal">Pay with UPI App (Recommended)</FormLabel>
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
                        control={form.control}
                        name="paymentMobileNumber"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Your UPI Mobile Number</FormLabel>
                            <FormControl>
                                <div className="flex items-center">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground sm:text-sm">+91</span>
                                <Input type="tel" placeholder="Enter number you will pay from" {...field} className="rounded-l-none" value={field.value ?? ''} />
                                </div>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                         <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Proceed to Pay
                        </Button>
                    </div>
                )}
                
                {paymentMethod === 'qr' && (
                  <div className="space-y-4">
                     {settings?.qrCodeImageUrl && (
                        <div className='flex flex-col items-center gap-2'>
                            <Image src={settings.qrCodeImageUrl} alt="Payment QR Code" width={150} height={150} className="rounded-md border p-1"/>
                            <p className="text-xs text-muted-foreground text-center">Scan this QR to pay ₹{(finalPrice ?? item.price).toFixed(2)}</p>
                        </div>
                    )}
                     <FormField
                        control={form.control}
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
                        control={form.control}
                        name="paymentMobileNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>2. Enter Mobile Number</FormLabel>
                             <FormControl>
                                <div className="flex items-center">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground sm:text-sm">+91</span>
                                    <Input type="tel" placeholder="Number you paid from" {...field} className="rounded-l-none" value={field.value ?? ''} />
                                </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit for Verification
                     </Button>
                  </div>
                )}
                {form.formState.errors.paymentMethod && <p className="text-sm font-medium text-destructive">{form.formState.errors.paymentMethod.message}</p>}

              </CardContent>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
