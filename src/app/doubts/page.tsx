
'use client';
import { useState, useMemo } from 'react';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp, updateDoc, query, where, getDocs, deleteDoc, addDoc } from 'firebase/firestore';
import { Loader2, MessageSquarePlus, User, CornerDownRight, CheckCircle } from 'lucide-react';
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

function AskDoubtDialog() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [doubtText, setDoubtText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!user || !firestore || !doubtText.trim()) return;
    setIsSubmitting(true);
    try {
      const doubtRef = doc(collection(firestore, 'live_doubts'));
      await setDoc(doubtRef, {
        id: doubtRef.id,
        studentId: user.uid,
        studentName: user.displayName,
        studentImage: user.photoURL,
        text: doubtText,
        status: 'open',
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Doubt Posted!', description: 'Your doubt is now live for solvers.' });
      setDoubtText('');
      router.push(`/doubts/room/${doubtRef.id}`);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to post your doubt.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <MessageSquarePlus className="mr-2 h-4 w-4" /> Ask a New Doubt
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>What's your doubt?</DialogTitle>
          <DialogDescription>
            Post your question and a peer will help you solve it in real-time.
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
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const openDoubtsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'live_doubts'), where('status', '==', 'open')) : null,
    [firestore]
  );
  const { data: openDoubts, isLoading } = useCollection(openDoubtsQuery);
  
  const handleBecomeSolver = async (doubtId: string) => {
    if (!user || !firestore) return;
    
    const doubtRef = doc(firestore, 'live_doubts', doubtId);
    
    try {
        await updateDoc(doubtRef, {
            status: 'solving',
            solverId: user.uid,
            solverName: user.displayName,
            solverImage: user.photoURL
        });
        router.push(`/doubts/room/${doubtId}`);
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not accept this doubt. It might have been taken.'});
    }
  }


  return (
    <div className="max-w-4xl mx-auto">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold font-headline">Live Doubt Solving</h1>
        <p className="text-muted-foreground mt-2">
          Ask a question and get it solved by a peer, or help others solve their doubts!
        </p>
      </header>

      <div className="flex justify-center mb-8">
        <AskDoubtDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open for Solving</CardTitle>
          <CardDescription>Help a peer by solving one of these doubts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : openDoubts && openDoubts.length > 0 ? (
            openDoubts.map((doubt: any) => (
              <div key={doubt.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={doubt.studentImage} />
                    <AvatarFallback>{doubt.studentName?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{doubt.studentName}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{doubt.text}</p>
                  </div>
                </div>
                <Button onClick={() => handleBecomeSolver(doubt.id)}>Become a Solver</Button>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-10">No open doubts right now. Be the first to ask one!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
