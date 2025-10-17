
'use server';

import { z } from 'zod';
import { firestore } from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { vidyaSearch } from '@/ai/flows/vidya-search';

// --- Firebase Admin SDK Singleton ---
// This ensures that the Firebase Admin SDK is initialized only once,
// preventing the "The default Firebase app already exists" error in serverless environments.
let adminApp: App | null = null;
let db: firestore.Firestore | null = null;

function initializeAdmin() {
  if (!adminApp) {
    if (getApps().length > 0) {
      adminApp = getApps()[0];
      db = getFirestore(adminApp);
    } else {
      try {
        // IMPORTANT: Your service account key must be set as an environment variable
        // named FIREBASE_SERVICE_ACCOUNT_KEY in your deployment environment.
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);
        adminApp = initializeApp({
          credential: cert(serviceAccount),
        });
        db = getFirestore(adminApp);
      } catch (e) {
        console.error('Firebase Admin initialization failed:', e);
        // We do not throw an error here, so the AI part can still be tried.
        // The DB calls will fail gracefully later.
      }
    }
  }
  return { adminApp, db };
}
// --- End of Singleton ---


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

async function searchInCollection(db: firestore.Firestore | null, collectionName: string, id: string): Promise<firestore.DocumentData | null> {
    if (!db) return null; // Guard against uninitialized DB
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
  
  const { db } = initializeAdmin();
  const query = validatedFields.data.query;
  const results: SearchResultItem[] = [];

  try {
    if (db) {
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
    }


    // 4. If no results from DB, use Genkit AI
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
             // If DB also failed, show a combined error.
             if (!db) {
                 return { error: 'Could not connect to the database, and the AI search also failed.', query};
             }
             // If only AI failed.
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
