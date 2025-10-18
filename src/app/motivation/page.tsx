'use client';
import { Sparkles, Loader2 } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { useMemo } from 'react';

export default function MotivationPage() {
  const firestore = useFirestore();
  const quotesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'motivational_quotes') : null, [firestore]);
  const { data: quotes, isLoading: isLoadingQuotes } = useCollection(quotesQuery);

  const randomQuote = useMemo(() => {
    if (!quotes || quotes.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
  }, [quotes]);


  return (
    <div className="text-center flex flex-col items-center justify-center h-full">
      <Sparkles className="h-16 w-16 text-primary mb-4" />
      <h1 className="text-4xl font-bold font-headline">Stay Motivated!</h1>
      {isLoadingQuotes ? (
        <Loader2 className="h-8 w-8 animate-spin mt-6" />
      ) : (
        randomQuote ? (
          <Card className="mt-8 max-w-2xl bg-primary/10 border-primary/20">
            <CardContent className="p-6">
              <blockquote className="text-xl italic">
                "{randomQuote.text}"
              </blockquote>
              {randomQuote.author && (
                <p className="text-right mt-4 text-muted-foreground">- {randomQuote.author}</p>
              )}
            </CardContent>
          </Card>
        ) : (
           <p className="text-muted-foreground mt-4 text-lg max-w-md">
            "The secret to getting ahead is getting started." – Mark Twain.
          </p>
        )
      )}
    </div>
  );
}
