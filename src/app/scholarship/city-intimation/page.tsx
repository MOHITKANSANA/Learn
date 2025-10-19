
'use client'
import { useState, useEffect } from 'react';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDoc, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, School } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function CityIntimationPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [applicationId, setApplicationId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [centerInfo, setCenterInfo] = useState<any>(null);

    const {data: centers, isLoading: isLoadingCenters} = useCollection(useMemoFirebase(
        () => firestore ? collection(firestore, 'scholarship_centers') : null,
        [firestore]
    ));

    const handleSearch = async () => {
        if (!applicationId || !firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a valid Application ID.' });
            return;
        }
        setIsLoading(true);
        setCenterInfo(null);

        try {
            const appRef = doc(firestore, 'scholarshipApplications', applicationId);
            const appDoc = await getDoc(appRef);

            if (!appDoc.exists()) {
                toast({ variant: 'destructive', title: 'Not Found', description: 'No application found with this ID.' });
                setIsLoading(false);
                return;
            }

            const application = appDoc.data();
            
            if (application.allottedCenterId && centers) {
                const allottedCenter = centers.find(c => c.id === application.allottedCenterId);
                if (allottedCenter) {
                    const admitCardDate = new Date(allottedCenter.admitCardDate);
                     if (new Date() < admitCardDate) {
                        toast({ title: 'Not Available Yet', description: `City Intimation will be available from ${admitCardDate.toLocaleDateString()}.` });
                        setIsLoading(false);
                        return;
                    }
                    setCenterInfo(allottedCenter);
                } else {
                     toast({ variant: 'destructive', title: 'Not Allotted', description: 'Your exam center has not been allotted yet.' });
                }
            } else {
                 toast({ variant: 'destructive', title: 'Not Allotted', description: 'Your exam center has not been allotted yet.' });
            }

        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'An error occurred while fetching your details.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Check Your Exam City</CardTitle>
                    <CardDescription>Enter your 5-digit Application ID to see your allotted examination center.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2 mb-6">
                        <Input
                            placeholder="Enter 5-Digit Application ID"
                            value={applicationId}
                            onChange={(e) => setApplicationId(e.target.value)}
                            maxLength={5}
                        />
                        <Button onClick={handleSearch} disabled={isLoading || isLoadingCenters}>
                            {isLoading || isLoadingCenters ? <Loader2 className="animate-spin" /> : 'Search'}
                        </Button>
                    </div>

                    {centerInfo && (
                        <Card className="bg-muted/50">
                            <CardHeader>
                                <CardTitle>Your Allotted Center</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex items-center gap-2"><School className="h-5 w-5 text-primary" /><p className="font-semibold">{centerInfo.name}</p></div>
                                <div className="flex items-start gap-2"><MapPin className="h-5 w-5 text-primary mt-1" /><p>{centerInfo.address}, {centerInfo.city}, {centerInfo.state} - {centerInfo.pincode}</p></div>
                            </CardContent>
                        </Card>
                    )}
                </CardContent>
            </Card>
            <div className="text-center">
                <Button variant="link" asChild>
                    <Link href="/scholarship/find-id">Forgot Application ID?</Link>
                </Button>
            </div>
        </div>
    );
}

    