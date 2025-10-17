
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
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

const checkoutSchema = z.object({
  couponCode: z.string().optional(),
  transactionId: z.string().min(12, 'Please enter a valid 12-digit UPI Transaction ID.').max(12, 'UPI Transaction ID must be 12 digits.'),
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
        transactionId: '',
    }
  });

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
        paymentMethod: 'qr_transaction_id',
        transactionId: values.transactionId,
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
        router.push('/my-library');

    } catch (error) {
        console.error("Error placing order: ", error);
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
                
                {settings?.qrCodeImageUrl && (
                    <div className='flex flex-col items-center gap-2'>
                        <Image src={settings.qrCodeImageUrl} alt="Payment QR Code" width={150} height={150} className="rounded-md border p-1"/>
                        <p className="text-xs text-muted-foreground text-center">1. Scan this QR to pay ₹{(finalPrice ?? item.price).toFixed(2)}</p>
                    </div>
                )}

                <FormField
                  control={form.control}
                  name="transactionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>2. Enter your 12-digit UPI Transaction ID</FormLabel>
                      <FormControl>
                        <Input placeholder="12-Digit Transaction ID" {...field} maxLength={12} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                 <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit for Verification
                 </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}

    