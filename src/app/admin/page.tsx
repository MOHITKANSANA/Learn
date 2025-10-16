
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Book,
  Users,
  Ticket,
  PlusCircle,
  Edit,
  Video,
  UserPlus,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';


const adminNavItems = [
  { value: 'manage-content', icon: Book, label: 'Manage Content' },
  { value: 'enrollments', icon: Users, label: 'Enrollments' },
  { value: 'coupons', icon: Ticket, label: 'Coupons' },
];

function CreateCourseForm() {
    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="courseTitle">Course Title</Label>
                <Input id="courseTitle" placeholder="e.g., Advanced Web Development" />
            </div>
            <div>
                <Label htmlFor="courseDescription">Course Description</Label>
                <Textarea id="courseDescription" placeholder="Describe the course content..." />
            </div>
            <div>
                <Label htmlFor="coursePrice">Price</Label>
                <Input id="coursePrice" type="number" placeholder="e.g., 999" />
            </div>
             <div>
                <Label htmlFor="courseImage">Course Image</Label>
                <Input id="courseImage" type="file" />
            </div>
            <Button>Create Course</Button>
        </div>
    )
}

const educatorSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  educatorImage: z.any().refine(files => files?.length == 1, "Image is required."),
});

function AddEducatorForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof educatorSchema>>({
    resolver: zodResolver(educatorSchema),
    defaultValues: {
      name: '',
    },
  });

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

  async function onSubmit(values: z.infer<typeof educatorSchema>) {
    setIsSubmitting(true);
    try {
      const file = values.educatorImage[0];
      const imageUrl = await fileToDataUrl(file);

      const docRef = await addDoc(collection(firestore, 'educators'), {
        name: values.name,
        imageUrl: imageUrl,
        createdAt: serverTimestamp(),
      });

      await setDoc(doc(firestore, 'educators', docRef.id), { id: docRef.id }, { merge: true });

      toast({
        title: 'Success!',
        description: 'Educator added successfully.',
      });
      form.reset();
      // Manually clear the file input
      const fileInput = document.getElementById('educatorImage') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error: any) {
      console.error("Error adding educator:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add educator. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Educator Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Dr. Arun Sharma" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="educatorImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Educator Image</FormLabel>
              <FormControl>
                 <Input id="educatorImage" type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Educator
        </Button>
      </form>
    </Form>
  );
}


const liveClassSchema = z.object({
    title: z.string().min(5, { message: "Title must be at least 5 characters." }),
    description: z.string().optional(),
    educatorId: z.string().min(1, { message: "Please select an educator." }),
    startTime: z.string().min(1, { message: "Please select a date and time." }),
    youtubeUrl: z.string().url({ message: "Please enter a valid YouTube URL." }),
});


function AddLiveClassForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const educatorsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'educators') : null, [firestore]);
  const { data: educators, isLoading: isLoadingEducators } = useCollection(educatorsQuery);


  const form = useForm<z.infer<typeof liveClassSchema>>({
    resolver: zodResolver(liveClassSchema),
    defaultValues: {
      title: '',
      description: '',
      youtubeUrl: '',
    },
  });

  async function onSubmit(values: z.infer<typeof liveClassSchema>) {
    setIsSubmitting(true);
    try {
        const docRef = await addDoc(collection(firestore, 'live_classes'), {
            ...values,
            startTime: new Date(values.startTime),
            createdAt: serverTimestamp(),
        });

        await setDoc(doc(firestore, 'live_classes', docRef.id), { id: docRef.id }, { merge: true });

        toast({
            title: "Success!",
            description: "Live class scheduled successfully."
        });
        form.reset();

    } catch (error: any) {
        console.error("Error scheduling live class:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Failed to schedule live class. Please try again."
        });
    } finally {
        setIsSubmitting(false);
    }
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Live Class Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Live Q&A Session" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="What will be covered in this class?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="educatorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Educator</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingEducators ? "Loading educators..." : "Select an educator"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {!isLoadingEducators && educators?.map(educator => (
                    <SelectItem key={educator.id} value={educator.id}>{educator.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="startTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date & Time</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="youtubeUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>YouTube Video URL</FormLabel>
              <FormControl>
                <Input placeholder="https://www.youtube.com/watch?v=..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Schedule Live Class
        </Button>
      </form>
    </Form>
  )
}


export default function AdminDashboardPage() {
  return (
    <div className="bg-background text-foreground min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-primary">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage your application content and users.
          </p>
        </header>

        <Tabs defaultValue={adminNavItems[0].value} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
             {adminNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <TabsTrigger key={item.value} value={item.value}>
                  <Icon className="h-5 w-5 mr-2" />
                  <span>{item.label}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          <TabsContent value="manage-content">
             <Tabs defaultValue="add-course" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="add-course"><PlusCircle className="mr-2 h-4 w-4" /> Add Course</TabsTrigger>
                    <TabsTrigger value="edit-course"><Edit className="mr-2 h-4 w-4" /> Edit Course</TabsTrigger>
                    <TabsTrigger value="add-educator"><UserPlus className="mr-2 h-4 w-4" /> Add Educator</TabsTrigger>
                    <TabsTrigger value="add-live-class"><Video className="mr-2 h-4 w-4" /> Add Live Class</TabsTrigger>
                </TabsList>
                <TabsContent value="add-course">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create a New Course</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CreateCourseForm />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="edit-course">
                     <Card>
                        <CardHeader>
                            <CardTitle>Edit Existing Course Content</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <p>Here you can add PDFs, live classes, notes, and test series to your existing courses.</p>
                           {/* TODO: Add functionality to list and edit existing courses */}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="add-educator">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add a New Educator</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AddEducatorForm />
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="add-live-class">
                    <Card>
                        <CardHeader>
                            <CardTitle>Schedule a New Live Class</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AddLiveClassForm />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="enrollments">
            <Card>
              <CardHeader>
                <CardTitle>Enrollments</CardTitle>
              </CardHeader>
              <CardContent>
                Manage your enrollments here.
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coupons">
            <Card>
              <CardHeader>
                <CardTitle>Coupons</CardTitle>
              </CardHeader>
              <CardContent>
                Manage your coupons here.
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

    