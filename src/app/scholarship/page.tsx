
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, FileText, Download, BarChart, Bell } from 'lucide-react';

const featureCards = [
  {
    icon: FileText,
    title: 'Apply Now',
    description: 'Complete our simple 5-step application to register for the test.',
    href: '/scholarship/apply',
    color: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
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
    href: '#',
    color: 'bg-green-500/10 border-green-500/30 text-green-300',
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featureCards.map((card, index) => (
                <Card key={index} className={`overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2 ${card.color}`}>
                    <Link href={card.href} className="flex flex-col items-center justify-start h-full p-6">
                        <CardHeader className="items-center p-0 mb-4">
                            <card.icon className="h-10 w-10 mb-2" />
                            <CardTitle className="text-lg font-bold text-foreground">{card.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <p className="text-sm text-muted-foreground">{card.description}</p>
                        </CardContent>
                    </Link>
                </Card>
            ))}
        </div>
        
    </div>
  );
}
