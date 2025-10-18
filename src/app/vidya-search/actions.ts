

'use server';

import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { getFirestore as getFirestoreAdmin } from 'firebase-admin/firestore';
import { initializeApp as initializeAdminApp, getApps as getAdminApps, type App as AdminApp } from 'firebase-admin/app';
import { credential } from 'firebase-admin';


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
    score?: number;
}

export type State = {
  results?: SearchResultItem[];
  error?: string;
  query?: string;
};


// Initialize Firebase Admin SDK
function getAdmin() {
    if (getAdminApps().length > 0) {
        return getAdminApps()[0];
    }

    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set in the environment variables.');
    }

    return initializeAdminApp({
        credential: credential.cert(JSON.parse(serviceAccountKey)),
    });
}


const searchFlow = ai.defineFlow(
    {
        name: 'vidyaSearchInternal',
        inputSchema: z.string(),
        outputSchema: z.array(z.any()),
        auth: (auth, input) => {
            // All users can run this flow.
        }
    },
    async (searchQuery) => {
        const adminApp = getAdmin();
        if (!adminApp) {
            throw new Error("Admin SDK not initialized");
        }
        const firestore = getFirestoreAdmin(adminApp);
        let results: SearchResultItem[] = [];

        try {
            const isFiveDigitId = /^\d{5}$/.test(searchQuery);
            if (isFiveDigitId) {
                 const appRef = firestore.collection('scholarshipApplications').doc(searchQuery);
                 const [appDoc] = await Promise.all([appRef.get()]);

                 if (appDoc.exists) {
                    const appData = appDoc.data();
                     if (appData) {
                        results.push({
                            type: 'order', // Using 'order' type for display purposes
                            title: `Scholarship Application: ${appData.fullName}`,
                            description: `ID: ${appData.id}\nStatus: ${appData.status}\nMode: ${appData.examMode}`,
                            data: appData,
                            score: 100
                        });
                    }
                } else {
                     const enrollmentRef = firestore.collection('enrollments').where('id', '>=', searchQuery).where('id', '<', searchQuery + 'z').limit(1);
                     const orderRef = firestore.collection('bookOrders').where('id', '>=', searchQuery).where('id', '<', searchQuery + 'z').limit(1);

                     const [enrollmentSnapshot, orderSnapshot] = await Promise.all([enrollmentRef.get(), orderRef.get()]);

                     if (!enrollmentSnapshot.empty) {
                        const enrollment = enrollmentSnapshot.docs[0].data();
                        results.push({
                            type: 'enrollment',
                            title: `Enrollment Details: ${enrollment.itemName}`,
                            description: `ID: ${enrollment.id.substring(0,5)}\nStatus: ${enrollment.isApproved ? 'Approved' : 'Pending'}\nRequested On: ${enrollment.enrollmentDate.toDate().toLocaleDateString()}`,
                            data: enrollment,
                            score: 100
                        });
                     }
                      if (!orderSnapshot.empty) {
                        const bookOrder = orderSnapshot.docs[0].data();
                        results.push({
                            type: 'order',
                            title: `Book Order Details: ${bookOrder.bookTitle}`,
                            description: `ID: ${bookOrder.id.substring(0,5)}\nStatus: ${bookOrder.status}\nOrdered On: ${bookOrder.orderDate.toDate().toLocaleDateString()}`,
                            data: bookOrder,
                            score: 100
                        });
                     }
                }
            }
            
            const searchTerms = searchQuery.toLowerCase().split(' ').filter(term => term.length > 2);
            if(searchTerms.length > 0) {
                const vidyaSearchSnapshot = await firestore.collection('vidya_search_data').get();
                
                vidyaSearchSnapshot.forEach(doc => {
                    const data = doc.data();
                    const title = data.title?.toLowerCase() || '';
                    const description = data.description?.toLowerCase() || '';
                    
                    let score = 0;
                     searchTerms.forEach(term => {
                        if (title.includes(term)) score += 2; // Higher weight for title match
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
            }


            return results;
        } catch (error) {
            console.error('Internal Search Flow Error:', error);
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

    results.sort((a, b) => (b.score || 0) - (a.score || 0));
    
    const uniqueResults = results.filter((item, index, self) => 
        index === self.findIndex(t => (
            (t.data?.id && t.data?.id === item.data?.id) || t.title === item.title
        ))
    );

    return { results: uniqueResults, query: searchQuery };

  } catch (error) {
    console.error('Search failed:', error);
    return { error: 'डेटाबेस से कनेक्ट नहीं हो सका। कृपया बाद में प्रयास करें।', query: searchQuery };
  }
}
