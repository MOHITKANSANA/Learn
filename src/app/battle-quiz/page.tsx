'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Swords, Loader2, Copy, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const joinRoomSchema = z.object({
  roomCode: z.string().min(6, 'Room code must be 6 characters long.'),
});

function CreateRoom() {
  const { toast } = useToast();
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateRoom = () => {
    setIsLoading(true);
    // In a real app, this would call a backend service to create a unique room.
    // For this demo, we'll generate a random 6-character code.
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setTimeout(() => {
      setRoomCode(newCode);
      setIsLoading(false);
    }, 1000);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomCode);
    toast({ title: 'Copied!', description: 'Room code copied to clipboard.' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a New Battle</CardTitle>
        <CardDescription>Start a new quiz battle and invite a friend.</CardDescription>
      </CardHeader>
      <CardContent>
        {roomCode ? (
          <div className="space-y-4 text-center">
            <p>Your Room Code Is:</p>
            <div className="flex items-center justify-center gap-2 p-3 bg-muted rounded-lg">
              <p className="text-2xl font-bold tracking-widest">{roomCode}</p>
              <Button variant="ghost" size="icon" onClick={copyToClipboard}>
                <Copy className="h-5 w-5" />
              </Button>
            </div>
             <p className="text-sm text-muted-foreground">Share this code with a friend to start the battle!</p>
             <Button asChild>
                <Link href={`/battle-quiz/${roomCode}`}>
                    Go to Battle Room
                </Link>
             </Button>
          </div>
        ) : (
          <Button onClick={handleCreateRoom} disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Swords className="mr-2 h-4 w-4" />}
            Generate Room Code
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function JoinRoom() {
    const { toast } = useToast();
    const form = useForm({
        resolver: zodResolver(joinRoomSchema)
    });

    const onSubmit = (data: z.infer<typeof joinRoomSchema>) => {
        // Here you would navigate to the room. For now, just a toast.
        toast({ title: "Joining Room...", description: `Attempting to join room ${data.roomCode}`});
    }

    return (
         <Card>
            <CardHeader>
                <CardTitle>Join a Battle</CardTitle>
                <CardDescription>Enter a room code to join a friend's battle.</CardDescription>
            </CardHeader>
            <CardContent>
                 <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
                    <Input {...form.register('roomCode')} placeholder="Enter Room Code" className="text-lg" />
                    <Button type="submit">Join</Button>
                 </form>
            </CardContent>
        </Card>
    )
}

export default function BattleQuizPage() {
  return (
    <div className="max-w-md mx-auto space-y-8">
      <div className="text-center">
        <Swords className="h-16 w-16 mx-auto text-primary mb-4" />
        <h1 className="text-4xl font-bold font-headline">Battle Quiz</h1>
        <p className="text-muted-foreground mt-4 text-lg">
          Challenge your friends to a real-time quiz battle!
        </p>
      </div>

      <CreateRoom />
      <JoinRoom />

    </div>
  );
}
