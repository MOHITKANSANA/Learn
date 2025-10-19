'use client';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { socialLinkIcons } from '@/lib/data';

export default function SocialLinksPage() {
  const firestore = useFirestore();
  const { data: socialLinks, isLoading } = useCollection(useMemoFirebase(
    () => firestore ? collection(firestore, 'socialLinks') : null,
    [firestore]
  ));

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-headline">Social Links</h1>
        <p className="text-muted-foreground mt-2">Stay connected with us on social media.</p>
      </div>

      <div className="space-y-4">
        {socialLinks && socialLinks.length > 0 ? (
          socialLinks.map(link => {
            const Icon = socialLinkIcons[link.icon as keyof typeof socialLinkIcons] || socialLinkIcons.default;
            return (
              <a href={link.url} target="_blank" rel="noopener noreferrer" key={link.id}>
                <Card className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 bg-muted rounded-full">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <p className="font-semibold text-lg">{link.name}</p>
                  </CardContent>
                </Card>
              </a>
            );
          })
        ) : (
          <p className="text-center text-muted-foreground py-10">No social links have been added yet.</p>
        )}
      </div>
    </div>
  );
}
