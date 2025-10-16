'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ShoppingCart } from 'lucide-react';

export default function BookShalaPage() {
  const firestore = useFirestore();
  const booksQuery = useMemoFirebase(() => firestore ? collection(firestore, 'books') : null, [firestore]);
  const { data: books, isLoading } = useCollection(booksQuery);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-headline">Book Shala</h1>
        <p className="text-muted-foreground mt-2">Your one-stop shop for educational books.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {books && books.length > 0 ? (
          books.map((book) => (
            <Card key={book.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="p-0">
                {book.imageUrl && (
                   <Image
                    src={book.imageUrl}
                    alt={book.title}
                    width={300}
                    height={400}
                    className="object-cover w-full h-60"
                  />
                )}
              </CardHeader>
              <CardContent className="flex-grow p-4">
                <CardTitle className="text-lg font-headline mb-1">{book.title}</CardTitle>
                <p className="text-sm text-muted-foreground">by {book.author}</p>
              </CardContent>
              <CardFooter className="p-4 flex flex-col items-stretch gap-2">
                 <p className="text-lg font-bold text-primary self-center">₹{book.price}</p>
                 <Button asChild>
                    <Link href={`/book-shala/checkout/${book.id}`}>Buy Now</Link>
                </Button>
                <Button variant="secondary" disabled>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <p className="col-span-full text-center text-muted-foreground">No books available at the moment.</p>
        )}
      </div>
    </div>
  );
}
