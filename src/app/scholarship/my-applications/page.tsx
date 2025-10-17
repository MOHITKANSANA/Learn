
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Loader2, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function MyApplicationsPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const applicationQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'scholarshipApplications'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    }, [user, firestore]);
    
    const { data: applications, isLoading } = useCollection(applicationQuery);

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'submitted':
            case 'pending':
                return 'default';
            case 'approved':
                return 'secondary';
            case 'rejected':
                return 'destructive';
            default:
                return 'outline';
        }
    };

     const getStatusIcon = (status: string) => {
        switch (status) {
            case 'submitted':
            case 'pending':
                return <Clock className="mr-2 h-4 w-4" />;
            case 'approved':
                return <CheckCircle className="mr-2 h-4 w-4" />;
            case 'rejected':
                return <XCircle className="mr-2 h-4 w-4" />;
            default:
                return <FileText className="mr-2 h-4 w-4" />;
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin"/></div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold font-headline">My Scholarship Applications</h1>
                <p className="text-muted-foreground mt-2">Track the status of your scholarship submissions.</p>
            </div>
            
            {applications && applications.length > 0 ? (
                <div className="space-y-4">
                    {applications.map(app => (
                        <Card key={app.id}>
                            <CardHeader className="flex flex-row items-start justify-between">
                                <div>
                                    <CardTitle>Application #{app.id}</CardTitle>
                                    <CardDescription>Submitted on: {new Date(app.createdAt.seconds * 1000).toLocaleDateString()}</CardDescription>
                                </div>
                                <Badge variant={getStatusVariant(app.status)} className="capitalize">
                                    {getStatusIcon(app.status)}
                                    {app.status}
                                </Badge>
                            </CardHeader>
                            <CardContent>
                                <p><strong>Exam Mode:</strong> <span className="capitalize">{app.examMode}</span></p>
                                {app.status === 'approved' && (
                                    <div className="mt-4 flex gap-4">
                                        <Button asChild><Link href="/scholarship/admit-card">View Admit Card</Link></Button>
                                        {app.examMode === 'online' && <Button asChild variant="secondary"><Link href="/scholarship/test">Start Test</Link></Button>}
                                    </div>
                                )}
                                {app.status === 'submitted' && <p className="text-sm text-muted-foreground mt-2">Your application is under review.</p>}
                                {app.status === 'rejected' && <p className="text-sm text-destructive mt-2">Your application has been rejected.</p>}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <FileText className="h-20 w-20 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-semibold mb-2">No Applications Found</h2>
                    <p className="text-muted-foreground mb-6">You haven't applied for any scholarships yet.</p>
                    <Button asChild>
                        <Link href="/scholarship/payment">Apply Now</Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
