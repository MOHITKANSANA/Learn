'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { performSearch, State } from '@/app/vidya-search/actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Search, Link as LinkIcon, Bot, Package, CheckCircle } from 'lucide-react';
import Link from 'next/link';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg">
      {pending ? (
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      ) : (
        <Search className="mr-2 h-5 w-5" />
      )}
      Search
    </Button>
  );
}

function ResultIcon({ type }: { type: State['results'][0]['type'] }) {
    switch (type) {
        case 'ai': return <Bot className="h-6 w-6 text-primary" />;
        case 'link': return <LinkIcon className="h-6 w-6 text-blue-500" />;
        case 'order': return <Package className="h-6 w-6 text-orange-500" />;
        case 'enrollment': return <CheckCircle className="h-6 w-6 text-green-500" />;
        default: return <Search className="h-6 w-6 text-muted-foreground" />;
    }
}


export default function VidyaSearchPage() {
  const [state, formAction] = useFormState(performSearch, {});

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center">
         <h1 className="text-5xl font-bold font-headline tracking-tight">
            <span className="text-blue-500">V</span>
            <span className="text-red-500">i</span>
            <span className="text-yellow-500">d</span>
            <span className="text-blue-500">y</span>
            <span className="text-green-500">a</span>
            <span className="text-red-500"> </span>
            Search
        </h1>
        <p className="text-muted-foreground mt-2">
            Your personal gateway to information and services.
        </p>
      </div>

      <form action={formAction} className="flex items-center gap-2">
        <Input
          name="query"
          placeholder="Search for anything or enter your Order/Enrollment ID..."
          className="text-base h-12 flex-grow"
          required
        />
        <SubmitButton />
      </form>

       {state.results && (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Search Results for "{state.query}"</h2>
            {state.results.map((result, index) => (
                <Card key={index}>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <ResultIcon type={result.type}/>
                        <div>
                            <CardTitle>{result.title}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground whitespace-pre-wrap">{result.description}</p>
                        {result.link && (
                             <Button asChild variant="link" className="px-0">
                                <Link href={result.link} target="_blank" rel="noopener noreferrer">
                                    Visit Link <LinkIcon className="ml-2 h-4 w-4"/>
                                </Link>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
      )}

      {state.error && (
         <Card className="bg-destructive/10 border-destructive text-destructive-foreground">
           <CardHeader>
             <CardTitle>Search Error</CardTitle>
           </CardHeader>
           <CardContent>
            <p>{state.error}</p>
           </CardContent>
        </Card>
      )}

    </div>
  );
}
