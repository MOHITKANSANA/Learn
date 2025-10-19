
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Loader2, Download, User, Calendar, Clock, MapPin, School, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function AdmitCardPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [applicationId, setApplicationId] = useState('');
    const [application, setApplication] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const [allottedCenter, setAllottedCenter] = useState<any>(null);

    const { data: centers } = useCollection(useMemoFirebase(() => firestore ? collection(firestore, 'scholarship_centers') : null, [firestore]));

    const handleSearch = async () => {
        if(!applicationId || !firestore) return;
        setIsLoading(true);
        setApplication(null);
        setAllottedCenter(null);

        const appRef = doc(firestore, 'scholarshipApplications', applicationId);
        const appDoc = await getDoc(appRef);

        if(!appDoc.exists()) {
            toast({variant: 'destructive', title: 'Not Found', description: 'No application found with this ID.'});
            setIsLoading(false);
            return;
        }

        const appData = appDoc.data();

        if (appData.status !== 'approved') {
             toast({variant: 'destructive', title: 'Not Approved', description: 'Your admit card is not yet available. Application is not approved.'});
             setIsLoading(false);
             return;
        }

        if (!appData.allottedCenterId && appData.examMode === 'offline') {
            toast({variant: 'destructive', title: 'Center Not Allotted', description: 'Your admit card is ready, but a center has not been assigned yet. Please contact us.', action: <Button onClick={() => window.open('tel:+918949814095')}>Call +91 8949814095</Button>});
            setIsLoading(false);
            return;
        }
        
        let centerForAdmitCardDate: any = null;

        if (appData.examMode === 'offline' && appData.allottedCenterId) {
            centerForAdmitCardDate = centers?.find(c => c.id === appData.allottedCenterId);
        } else if (appData.examMode === 'online' && centers && centers.length > 0) {
            // For online, use the latest general schedule for admit card date check
            centerForAdmitCardDate = centers.sort((a,b) => b.createdAt.seconds - a.createdAt.seconds)[0];
        }

        if (centerForAdmitCardDate) {
            const admitCardDate = new Date(centerForAdmitCardDate.admitCardDate);
            if (new Date() < admitCardDate) {
                toast({
                    variant: 'destructive', 
                    title: 'Not Available Yet', 
                    description: `आपके केंद्र का एडमिट कार्ड अभी डाउनलोड करने का समय नहीं आया है। आपका एडमिट कार्ड ${admitCardDate.toLocaleDateString()} को आएगा।`
                });
                setIsLoading(false);
                return;
            }
            if (appData.examMode === 'offline') {
                setAllottedCenter(centerForAdmitCardDate);
            }
        }
        
        setApplication(appData);
        setIsLoading(false);
    }
    

    const handlePrint = () => window.print();

    const offlineFee = centers?.sort((a,b) => b.createdAt.seconds - a.createdAt.seconds)[0]?.offlineScholarshipFee || 60;

    if (!application) {
         return (
            <div className="max-w-md mx-auto space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Download Admit Card</CardTitle>
                        <CardDescription>Enter your 5-digit Application ID to download your admit card.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-2">
                        <Input 
                            placeholder="Enter Application ID" 
                            value={applicationId}
                            onChange={(e) => setApplicationId(e.target.value)}
                            maxLength={5}
                        />
                        <Button onClick={handleSearch} disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin" /> : 'Search'}
                        </Button>
                    </CardContent>
                </Card>
                <div className="text-center">
                    <Button variant="link" asChild>
                        <Link href="/scholarship/find-id">Forgot Application ID?</Link>
                    </Button>
                </div>
            </div>
         )
    }

    return (
        <div className="max-w-4xl mx-auto p-4 print:p-0">
             <Card className="bg-card shadow-lg print:shadow-none print:border-none">
                <CardHeader className="text-center bg-muted/30 p-4 print:bg-transparent">
                    <CardTitle className="text-2xl font-bold">VSP Admit Card</CardTitle>
                    <CardDescription>Vidya Scholarship Program - Examination 2024</CardDescription>
                </CardHeader>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><p className="text-sm text-muted-foreground">Application No.</p><p className="font-semibold">{application.id}</p></div>
                             <div><p className="text-sm text-muted-foreground">Exam Mode</p><p className="font-semibold capitalize">{application.examMode}</p></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><p className="text-sm text-muted-foreground">Candidate's Name</p><p className="font-semibold">{application.fullName}</p></div>
                            <div><p className="text-sm text-muted-foreground">Father's Name</p><p className="font-semibold">{application.fatherName}</p></div>
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div><p className="text-sm text-muted-foreground">Date of Birth</p><p className="font-semibold">{new Date(application.dob).toLocaleDateString()}</p></div>
                            <div><p className="text-sm text-muted-foreground">Gender</p><p className="font-semibold capitalize">{application.gender}</p></div>
                        </div>
                        
                        {application.examMode === 'offline' && allottedCenter ? (
                            <div className="pt-4 border-t">
                                <h3 className="font-bold mb-2 text-primary">Examination Center Details</h3>
                                <div className="space-y-2">
                                     <div className="flex items-center gap-2"><School className="h-4 w-4 text-muted-foreground" /><p><strong>Center:</strong> {allottedCenter.name}</p></div>
                                     <div className="flex items-start gap-2"><MapPin className="h-4 w-4 text-muted-foreground mt-1" /><p><strong>Address:</strong> {allottedCenter.address}, {allottedCenter.city}, {allottedCenter.state} - {allottedCenter.pincode}</p></div>
                                     <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><p><strong>Date:</strong> {new Date(allottedCenter.examDate).toLocaleDateString()}</p></div>
                                     <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><p><strong>Time:</strong> {allottedCenter.examTime}</p></div>
                                </div>
                            </div>
                        ) : null
                        }
                        
                    </div>
                    <div className="space-y-4 flex flex-col items-center">
                        <div className="w-32 h-40 bg-muted rounded-md flex items-center justify-center">
                           {application.photoUrl ? <Image src={application.photoUrl} alt="Candidate Photo" width={128} height={160} className="object-cover rounded-md"/> : <p className="text-xs text-muted-foreground">Photo</p>}
                        </div>
                         <div className="w-32 h-16 bg-muted rounded-md flex items-center justify-center">
                           {application.signatureUrl ? <Image src={application.signatureUrl} alt="Candidate Signature" width={128} height={64} className="object-contain p-1"/> : <p className="text-xs text-muted-foreground">Signature</p>}
                        </div>
                    </div>

                </CardContent>
                <CardFooter className="flex flex-col gap-4 bg-muted/30 p-4 print:bg-transparent">
                     <div className="w-full">
                        <h3 className="font-bold text-destructive mb-2">महत्वपूर्ण निर्देश:</h3>
                        <ul className="list-decimal list-inside text-xs space-y-1">
                           {application.examMode === 'offline' && <li>कृपया परीक्षा केंद्र पर प्रवेश पत्र के साथ एक वैध फोटो पहचान पत्र (जैसे आधार कार्ड) अवश्य लाएं।</li>}
                           {application.examMode === 'offline' && <li>परीक्षा शुरू होने से कम से कम 30 मिनट पहले परीक्षा केंद्र पर पहुंचें।</li>}
                           {application.examMode === 'offline' && <li className='font-bold'>आपको परीक्षा केंद्र पर ₹{offlineFee} का शुल्क नकद जमा करना होगा।</li>}
                            <li>परीक्षा हॉल में किसी भी प्रकार के इलेक्ट्रॉनिक उपकरण (मोबाइल फोन, स्मार्ट वॉच आदि) ले जाना सख्त वर्जित है।</li>
                        </ul>
                     </div>
                     <Button onClick={handlePrint} className="w-full print:hidden">
                        <Download className="mr-2 h-4 w-4"/>
                        Download / Print
                    </Button>
                </CardFooter>
             </Card>
        </div>
    );
}
