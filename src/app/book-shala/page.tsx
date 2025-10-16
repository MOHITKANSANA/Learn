import Image from 'next/image';
import Link from 'next/link';
import { books } from '@/lib/data';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function BookShalaPage() {
  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-headline">Book Shala</h1>
        <p className="text-muted-foreground mt-2">Your one-stop shop for educational books.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {books.map((book) => (
          <Card key={book.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="p-0">
              {book.image && (
                 <Image
                  src={book.image.imageUrl}
                  alt={book.title}
                  width={300}
                  height={400}
                  className="object-cover w-full h-48"
                  data-ai-hint={book.image.imageHint}
                />
              )}
            </CardHeader>
            <CardContent className="flex-grow p-4">
              <CardTitle className="text-lg font-headline mb-1">{book.title}</CardTitle>
              <p className="text-sm text-muted-foreground">by {book.author}</p>
            </CardContent>
            <CardFooter className="p-4 flex justify-between items-center">
              <p className="text-lg font-bold text-primary-foreground">${book.price}</p>
              <Button asChild>
                <Link href="/book-shala/checkout">Buy Now</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
