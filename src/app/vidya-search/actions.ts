
'use server';

import { z } from 'zod';
import { firestore } from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { vidyaSearch } from '@/ai/flows/vidya-search';

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
            return { id: docSnap.id, ...docSnap.data() };
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
  
  const app = getAdminApp();
  const db = app ? getFirestore(app) : null;
  const query = validatedFields.data.query.trim();
  const results: SearchResultItem[] = [];

  try {
    if (db) {
        // 1. Search for Enrollment ID
        const enrollment = await searchInCollection(db, 'enrollments', query);
        if (enrollment) {
            results.push({
                type: 'enrollment',
                title: `एनरोलमेंट विवरण: ${enrollment.itemName}`,
                description: `स्थिति: ${enrollment.isApproved ? 'स्वीकृत' : 'लंबित'}\nअनुरोध तिथि: ${enrollment.enrollmentDate.toDate().toLocaleDateString()}`,
                data: enrollment,
            });
        }

        // 2. Search for Book Order ID
        const bookOrder = await searchInCollection(db, 'bookOrders', query);
        if (bookOrder) {
            results.push({
                type: 'order',
                title: `पुस्तक ऑर्डर विवरण: ${bookOrder.bookTitle}`,
                description: `स्थिति: ${bookOrder.status}\nऑर्डर तिथि: ${bookOrder.orderDate.toDate().toLocaleDateString()}`,
                data: bookOrder,
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
                    title: `"${query}" के लिए AI उत्तर`,
                    description: aiResult.result,
                });
            }
        } catch (aiError) {
             console.error("AI search failed:", aiError);
             // If DB also failed, show a combined error.
             if (!db) {
                 return { error: 'डेटाबेस से कनेक्ट नहीं हो सका, और AI खोज भी विफल रही।', query};
             }
             // If only AI failed.
             return { error: 'डेटाबेस या AI से कोई परिणाम नहीं मिला।', query };
        }
    }


    if (results.length === 0) {
      return { error: 'आपकी खोज के लिए कोई परिणाम नहीं मिला।', query };
    }

    return { results, query };

  } catch (error) {
    console.error('Search failed:', error);
    return { error: 'खोज के दौरान एक अप्रत्याशित त्रुटि हुई।' };
  }
}
