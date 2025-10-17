
'use client';

import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Loader2, Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const cartQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, `users/${user.uid}/cart`));
  }, [firestore, user]);

  const { data: cartItems, isLoading } = useCollection(cartQuery);

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (!user || !firestore || newQuantity < 1) return;
    const itemRef = doc(firestore, `users/${user.uid}/cart`, itemId);
    try {
      await updateDoc(itemRef, { quantity: newQuantity });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update quantity.' });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!user || !firestore) return;
    const itemRef = doc(firestore, `users/${user.uid}/cart`, itemId);
    try {
      await deleteDoc(itemRef);
      toast({ title: 'Item removed', description: 'The item has been removed from your cart.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to remove item.' });
    }
  };
  
  const handleCheckout = () => {
    const cartData = cartItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        title: item.title,
    }));
    const queryString = encodeURIComponent(JSON.stringify(cartData));
    router.push(`/book-shala/checkout/cart?items=${queryString}`);
  }

  const { subtotal, discount, total } = useMemo(() => {
    if (!cartItems) return { subtotal: 0, discount: 0, total: 0 };
    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    // Discount logic: 15 for books (assuming all items in cart are books for now), 40 for others.
    // This example assumes all items are books. A real implementation might need item type info.
    const discount = Math.floor(subtotal / 500) * 15; 
    const total = subtotal - discount;
    return { subtotal, discount, total };
  }, [cartItems]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-headline">Shopping Cart</h1>
      </div>
      {cartItems && cartItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map(item => (
              <Card key={item.id} className="flex items-center p-4">
                <Image src={item.imageUrl} alt={item.title} width={80} height={100} className="rounded-md object-cover" />
                <div className="flex-grow ml-4">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">Price: ₹{item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleQuantityChange(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span>{item.quantity}</span>
                  <Button variant="outline" size="icon" onClick={() => handleQuantityChange(item.id, item.quantity + 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="ghost" size="icon" className="ml-4 text-destructive" onClick={() => handleRemoveItem(item.id)}>
                  <Trash2 className="h-5 w-5" />
                </Button>
              </Card>
            ))}
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-500">
                  <span>Discount</span>
                  <span>- ₹{discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleCheckout}>
                  Proceed to Checkout
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      ) : (
        <div className="text-center py-20">
          <ShoppingCart className="h-20 w-20 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Looks like you haven't added anything to your cart yet.</p>
          <Button asChild>
            <Link href="/book-shala">Continue Shopping</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

    