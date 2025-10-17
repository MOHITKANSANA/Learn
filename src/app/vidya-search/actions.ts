'use server';

import { z } from 'zod';
import { firestore } from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { vidyaSearch } from '@/ai/flows/vidya-search';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);
    initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (e) {
    console.error('Failed to initialize Firebase Admin SDK:', e);
  }
}

const SearchSchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty.'),
});

type SearchResultItem = {
    type: 'enrollment' | 'order' | 'link' | 'ai';
    title: string;
    description: string;
    link?: string;
    data?: any;
}

export type State = {
  results?: SearchResultItem[];
  error?: string;
  query?: string;
};

async function searchInCollection(db: firestore.Firestore, collectionName: string, id: string): Promise<firestore.DocumentData | null> {
    try {
        const docRef = db.collection(collectionName).doc(id);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            return docSnap.data() as firestore.DocumentData;
        }
        return null;
    } catch (error) {
        console.error(`Error searching in ${collectionName}:`, error);
        return null;
    }
}


export async function performSearch(prevState: State, formData: FormData): Promise<State> {
  const validatedFields = SearchSchema.safeParse({
    query: formData.get('query'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.query?.join(', '),
    };
  }

  const query = validatedFields.data.query;
  const db = getFirestore();
  const results: SearchResultItem[] = [];

  try {
    // 1. Search for Enrollment ID
    const enrollment = await searchInCollection(db, 'enrollments', query);
    if (enrollment) {
      results.push({
        type: 'enrollment',
        title: `Enrollment Details: ${enrollment.itemName}`,
        description: `Status: ${enrollment.isApproved ? 'Approved' : 'Pending'}. Enrolled on: ${enrollment.enrollmentDate.toDate().toLocaleDateString()}`,
        data: enrollment,
      });
    }

    // 2. Search for Book Order ID
    const bookOrder = await searchInCollection(db, 'bookOrders', query);
    if (bookOrder) {
      results.push({
        type: 'order',
        title: `Book Order Details`,
        description: `Status: ${bookOrder.status}. Ordered on: ${bookOrder.orderDate.toDate().toLocaleDateString()}`,
        data: bookOrder,
      });
    }
    
    // 3. Search for Searchable Link
    const searchableLink = await searchInCollection(db, 'searchable_links', query);
    if (searchableLink) {
         results.push({
            type: 'link',
            title: searchableLink.title,
            description: searchableLink.description,
            link: searchableLink.url,
        });
    }

    // 4. If no results, use Genkit AI
    if (results.length === 0) {
        try {
            const aiResult = await vidyaSearch({ query });
            if (aiResult.result) {
                results.push({
                    type: 'ai',
                    title: `AI Answer for "${query}"`,
                    description: aiResult.result,
                });
            }
        } catch (aiError) {
             console.error("AI search failed:", aiError);
             return { error: 'Could not find any results in the database or from AI.', query };
        }
    }


    if (results.length === 0) {
      return { error: 'No results found for your query.', query };
    }

    return { results, query };

  } catch (error) {
    console.error('Search failed:', error);
    return { error: 'An unexpected error occurred during the search.' };
  }
}
