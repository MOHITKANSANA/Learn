'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Loader2, Download, User, Calendar, Clock, MapPin, School, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function AdmitCardPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const applicationQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'scholarshipApplications'), where('userId', '==', user.uid));
    }, [user, firestore]);
    
    const { data: applications, isLoading } = useCollection(applicationQuery);

    const centersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'scholarship_centers') : null, [firestore]);
    const { data: centers, isLoading: isLoadingCenters } = useCollection(centersQuery);
    
    if (isLoading || isLoadingCenters) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin"/></div>;
    }

    if (!applications || applications.length === 0) {
        return <div className="text-center mt-10">You have not applied for the scholarship yet.</div>;
    }

    const application = applications[0]; // Assuming one application per user for now
    const allottedCenter = centers?.find(c => c.id === application.allottedCenterId);

    const handlePrint = () => window.print();

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
                            <div><p className="text-sm text-muted-foreground">Application No.</p><p className="font-semibold">{application.id.substring(0, 12)}</p></div>
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
                                     <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><p><strong>Address:</strong> {allottedCenter.address}, {allottedCenter.city}, {allottedCenter.state} - {allottedCenter.pincode}</p></div>
                                     <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><p><strong>Date:</strong> {new Date(allottedCenter.examDate).toLocaleDateString()}</p></div>
                                     <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><p><strong>Time:</strong> {allottedCenter.examTime}</p></div>
                                </div>
                            </div>
                        ) : application.examMode === 'online' ? (
                             <div className="pt-4 border-t">
                                <h3 className="font-bold mb-2 text-primary">Online Examination Details</h3>
                                 <p className="text-sm text-muted-foreground">Your test will be conducted online. You can start the test from the scholarship page on the scheduled date and time.</p>
                                 {/* You can add date/time here if available */}
                            </div>
                        ) : (
                             <div className="pt-4 border-t text-center text-muted-foreground">Center not allotted yet.</div>
                        )}
                        
                    </div>
                    <div className="space-y-4 flex flex-col items-center">
                        <div className="w-32 h-32 bg-muted rounded-md flex items-center justify-center">
                           {application.photoUrl ? <Image src={application.photoUrl} alt="Candidate Photo" width={128} height={128} className="object-cover rounded-md"/> : <p className="text-xs text-muted-foreground">Photo</p>}
                        </div>
                         <div className="w-32 h-12 bg-muted rounded-md flex items-center justify-center">
                           {application.signatureUrl ? <Image src={application.signatureUrl} alt="Candidate Signature" width={128} height={48} className="object-contain rounded-md"/> : <p className="text-xs text-muted-foreground">Signature</p>}
                        </div>
                    </div>

                </CardContent>
                <CardFooter className="flex flex-col gap-4 bg-muted/30 p-4 print:bg-transparent">
                     <div className="w-full">
                        <h3 className="font-bold text-destructive mb-2">महत्वपूर्ण निर्देश:</h3>
                        <ul className="list-decimal list-inside text-xs space-y-1">
                            <li>कृपया परीक्षा केंद्र पर प्रवेश पत्र के साथ एक वैध फोटो पहचान पत्र (जैसे आधार कार्ड) अवश्य लाएं।</li>
                            <li>परीक्षा शुरू होने से कम से कम 30 मिनट पहले परीक्षा केंद्र पर पहुंचें।</li>
                            <li>परीक्षा हॉल में किसी भी प्रकार के इलेक्ट्रॉनिक उपकरण (मोबाइल फोन, स्मार्ट वॉच आदि) ले जाना सख्त वर्जित है।</li>
                            <li>आपको परीक्षा केंद्र पर ₹60 का शुल्क नकद जमा करना होगा। (यह शुल्क एडमिन पैनल से बदला जा सकता है)।</li>
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
