

'use server';

import { z } from 'zod';
import { firestore } from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';

// --- Firebase Admin SDK Singleton ---
let adminApp: App | null = null;

function getAdminApp() {
  if (adminApp) {
    return adminApp;
  }
  
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }
  
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);
    adminApp = initializeApp({
      credential: cert(serviceAccount),
    });
    return adminApp;
  } catch (e) {
    console.error('Firebase Admin initialization failed:', e);
    return null;
  }
}
// --- End of Singleton ---


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

async function searchInCollectionById(db: firestore.Firestore | null, id: string): Promise<SearchResultItem[]> {
    if (!db) return [];
    const results: SearchResultItem[] = [];

    try {
        // Search for Enrollment ID
        const enrollmentRef = db.collection('enrollments').doc(id);
        const enrollmentDoc = await enrollmentRef.get();
        if (enrollmentDoc.exists) {
            const enrollment = enrollmentDoc.data();
            if (enrollment) {
                 results.push({
                    type: 'enrollment',
                    title: `Enrollment Details: ${enrollment.itemName}`,
                    description: `ID: ${String(enrollment.id).substring(0,5)}\nStatus: ${enrollment.isApproved ? 'Approved' : 'Pending'}\nRequested On: ${enrollment.enrollmentDate.toDate().toLocaleDateString()}`,
                    data: enrollment,
                });
            }
        }
        
        // Search for Book Order ID
        const bookOrderRef = db.collection('bookOrders').doc(id);
        const bookOrderDoc = await bookOrderRef.get();
        if (bookOrderDoc.exists) {
             const bookOrder = bookOrderDoc.data();
             if (bookOrder) {
                results.push({
                    type: 'order',
                    title: `Book Order Details: ${bookOrder.bookTitle}`,
                    description: `ID: ${String(bookOrder.id).substring(0,5)}\nStatus: ${bookOrder.status}\nOrdered On: ${bookOrder.orderDate.toDate().toLocaleDateString()}`,
                    data: bookOrder,
                });
             }
        }

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
  
  const app = getAdminApp();
  const db = app ? getFirestore(app) : null;
  const query = validatedFields.data.query.trim();
  let results: SearchResultItem[] = [];

  try {
    if (!db) {
       return { error: 'डेटाबेस से कनेक्ट नहीं हो सका। कृपया बाद में प्रयास करें।', query };
    }

    const isFiveDigitId = /^\d{5}$/.test(query);

    if (isFiveDigitId) {
        const idResults = await searchInCollectionById(db, query);
        results.push(...idResults);
    }

    // Always perform text search, and merge results.
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    const vidyaSearchSnapshot = await db.collection('vidya_search_data').get();
    
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
      return { error: 'आपकी खोज के लिए कोई परिणाम नहीं मिला।', query };
    }

    // Sort results by score (descending)
    results.sort((a, b) => (b.score || 0) - (a.score || 0));
    
    // Remove duplicates based on title and description to clean up results
    const uniqueResults = results.filter((item, index, self) => 
        index === self.findIndex(t => (
            t.title === item.title && t.description === item.description
        ))
    );


    return { results: uniqueResults, query };

  } catch (error) {
    console.error('Search failed:', error);
    return { error: 'खोज के दौरान एक अप्रत्याशित त्रुटि हुई।' };
  }
}
