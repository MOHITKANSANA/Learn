'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { Loader2, User as UserIcon, Palette, Moon, Sun } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAuth } from 'firebase/auth';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  profileImage: z.any().optional(),
});

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({ name: user.displayName || '' });
    }
    const storedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(storedTheme);
  }, [user, form]);
  
  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.className = newTheme;
  }

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        form.setValue('profileImage', event.target.files);
        const previewUrl = await fileToDataUrl(file);
        setNewImagePreview(previewUrl);
    }
  }


  async function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to update your profile.' });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("User not found");

      let imageUrl = user.photoURL;

      // Upload and update image if a new one is selected
      if (values.profileImage && values.profileImage.length > 0) {
        imageUrl = await fileToDataUrl(values.profileImage[0]);
      }
      
      // Update profile in Firebase Auth
      await updateProfile(currentUser, {
        displayName: values.name,
        photoURL: imageUrl,
      });

      // Update user document in Firestore
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        name: values.name,
        profileImageUrl: imageUrl,
      });

      toast({ title: 'Success!', description: 'Your profile has been updated.' });
       // Reset preview after successful submission
      setNewImagePreview(null);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message || 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isUserLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin"/></div>;
  }
  
  if (!user) {
     return <div className="text-center mt-10">Please log in to view your profile.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold font-headline">My Profile</h1>
        <p className="text-muted-foreground mt-2">Manage your account settings and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>Update your personal information here.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                 <Avatar className="h-24 w-24">
                    <AvatarImage src={newImagePreview || user.photoURL || ''} alt={user.displayName || 'User'} />
                    <AvatarFallback><UserIcon className="h-12 w-12" /></AvatarFallback>
                </Avatar>
                 <FormField
                    control={form.control}
                    name="profileImage"
                    render={({ field }) => (
                        <FormItem>
                         <FormControl>
                            <Input type="file" accept="image/*" className="text-xs" onChange={handleImageChange} />
                         </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette/> Theme Settings</CardTitle>
          <CardDescription>Choose your preferred interface appearance.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
            <Button variant={theme === 'light' ? 'default' : 'outline'} onClick={() => handleThemeChange('light')}>
                <Sun className="mr-2"/> Light
            </Button>
             <Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => handleThemeChange('dark')}>
                <Moon className="mr-2"/> Dark
            </Button>
        </CardContent>
      </Card>

    </div>
  );
}
