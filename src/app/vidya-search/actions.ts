

'use server';

import { z } from 'zod';
import admin from 'firebase-admin';

// Helper function to initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : undefined;

  if (!serviceAccount) {
    throw new Error('Firebase service account key is not available.');
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}


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

async function searchByIds(firestore: admin.firestore.Firestore, id: string) {
    const results: SearchResultItem[] = [];

    try {
        // Since we are searching for a substring, we cannot do a direct query.
        // We will fetch all and filter in memory. This is not ideal for large datasets.
        // A more scalable solution would involve a dedicated search service like Algolia or Elasticsearch.
        
        const enrollmentSnapshot = await firestore.collection('enrollments').get();
        enrollmentSnapshot.forEach(doc => {
            if (doc.id.startsWith(id)) {
                 const enrollment = doc.data();
                 results.push({
                    type: 'enrollment',
                    title: `Enrollment Details: ${enrollment.itemName}`,
                    description: `ID: ${String(enrollment.id).substring(0,5)}\nStatus: ${enrollment.isApproved ? 'Approved' : 'Pending'}\nRequested On: ${enrollment.enrollmentDate.toDate().toLocaleDateString()}`,
                    data: enrollment,
                    score: 100 // High score for direct ID match
                });
            }
        });

        const orderSnapshot = await firestore.collection('bookOrders').get();
        orderSnapshot.forEach(doc => {
            if (doc.id.startsWith(id)) {
                 const bookOrder = doc.data();
                 results.push({
                    type: 'order',
                    title: `Book Order Details: ${bookOrder.bookTitle}`,
                    description: `ID: ${String(bookOrder.id).substring(0,5)}\nStatus: ${bookOrder.status}\nOrdered On: ${bookOrder.orderDate.toDate().toLocaleDateString()}`,
                    data: bookOrder,
                    score: 100 // High score for direct ID match
                });
            }
        });

    } catch (error) {
        console.error(`Error searching by ID ${id}:`, error);
    }
    return results;
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
  
  let firestore;
  try {
    const adminApp = initializeFirebaseAdmin();
    firestore = adminApp.firestore();
  } catch (e: any) {
    console.error("Firebase Admin initialization failed:", e);
    return { error: 'डेटाबेस से कनेक्ट नहीं हो सका। कृपया बाद में प्रयास करें।', query: validatedFields.data.query };
  }

  const searchQuery = validatedFields.data.query.trim();
  let results: SearchResultItem[] = [];

  try {
    const isFiveDigitId = /^\d{5}$/.test(searchQuery);

    if (isFiveDigitId) {
        const idResults = await searchByIds(firestore, searchQuery);
        results.push(...idResults);
    }

    // Always perform text search, and merge results.
    const searchTerms = searchQuery.toLowerCase().split(' ').filter(term => term.length > 0);
    const vidyaSearchSnapshot = await firestore.collection('vidya_search_data').get();
    
    vidyaSearchSnapshot.forEach(doc => {
        const data = doc.data();
        const title = data.title?.toLowerCase() || '';
        const description = data.description?.toLowerCase() || '';
        
        let score = 0;
        searchTerms.forEach(term => {
            if (title.includes(term)) {
                score += 2; // Higher weight for title matches
            }
            if (description.includes(term)) {
                score += 1;
            }
        });

        if (score > 0) {
            // Avoid adding duplicates if already found by ID
            if (!results.some(r => r.data?.id === data.id)) {
                 results.push({
                    type: 'vidya',
                    title: data.title,
                    description: data.description,
                    link: data.link,
                    imageUrl: data.imageUrl,
                    score: score,
                    data: data, // include original data if needed
                });
            }
        }
    });

    if (results.length === 0) {
      return { error: 'आपकी खोज के लिए कोई परिणाम नहीं मिला।', query: searchQuery };
    }

    // Sort results by score (descending)
    results.sort((a, b) => (b.score || 0) - (a.score || 0));
    
    // Remove duplicates based on title and description to clean up results
    const uniqueResults = results.filter((item, index, self) => 
        index === self.findIndex(t => (
            t.title === item.title && t.description === item.description
        ))
    );


    return { results: uniqueResults, query: searchQuery };

  } catch (error) {
    console.error('Search failed:', error);
    return { error: 'खोज के दौरान एक अप्रत्याशित त्रुटि हुई।' };
  }
}
