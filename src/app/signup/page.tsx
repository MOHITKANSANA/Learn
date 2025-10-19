'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile, EmailAuthProvider, linkWithCredential } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long.'),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters long.'),
});

export default function SignupPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    if (!auth.currentUser) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'No user session found. Please refresh.' });
        setIsSubmitting(false);
        return;
    }

    try {
        const credential = EmailAuthProvider.credential(values.email, values.password);
        
        // Link the anonymous account with the new email/password credential
        await linkWithCredential(auth.currentUser, credential);
        
        const upgradedUser = auth.currentUser;

        // Update profile display name
        await updateProfile(upgradedUser, { displayName: values.name });

        // Update or create the user document in Firestore
        const userDocRef = doc(firestore, 'users', upgradedUser.uid);
        const userDoc = await getDoc(userDocRef);

        const userData = {
            id: upgradedUser.uid,
            name: values.name,
            email: values.email,
            profileImageUrl: userDoc.exists() ? userDoc.data().profileImageUrl : `https://picsum.photos/seed/${upgradedUser.uid}/100/100`,
        };

        await setDoc(userDocRef, userData, { merge: true });

        toast({
            title: 'Account Upgraded!',
            description: "You've successfully created your account.",
        });
        router.push('/');
    } catch (error: any) {
        console.error('Signup error:', error);
        if (error.code === 'auth/email-already-in-use') {
            toast({
                variant: 'destructive',
                title: 'Signup Failed',
                description: 'This email is already in use. Please use a different email.',
            });
        } else if (error.code === 'auth/credential-already-in-use') {
             toast({
                variant: 'destructive',
                title: 'Account Linked',
                description: 'This account is already linked. Please try logging in normally.',
             });
        } else {
            toast({
                variant: 'destructive',
                title: 'Signup Failed',
                description: error.message || 'An unexpected error occurred. Please try again.',
            });
        }
    } finally {
        setIsSubmitting(false);
    }
}


  return (
    <div className="flex justify-center items-center h-full">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
          <CardDescription>Join us to start your learning journey!</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
