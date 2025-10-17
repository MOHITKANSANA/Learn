
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, FileText, Download, BarChart, Bell, UserCheck, Book, TestTube2, BadgeCheck, FileCheck } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';


const featureCards = [
  {
    icon: FileText,
    title: 'Apply Now',
    description: 'Complete our simple application to register for the test.',
    href: '/scholarship/apply',
    color: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
  },
  {
    icon: UserCheck,
    title: 'My Applications',
    description: 'Check the status and details of your scholarship applications.',
    href: '/scholarship/my-applications',
    color: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
  },
  {
    icon: Bell,
    title: 'City Intimation',
    description: 'Check your allocated exam city and center details here.',
    href: '#',
    color: 'bg-orange-500/10 border-orange-500/30 text-orange-300',
  },
  {
    icon: Download,
    title: 'Admit Card',
    description: 'Download your official admit card to appear for the exam.',
    href: '/scholarship/admit-card',
    color: 'bg-green-500/10 border-green-500/30 text-green-300',
  },
   {
    icon: TestTube2,
    title: 'Start Test',
    description: 'Begin your online scholarship examination from here.',
    href: '/scholarship/test',
    color: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
  },
  {
    icon: BarChart,
    title: 'Check Result',
    description: 'View your test scores and scholarship results after the exam.',
    href: '#',
    color: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
  },
];


export default function ScholarshipPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [hasApplied, setHasApplied] = useState(false);

    const scholarshipQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'scholarshipApplications'), where('userId', '==', user.uid));
    }, [user, firestore]);
    
    const {data: applications, isLoading} = useCollection(scholarshipQuery);

    useEffect(() => {
        if (applications && applications.length > 0) {
            setHasApplied(true);
        }
    }, [applications]);

  return (
    <div className="max-w-4xl mx-auto text-center">
        <div className="mb-12 flex flex-col items-center">
             <div className="p-4 bg-primary/10 rounded-full mb-4">
                <Trophy className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-5xl font-extrabold font-headline tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">
                Vidya Scholarship Program
            </h1>
            <p className="text-muted-foreground mt-4 text-lg max-w-2xl mx-auto">
                Unlock your potential. Compete for scholarships and get a chance to fulfill your academic dreams with our support.
            </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureCards.map((card) => {
                const isDisabled = (card.title !== 'Apply Now' && !hasApplied);
                return (
                    <Card 
                        key={card.title} 
                        className={`overflow-hidden transition-all duration-300  ${card.color} ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl hover:-translate-y-2'}`}
                    >
                        <Link href={isDisabled ? '#' : card.href} className="flex flex-col items-center justify-start h-full p-6" aria-disabled={isDisabled}>
                            <CardHeader className="items-center p-0 mb-4">
                                <card.icon className="h-10 w-10 mb-2" />
                                <CardTitle className="text-lg font-bold text-foreground">{card.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <p className="text-sm text-muted-foreground">{card.description}</p>
                            </CardContent>
                        </Link>
                    </Card>
                )
            })}
        </div>
        
    </div>
  );
}
