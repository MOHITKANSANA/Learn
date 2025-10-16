'use client';

import { useParams } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Briefcase, Star, BookOpen } from 'lucide-react';

export default function EducatorProfilePage() {
  const params = useParams();
  const educatorId = params.id as string;
  const firestore = useFirestore();

  const educatorRef = useMemoFirebase(() => 
    firestore && educatorId ? doc(firestore, 'educators', educatorId) : null
  , [firestore, educatorId]);
  
  const { data: educator, isLoading } = useDoc(educatorRef);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!educator) {
    return <div className="text-center text-muted-foreground mt-10">Educator not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30 p-8 flex flex-col md:flex-row items-center gap-8">
          <Avatar className="h-32 w-32 border-4 border-primary">
            <AvatarImage src={educator.imageUrl} alt={educator.name} />
            <AvatarFallback className="text-4xl">{educator.name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="text-center md:text-left">
            <CardTitle className="text-4xl font-headline">{educator.name}</CardTitle>
            <p className="text-xl text-muted-foreground mt-1">{educator.subject}</p>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                <div className="bg-card p-4 rounded-lg">
                    <Briefcase className="h-8 w-8 mx-auto mb-2 text-primary"/>
                    <p className="font-bold text-2xl">{educator.experience}+</p>
                    <p className="text-muted-foreground">Years of Experience</p>
                </div>
                 <div className="bg-card p-4 rounded-lg">
                    <Star className="h-8 w-8 mx-auto mb-2 text-primary"/>
                    <p className="font-bold text-2xl">4.8</p>
                    <p className="text-muted-foreground">Rating</p>
                </div>
                 <div className="bg-card p-4 rounded-lg">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary"/>
                    <p className="font-bold text-2xl">10+</p>
                    <p className="text-muted-foreground">Courses</p>
                </div>
            </div>
          <div>
            <h3 className="text-2xl font-bold mb-2">About {educator.name.split(' ')[0]}</h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {educator.description}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    