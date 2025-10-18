

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
}

export type State = {
  results?: SearchResultItem[];
  error?: string;
  query?: string;
};

async function searchInCollectionById(db: firestore.Firestore | null, collectionName: string, id: string): Promise<firestore.DocumentData | null> {
    if (!db) return null;
    try {
        const docRef = db.collection(collectionName).doc(id);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            return { id: docSnap.id, ...docSnap.data() };
        }

        // Fallback for 5-digit IDs by checking startsWith
        const querySnapshot = await db.collection(collectionName).where('id', '>=', id).where('id', '<', id + '\uf8ff').limit(1).get();
        if(!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            if (doc.id.startsWith(id)) {
                 return { id: doc.id, ...doc.data() };
            }
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
  let results: SearchResultItem[] = [];

  try {
    if (!db) {
       return { error: 'डेटाबेस से कनेक्ट नहीं हो सका। कृपया बाद में प्रयास करें।', query };
    }

    const isFiveDigitId = /^\d{5}$/.test(query);

    if (isFiveDigitId) {
        // Search for Enrollment ID
        const enrollment = await searchInCollectionById(db, 'enrollments', query);
        if (enrollment) {
            results.push({
                type: 'enrollment',
                title: `एनरोलमेंट विवरण: ${enrollment.itemName}`,
                description: `आईडी: ${String(enrollment.id).substring(0,5)}\nस्थिति: ${enrollment.isApproved ? 'स्वीकृत' : 'लंबित'}\nअनुरोध तिथि: ${enrollment.enrollmentDate.toDate().toLocaleDateString()}`,
                data: enrollment,
            });
        }

        // Search for Book Order ID
        const bookOrder = await searchInCollectionById(db, 'bookOrders', query);
        if (bookOrder) {
            results.push({
                type: 'order',
                title: `पुस्तक ऑर्डर विवरण: ${bookOrder.bookTitle}`,
                description: `आईडी: ${String(bookOrder.id).substring(0,5)}\nस्थिति: ${bookOrder.status}\nऑर्डर तिथि: ${bookOrder.orderDate.toDate().toLocaleDateString()}`,
                data: bookOrder,
            });
        }
    }


    // General text search
    if (results.length === 0) {
        const vidyaSearchSnapshot = await db.collection('vidya_search_data').get();
        vidyaSearchSnapshot.forEach(doc => {
            const data = doc.data();
            const titleMatch = data.title && data.title.toLowerCase().includes(query.toLowerCase());
            const descriptionMatch = data.description && data.description.toLowerCase().includes(query.toLowerCase());

            if (titleMatch || descriptionMatch) {
                results.push({
                    type: 'vidya',
                    title: data.title,
                    description: data.description,
                    link: data.link,
                    imageUrl: data.imageUrl
                });
            }
        });
    }

    if (results.length === 0) {
      return { error: 'आपकी खोज के लिए कोई परिणाम नहीं मिला।', query };
    }

    results.sort((a, b) => {
        if (a.type === 'vidya' && b.type !== 'vidya') return -1;
        if (a.type !== 'vidya' && b.type === 'vidya') return 1;
        return 0;
    });

    return { results, query };

  } catch (error) {
    console.error('Search failed:', error);
    return { error: 'खोज के दौरान एक अप्रत्याशित त्रुटि हुई।' };
  }
}
