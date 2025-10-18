

'use server';

import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { getFirestore } from 'firebase-admin/firestore';

const SearchSchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty.'),
});

type SearchResultItem = {
    type: 'enrollment' | 'order' | 'link' | 'ai' | 'vidya';
    title: string;
    description: string;
    link?: string;
    imageUrl?: string | null;
    data?: any;
    // Add a score for relevance ranking
    score?: number;
}

export type State = {
  results?: SearchResultItem[];
  error?: string;
  query?: string;
};

// This Genkit flow will run on the server and has access to the admin environment
const searchFlow = ai.defineFlow(
    {
        name: 'vidyaSearchInternal',
        inputSchema: z.string(),
        outputSchema: z.array(z.any()), // Keep it flexible for internal use
    },
    async (searchQuery) => {
        const firestore = getFirestore();
        let results: SearchResultItem[] = [];

        try {
            // 1. Search for 5-digit IDs (Orders/Enrollments)
            const isFiveDigitId = /^\d{5}$/.test(searchQuery);
            if (isFiveDigitId) {
                const enrollmentRef = firestore.collection('enrollments').doc(searchQuery);
                const orderRef = firestore.collection('bookOrders').doc(searchQuery);

                const [enrollmentDoc, orderDoc] = await Promise.all([
                    enrollmentRef.get(),
                    orderRef.get(),
                ]);

                if (enrollmentDoc.exists) {
                    const enrollment = enrollmentDoc.data();
                    if (enrollment) {
                        results.push({
                            type: 'enrollment',
                            title: `Enrollment Details: ${enrollment.itemName}`,
                            description: `ID: ${enrollment.id}\nStatus: ${enrollment.isApproved ? 'Approved' : 'Pending'}\nRequested On: ${enrollment.enrollmentDate.toDate().toLocaleDateString()}`,
                            data: enrollment,
                            score: 100
                        });
                    }
                }
                if (orderDoc.exists) {
                    const bookOrder = orderDoc.data();
                     if (bookOrder) {
                        results.push({
                            type: 'order',
                            title: `Book Order Details: ${bookOrder.bookTitle}`,
                            description: `ID: ${bookOrder.id}\nStatus: ${bookOrder.status}\nOrdered On: ${bookOrder.orderDate.toDate().toLocaleDateString()}`,
                            data: bookOrder,
                            score: 100
                        });
                    }
                }
            }
            
            // 2. Perform text search on vidya_search_data
            const searchTerms = searchQuery.toLowerCase().split(' ').filter(term => term.length > 0);
            const vidyaSearchSnapshot = await firestore.collection('vidya_search_data').get();
            
            vidyaSearchSnapshot.forEach(doc => {
                const data = doc.data();
                const title = data.title?.toLowerCase() || '';
                const description = data.description?.toLowerCase() || '';
                
                let score = 0;
                searchTerms.forEach(term => {
                    if (title.includes(term)) score += 2;
                    if (description.includes(term)) score += 1;
                });

                if (score > 0) {
                     if (!results.some(r => r.data?.id === data.id)) {
                        results.push({
                            type: 'vidya',
                            title: data.title,
                            description: data.description,
                            link: data.link,
                            imageUrl: data.imageUrl,
                            score: score,
                            data: data,
                        });
                    }
                }
            });

            return results;
        } catch (error) {
            console.error('Internal Search Flow Error:', error);
            // In a real app, you might want more specific error handling
            throw new Error('Failed to execute search in the database.');
        }
    }
);


export async function performSearch(prevState: State, formData: FormData): Promise<State> {
  const validatedFields = SearchSchema.safeParse({
    query: formData.get('query'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.query?.join(', '),
    };
  }
  
  const searchQuery = validatedFields.data.query.trim();

  try {
    const results = await searchFlow(searchQuery);

    if (results.length === 0) {
      return { error: 'आपकी खोज के लिए कोई परिणाम नहीं मिला।', query: searchQuery };
    }

    // Sort results by score (descending)
    results.sort((a, b) => (b.score || 0) - (a.score || 0));
    
    // Remove duplicates
    const uniqueResults = results.filter((item, index, self) => 
        index === self.findIndex(t => (
            t.data?.id === item.data?.id
        ))
    );

    return { results: uniqueResults, query: searchQuery };

  } catch (error) {
    console.error('Search failed:', error);
    // This is the user-facing error.
    return { error: 'डेटाबेस से कनेक्ट नहीं हो सका। कृपया बाद में प्रयास करें।', query: searchQuery };
  }
}
