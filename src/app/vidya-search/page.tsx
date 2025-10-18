

'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardTitle } from '@/components/ui/card';
import { Loader2, Search, Link as LinkIcon, Bot, Package, CheckCircle, GraduationCap, FileText } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
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


export default function VidyaSearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const firestore = useFirestore();

  const allSearchDataQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'vidya_search_data'), orderBy('createdAt', 'desc')) : null,
    [firestore]
  );
  const { data: allData, isLoading } = useCollection(allSearchDataQuery);

  const filteredResults = useMemo(() => {
    if (!searchQuery) {
        return allData;
    }
    if (!allData) {
        return [];
    }

    const lowercasedQuery = searchQuery.toLowerCase();
    
    return allData
        .map(item => {
            const title = item.title?.toLowerCase() || '';
            const description = item.description?.toLowerCase() || '';
            let score = 0;

            if (title.includes(lowercasedQuery)) score += 5;
            if (description.includes(lowercasedQuery)) score += 2;
            
            const queryTerms = lowercasedQuery.split(' ').filter(t => t.length > 2);
            queryTerms.forEach(term => {
                if (title.includes(term)) score += 2;
                if (description.includes(term)) score += 1;
            });
            
            // Special check for 5-digit IDs
            if (/^\d{5}$/.test(searchQuery) && item.id.startsWith(searchQuery)) {
                score += 100;
            }

            return { ...item, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score);

  }, [searchQuery, allData]);

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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          name="query"
          placeholder="Search for anything or enter your 5-digit Order/Enrollment ID..."
          className="text-base h-12 pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
       
      {isLoading ? <Loader2 className="mx-auto animate-spin" /> :
        <div className="space-y-4">
            {filteredResults && filteredResults.length > 0 ? (
                filteredResults.map((result, index) => (
                    <Card key={result.id || index} className="bg-card/70 hover:bg-card/90 transition-colors">
                         <div className="p-4 flex gap-4">
                            {result.imageUrl ? (
                                 <Image src={result.imageUrl} alt={result.title} width={80} height={80} className="rounded-md object-cover" />
                            ) : (
                                 <div className="flex-shrink-0 h-16 w-16 flex items-center justify-center bg-muted rounded-md">
                                    <ResultIcon type={'vidya'}/>
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
                ))
            ) : (
                <p className="text-center text-muted-foreground py-10">No results found.</p>
            )}
        </div>
      }
    </div>
  );
}
