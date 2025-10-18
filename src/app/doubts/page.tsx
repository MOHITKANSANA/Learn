

'use client';
import { useState, useMemo } from 'react';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp, updateDoc, query, getDocs, deleteDoc, addDoc, orderBy } from 'firebase/firestore';
import { Loader2, MessageSquarePlus, User, CornerDownRight, CheckCircle, ThumbsUp, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function AskDoubtDialog({ forceRefresh }: { forceRefresh: () => void }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [doubtText, setDoubtText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async () => {
    if (!user || !firestore || !doubtText.trim()) return;
    setIsSubmitting(true);
    try {
      const doubtRef = doc(collection(firestore, 'doubts'));
      await setDoc(doubtRef, {
        id: doubtRef.id,
        authorId: user.uid,
        authorName: user.displayName,
        authorImage: user.photoURL,
        text: doubtText,
        createdAt: serverTimestamp(),
        likes: [],
        commentCount: 0,
      });
      toast({ title: 'Doubt Posted!', description: 'Your doubt has been posted on the forum.' });
      setDoubtText('');
      setIsOpen(false);
      forceRefresh();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to post your doubt.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <MessageSquarePlus className="mr-2 h-4 w-4" /> Ask a New Doubt
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>What's your doubt?</DialogTitle>
          <DialogDescription>
            Post your question and the community will help you.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="e.g., How does photosynthesis work in aquatic plants?"
          value={doubtText}
          onChange={(e) => setDoubtText(e.target.value)}
          className="min-h-[100px]"
        />
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting || !doubtText.trim()}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post Doubt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function DoubtsPage() {
  const firestore = useFirestore();

  const doubtsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'doubts'), orderBy('createdAt', 'desc')) : null,
    [firestore]
  );
  const { data: doubts, isLoading, forceRefresh } = useCollection(doubtsQuery);
  
  return (
    <div className="max-w-4xl mx-auto">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold font-headline">Doubt Forum</h1>
        <p className="text-muted-foreground mt-2">
          Ask a question and get it solved by the community.
        </p>
      </header>

      <div className="flex justify-center mb-8">
        <AskDoubtDialog forceRefresh={forceRefresh} />
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : doubts && doubts.length > 0 ? (
          doubts.map((doubt: any) => (
             <Link href={`/doubts/${doubt.id}`} key={doubt.id} className="block">
                <Card className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                         <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={doubt.authorImage} />
                                <AvatarFallback>{doubt.authorName?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{doubt.authorName}</p>
                                <p className="text-sm text-muted-foreground">
                                    {doubt.createdAt ? formatDistanceToNow(doubt.createdAt.toDate(), { addSuffix: true }) : ''}
                                </p>
                            </div>
                        </div>
                        <p className="mt-3 text-lg font-semibold">{doubt.text}</p>
                    </CardContent>
                    <CardFooter className="text-sm text-muted-foreground flex gap-4 pt-0 p-4">
                        <div className="flex items-center gap-1">
                            <ThumbsUp className="h-4 w-4" />
                            <span>{doubt.likes?.length || 0} Likes</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            <span>{doubt.commentCount || 0} Replies</span>
                        </div>
                    </CardFooter>
                </Card>
             </Link>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-10">No doubts have been asked yet. Be the first!</p>
        )}
      </div>
    </div>
  );
}
