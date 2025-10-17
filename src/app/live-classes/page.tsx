'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Loader2, Video, User, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect, useState, useMemo } from 'react';

const LiveClassCountdown = ({ startTime }: { startTime: Date }) => {
    const calculateTimeLeft = () => {
        const difference = +startTime - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearTimeout(timer);
    });

    const timerComponents: JSX.Element[] = [];
    Object.keys(timeLeft).forEach((interval) => {
        // @ts-ignore
        if (timeLeft[interval] !== undefined) {
             timerComponents.push(
                <div key={interval} className="text-center">
                    <div className="font-bold text-lg">
                        {/* @ts-ignore */}
                        {String(timeLeft[interval]).padStart(2, '0')}
                    </div>
                    <div className="text-xs uppercase">{interval}</div>
                </div>
            );
        }
    });
    
    if(!timerComponents.length) return null;

    return (
        <div className="flex justify-center gap-4 text-primary">
            {timerComponents.reduce((prev, curr) => <>{prev}<span className="text-lg">:</span>{curr}</>)}
        </div>
    );
};


export default function LiveClassesPage() {
    const firestore = useFirestore();

    const liveClassesQuery = useMemoFirebase(() =>
        firestore ? query(collection(firestore, 'live_classes'), orderBy('startTime', 'desc')) : null
    , [firestore]);
    const { data: liveClasses, isLoading: isLoadingClasses } = useCollection(liveClassesQuery);

    const educatorsQuery = useMemoFirebase(() =>
        firestore ? collection(firestore, 'educators') : null
    , [firestore]);
    const { data: educators, isLoading: isLoadingEducators } = useCollection(educatorsQuery);

    const educatorsMap = useMemo(() => {
        if (!educators) return new Map();
        return new Map(educators.map(e => [e.id, e]));
    }, [educators]);


    if (isLoadingClasses || isLoadingEducators) {
        return (
            <div className="flex justify-center items-center h-full min-h-[60vh]">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    const now = new Date();

    const upcomingClasses = liveClasses?.filter(c => c.startTime && c.startTime.toDate() >= now) || [];
    const pastClasses = liveClasses?.filter(c => c.startTime && c.startTime.toDate() < now) || [];

    const renderClassCard = (liveClass: any) => {
        const educator = educatorsMap.get(liveClass.educatorId);
        const startTime = liveClass.startTime?.toDate();
        const isLive = startTime && startTime <= now && new Date(startTime.getTime() + 60*60*1000) > now; // Assuming 1 hour duration
        const isUpcoming = startTime && startTime > now;

        return (
            <Card key={liveClass.id} className="overflow-hidden shadow-lg transition-transform transform hover:-translate-y-1">
                <CardHeader>
                    {isLive && (
                        <div className="flex justify-center mb-2">
                             <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            <p className="ml-2 text-red-500 font-bold">Live Now</p>
                        </div>
                    )}
                    <CardTitle className="text-center">{liveClass.title}</CardTitle>
                    {educator && (
                        <div className="flex items-center justify-center gap-2 pt-2 text-muted-foreground text-sm">
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={educator.imageUrl} />
                                <AvatarFallback>{educator.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <span>by {educator.name}</span>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4"/>
                        <span>{startTime?.toLocaleString() || 'Time not set'}</span>
                    </div>
                    {isUpcoming && <LiveClassCountdown startTime={startTime} />}
                </CardContent>
                <CardFooter>
                    <Button asChild className="w-full">
                        <Link href={liveClass.youtubeUrl} target="_blank" rel="noopener noreferrer">
                            <Video className="mr-2 h-4 w-4" />
                            {isUpcoming ? 'Join Now' : 'Watch Recording'}
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        );
    };

    return (
        <div>
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold font-headline">Live Classes</h1>
                <p className="text-muted-foreground mt-2">Join live interactive classes with top educators.</p>
            </div>
            
            <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4">Upcoming Classes</h2>
                 {upcomingClasses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {upcomingClasses.map(renderClassCard)}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-10">No upcoming live classes scheduled yet. Stay tuned!</p>
                )}
            </section>

             <section>
                <h2 className="text-2xl font-bold mb-4">Past Classes</h2>
                 {pastClasses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pastClasses.map(renderClassCard)}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-10">No past classes available.</p>
                )}
            </section>
        </div>
    );
}
