

'use client';

import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Loader2, Package, Truck, CheckCircle2, XCircle, Clock, Info, BookOpen, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useEffect, useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


function CancelOrderButton({ order, forceRefresh }: { order: any, forceRefresh: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [timeLeft, setTimeLeft] = useState('');
    const [canCancel, setCanCancel] = useState(false);
    
    useEffect(() => {
        if (!order.orderDate) return;

        const orderTime = order.orderDate.toDate();
        const oneHour = 60 * 60 * 1000;
        const expiryTime = orderTime.getTime() + oneHour;

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = expiryTime - now;

            if (distance < 0) {
                setCanCancel(false);
                setTimeLeft('Expired');
                clearInterval(interval);
                return;
            }
            
            setCanCancel(true);
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }, 1000);

        return () => clearInterval(interval);

    }, [order.orderDate]);

    const handleCancel = async () => {
        if (!firestore) return;
        const orderRef = doc(firestore, 'bookOrders', order.id);
        try {
            await deleteDoc(orderRef);
            toast({ title: 'Order Cancelled', description: 'Your order has been successfully removed.' });
            forceRefresh();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to cancel the order.' });
        }
    };

    if (!canCancel) {
        return null;
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="mt-4">
                    Cancel Order ({timeLeft})
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action is permanent and will delete the order. You will need to place a new order.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Keep Order</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancel}>Yes, Cancel</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default function MyOrdersPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const {toast} = useToast();

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'bookOrders'), where('studentId', '==', user.uid));
  }, [firestore, user]);

  const { data: orders, isLoading: isLoadingOrders, forceRefresh: refreshOrders } = useCollection(ordersQuery);

  const enrollmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid));
  }, [firestore, user]);

  const { data: enrollments, isLoading: isLoadingEnrollments } = useCollection(enrollmentsQuery);

  const isLoading = isLoadingOrders || isLoadingEnrollments;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'ID copied to clipboard.' });
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
        case 'pending': return <Clock className="h-4 w-4 mr-2" />;
        case 'approved': return <CheckCircle2 className="h-4 w-4 mr-2 text-blue-500" />;
        case 'shipped': return <Truck className="h-4 w-4 mr-2 text-green-500" />;
        case 'rejected': return <XCircle className="h-4 w-4 mr-2 text-red-500" />;
        case 'cancelled': return <XCircle className="h-4 w-4 mr-2 text-muted-foreground" />;
        default: return <Package className="h-4 w-4 mr-2" />;
    }
  }
  
  const handleWhatsAppSupport = () => {
    const phoneNumber = "918949814095";
    const message = "Hello, I need help with my book order or enrollment.";
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

  const sortedOrders = orders ? [...orders].sort((a, b) => b.orderDate.seconds - a.orderDate.seconds) : [];
  const sortedEnrollments = enrollments ? [...enrollments].sort((a, b) => b.enrollmentDate.seconds - a.enrollmentDate.seconds) : [];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-headline">My Orders & Enrollments</h1>
        <p className="text-muted-foreground mt-2">Track the status of your purchases.</p>
      </div>

       <Tabs defaultValue="book-orders" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="book-orders">Book Orders</TabsTrigger>
                <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
            </TabsList>
            <TabsContent value="book-orders">
                 {sortedOrders && sortedOrders.length > 0 ? (
                    <div className="space-y-4 mt-6">
                    {sortedOrders.map(order => (
                        <Card key={order.id} className="overflow-hidden">
                        <CardHeader className="flex flex-row justify-between items-start">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                  <span>Order #{order.id.substring(0, 6)}</span>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(order.id)}>
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </CardTitle>
                                <CardDescription>
                                    Ordered on: {new Date(order.orderDate.seconds * 1000).toLocaleDateString()}
                                </CardDescription>
                            </div>
                            <Badge variant={order.status === 'rejected' || order.status === 'cancelled' ? 'destructive' : 'secondary'} className="capitalize flex items-center">
                                {getStatusIcon(order.status)}
                                {order.status}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <p><strong>Item:</strong> {order.bookTitle}</p>
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
                            ) : order.status !== 'cancelled' && (
                                <p className="text-sm text-muted-foreground mt-2">Tracking will be available once shipped.</p>
                            )}

                            {order.status === 'pending' && <CancelOrderButton order={order} forceRefresh={refreshOrders} />}
                            
                        </CardContent>
                        </Card>
                    ))}
                    </div>
                ) : (
                    <p className="col-span-full text-center text-muted-foreground py-10">You have not placed any book orders yet.</p>
                )}
            </TabsContent>
             <TabsContent value="enrollments">
                 {sortedEnrollments && sortedEnrollments.length > 0 ? (
                    <div className="space-y-4 mt-6">
                    {sortedEnrollments.map(enrollment => (
                        <Card key={enrollment.id} className="overflow-hidden">
                        <CardHeader className="flex flex-row justify-between items-start">
                           <div>
                                <CardTitle className="flex items-center gap-2">
                                    <span>Enrollment #{enrollment.id.substring(0, 6)}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(enrollment.id)}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </CardTitle>
                                <CardDescription>
                                    Requested on: {new Date(enrollment.enrollmentDate.seconds * 1000).toLocaleDateString()}
                                </CardDescription>
                            </div>
                           <Badge variant={enrollment.isApproved ? 'default' : 'secondary'} className="capitalize flex items-center">
                                {enrollment.isApproved ? <CheckCircle2 className="mr-2 h-4 w-4 text-green-400" /> : <Clock className="mr-2 h-4 w-4" />}
                                {enrollment.isApproved ? 'Approved' : 'Pending'}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <p><strong>Item:</strong> {enrollment.itemName}</p>
                             {enrollment.isApproved ? (
                                <Button asChild size="sm" className="mt-4">
                                    <Link href={`/courses/content/${enrollment.itemId}`}>
                                        <BookOpen className="mr-2 h-4 w-4" />
                                        Go to Content
                                    </Link>
                                </Button>
                             ) : (
                                <p className="text-sm text-muted-foreground mt-2">You will get access once the payment is approved by the admin.</p>
                             )}
                        </CardContent>
                        </Card>
                    ))}
                    </div>
                ) : (
                    <p className="col-span-full text-center text-muted-foreground py-10">You have no enrollments yet.</p>
                )}
             </TabsContent>
        </Tabs>

      <Card className="mt-8 bg-blue-900/20 border-blue-500/30">
          <CardHeader className="flex flex-row items-center gap-4">
              <Info className="h-6 w-6 text-blue-400"/>
              <div>
                <CardTitle className='text-blue-300'>Need Help?</CardTitle>
                <CardDescription className="text-blue-400/80">If your order or enrollment is not verified, please contact us on WhatsApp.</CardDescription>
              </div>
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
