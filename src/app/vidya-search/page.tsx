

'use client';

import { useState, useMemo, useActionState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardTitle } from '@/components/ui/card';
import { Loader2, Search, Link as LinkIcon, Bot, Package, CheckCircle, GraduationCap, FileText, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { performSearch, State as SearchState } from './actions';
import { Button } from '@/components/ui/button';

type SearchResultItem = {
    type: 'enrollment' | 'order' | 'link' | 'ai' | 'vidya';
    title: string;
    description: string;
    link?: string;
    imageUrl?: string | null;
    data?: any;
    score?: number;
}

function ResultIcon({ type }: { type: SearchResultItem['type'] }) {
    switch (type) {
        case 'ai': return <Bot className="h-6 w-6 text-purple-400" />;
        case 'vidya':
        case 'link': return <FileText className="h-6 w-6 text-blue-500" />;
        case 'order': return <Package className="h-6 w-6 text-orange-500" />;
        case 'enrollment': return <CheckCircle className="h-6 w-6 text-green-500" />;
        default: return <Search className="h-6 w-6 text-muted-foreground" />;
    }
}

const quickLinks = [
    { name: 'ChatGPT', url: 'https://chat.openai.com' },
    { name: 'YouTube', url: 'https://youtube.com' },
    { name: 'Gemini', url: 'https://gemini.google.com' },
    { name: 'Google', url: 'https://google.com' },
    { name: 'Quora', url: 'https://quora.com' },
];

export default function VidyaSearchPage() {
  const [state, formAction] = useActionState(performSearch, { results: [] });
  const [searchTerm, setSearchTerm] = useState('');

  const filteredResults = useMemo(() => {
    if (!searchTerm) {
      return state.results || [];
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return state.results?.filter(result => 
        result.title.toLowerCase().includes(lowercasedTerm) ||
        result.description.toLowerCase().includes(lowercasedTerm)
    ) || [];
  }, [searchTerm, state.results]);


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
            <span className="text-foreground">Search</span>
        </h1>
        <p className="text-muted-foreground mt-2">
            Your personal gateway to information and services.
        </p>
      </div>

      <form action={formAction}>
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
             <Input
                name="query"
                placeholder="Search for anything or enter your 5-digit Order/Enrollment ID..."
                className="text-base h-12 pl-10 pr-24"
             />
             <Button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2">Search</Button>
          </div>
      </form>
      
       <div className="space-y-4">
           {state.results && state.results.length > 0 ? (
                <>
                <Input 
                    placeholder="Filter results..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-4"
                />
                {filteredResults.map((result, index) => (
                    <Card key={result.data?.id || index} className="bg-card/70 hover:bg-card/90 transition-colors">
                         <div className="p-4 flex gap-4">
                            {result.imageUrl ? (
                                 <Image src={result.imageUrl} alt={result.title} width={80} height={80} className="rounded-md object-cover" />
                            ) : (
                                 <div className="flex-shrink-0 h-16 w-16 flex items-center justify-center bg-muted rounded-md">
                                    <ResultIcon type={result.type as any}/>
                                </div>
                            )}
                            <div className="flex-grow">
                                <CardTitle className="text-lg mb-1">{result.title}</CardTitle>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.description}</p>
                                {result.link && (
                                    <Button asChild variant="link" className="px-0 h-auto pt-1">
                                        <Link href={result.link} target="_blank" rel="noopener noreferrer">
                                            Visit Link <LinkIcon className="ml-2 h-4 w-4"/>
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
                {filteredResults.length === 0 && <p className="text-center text-muted-foreground">No results match your filter.</p>}
                </>
            ) : state.error ? (
                <Card className="bg-destructive/10 border-destructive text-destructive-foreground">
                    <div className="p-4 text-center">{state.error}</div>
                </Card>
            ) : (
                 <div className="space-y-4">
                    <h3 className="text-center font-semibold text-muted-foreground">Quick Links</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-center">
                        {quickLinks.map(link => (
                            <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className="block p-4 bg-card rounded-lg hover:bg-muted transition-colors">
                                <p className="font-semibold">{link.name}</p>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
}
