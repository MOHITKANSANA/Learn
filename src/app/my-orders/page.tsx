'use client';

import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Loader2, Package, Truck, CheckCircle2, XCircle, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function MyOrdersPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'bookOrders'), where('studentId', '==', user.uid));
  }, [firestore, user]);

  const { data: orders, isLoading } = useCollection(ordersQuery);

  const getStatusIcon = (status: string) => {
    switch (status) {
        case 'pending': return <Clock className="h-4 w-4 mr-2" />;
        case 'approved': return <CheckCircle2 className="h-4 w-4 mr-2 text-blue-500" />;
        case 'shipped': return <Truck className="h-4 w-4 mr-2 text-green-500" />;
        case 'rejected': return <XCircle className="h-4 w-4 mr-2 text-red-500" />;
        default: return <Package className="h-4 w-4 mr-2" />;
    }
  }
  
  const handleWhatsAppSupport = () => {
    const phoneNumber = "918949814095";
    const message = "Hello, I need help with my book order.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-headline">My Book Orders</h1>
        <p className="text-muted-foreground mt-2">Track the status of your physical book orders.</p>
      </div>

      {orders && orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map(order => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="flex flex-row justify-between items-start">
                <div>
                    <CardTitle>Order #{order.id.substring(0, 6)}</CardTitle>
                    <CardDescription>
                        Ordered on: {new Date(order.orderDate.seconds * 1000).toLocaleDateString()}
                    </CardDescription>
                </div>
                 <Badge variant={order.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize flex items-center">
                    {getStatusIcon(order.status)}
                    {order.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <p><strong>Shipping To:</strong> {order.shippingAddress.name}, {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zipCode}</p>
                
                {order.status === 'shipped' && order.tentativeDeliveryDate && (
                    <p className="text-sm text-muted-foreground mt-2">
                        Tentative Delivery by: {new Date(order.tentativeDeliveryDate).toLocaleDateString()}
                    </p>
                )}

                {order.status === 'shipped' && order.trackingLink ? (
                     <Button asChild size="sm" className="mt-4">
                        <Link href={order.trackingLink} target="_blank" rel="noopener noreferrer">
                            <Truck className="mr-2 h-4 w-4"/>
                            Track Now
                        </Link>
                    </Button>
                ) : (
                    <p className="text-sm text-muted-foreground mt-2">Tracking will be available once shipped.</p>
                )}
                
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="col-span-full text-center text-muted-foreground">You have not placed any book orders yet.</p>
      )}

      <Card className="mt-8">
          <CardHeader>
              <CardTitle>Need Help?</CardTitle>
              <CardDescription>If your order is not verified, please contact us on WhatsApp.</CardDescription>
          </CardHeader>
          <CardContent>
              <Button onClick={handleWhatsAppSupport} className="w-full bg-green-500 hover:bg-green-600">
                  Contact Support on WhatsApp
              </Button>
          </CardContent>
      </Card>
    </div>
  );
}
