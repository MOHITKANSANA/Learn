
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Book,
  Users,
  PlusCircle,
  Edit,
  Video,
  UserPlus,
  Loader2,
  Megaphone,
  DollarSign,
  User,
  BookCopy,
  GalleryHorizontal,
  PenSquare,
  BadgeIndianRupee,
  Youtube,
  Ticket,
  Languages,
  Settings
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
import { useFirestore, useCollection, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';
import Link from 'next/link';


const adminNavItems = [
  { value: 'add-course', icon: PlusCircle, label: 'Add Course' },
  { value: 'edit-course', icon: Edit, label: 'Edit Course' },
  { value: 'add-educator', icon: UserPlus, label: 'Add Educator' },
  { value: 'add-live-class', icon: Video, label: 'Add Live Class' },
  { value: 'enrollments', icon: Users, label: 'Enrollments' },
  { value: 'promotions', icon: Megaphone, label: 'Promotions' },
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
  experience: z.coerce.number().min(0, { message: 'Experience cannot be negative.' }),
  subject: z.string().min(2, { message: 'Subject must be at least 2 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
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
      experience: 0,
      subject: '',
      description: '',
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
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Firestore is not initialized.',
      });
      setIsSubmitting(false);
      return;
    }
    
    const file = values.educatorImage[0];
    const imageUrl = await fileToDataUrl(file);

    const newDocRef = doc(collection(firestore, 'educators'));
    const educatorData = {
      id: newDocRef.id,
      name: values.name,
      imageUrl: imageUrl,
      experience: values.experience,
      subject: values.subject,
      description: values.description,
      createdAt: serverTimestamp(),
    };

    setDoc(newDocRef, educatorData)
      .then(() => {
        toast({
          title: 'Success!',
          description: 'Educator added successfully.',
        });
        form.reset();
        const fileInput = document.getElementById('educatorImage') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: newDocRef.path,
          operation: 'create',
          requestResourceData: educatorData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
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
          name="experience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Years of Experience</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 5" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Physics" {...field} />
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
                <Textarea placeholder="Describe the educator's expertise..." {...field} />
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
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Firestore is not initialized.',
      });
      setIsSubmitting(false);
      return;
    }
    
    const newDocRef = doc(collection(firestore, 'live_classes'));
    const liveClassData = {
        id: newDocRef.id,
        ...values,
        startTime: new Date(values.startTime),
        createdAt: serverTimestamp(),
    };

    setDoc(newDocRef, liveClassData)
        .then(() => {
            toast({
                title: "Success!",
                description: "Live class scheduled successfully."
            });
            form.reset();
        })
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
              path: newDocRef.path,
              operation: 'create',
              requestResourceData: liveClassData,
            });
            errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
            setIsSubmitting(false);
        });
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

const promotionSchema = z.object({
  text: z.string().min(5, { message: 'Promotion text must be at least 5 characters.' }),
  link: z.string().url({ message: 'Please enter a valid URL.' }),
});

function AddPromotionForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof promotionSchema>>({
    resolver: zodResolver(promotionSchema),
    defaultValues: {
      text: '',
      link: '',
    },
  });

  async function onSubmit(values: z.infer<typeof promotionSchema>) {
    setIsSubmitting(true);
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Firestore is not initialized.',
      });
      setIsSubmitting(false);
      return;
    }
    
    const newDocRef = doc(collection(firestore, 'promotions'));
    const promotionData = {
      id: newDocRef.id,
      ...values,
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)), // Default 7 days
      createdAt: serverTimestamp(),
    };

    setDoc(newDocRef, promotionData)
      .then(() => {
        toast({
          title: 'Success!',
          description: 'Promotion added successfully.',
        });
        form.reset();
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: newDocRef.path,
          operation: 'create',
          requestResourceData: promotionData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Promotion Text</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Summer Sale! 50% Off" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/sale" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Promotion
        </Button>
      </form>
    </Form>
  );
}


const dashboardLinks = [
    { href: '#', icon: DollarSign, label: 'Revenue' },
    { href: '#', icon: PlusCircle, label: 'Add Content' },
    { href: '#', icon: Edit, label: 'Manage Content' },
    { href: '#', icon: Users, label: 'Manage Users' },
    { href: '/book-shala', icon: BookCopy, label: 'Book Shala' },
    { href: '/motivation', icon: Megaphone, label: 'Motivation' },
    { href: '#', icon: GalleryHorizontal, label: 'Gallery' },
    { href: '#', icon: User, label: 'Course Enrollments' },
    { href: '#', icon: PenSquare, label: 'Test Enrollments' },
    { href: '#', icon: Book, label: 'E-Book Enrollments' },
    { href: '#', icon: PenSquare, label: 'Paper Enrollments' },
    { href: '#', icon: BadgeIndianRupee, label: 'Scholarships' },
    { href: '#', icon: Youtube, label: 'Kids Tube' },
    { href: '#', icon: Ticket, label: 'Coupons' },
    { href: '#', icon: Megaphone, label: 'Promotions' },
    { href: '#', icon: PlusCircle, label: 'PWA Installations' },
    { href: '#', icon: Languages, label: 'HTML Editor' },
    { href: '#', icon: Settings, label: 'App Settings' },
]


export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('add-educator');
  
  const renderContent = () => {
    switch (activeTab) {
      case 'add-course':
        return <Card>
                  <CardHeader><CardTitle>Create a New Course</CardTitle></CardHeader>
                  <CardContent><CreateCourseForm /></CardContent>
               </Card>;
      case 'edit-course':
        return <Card>
                  <CardHeader><CardTitle>Edit Existing Course</CardTitle></CardHeader>
                  <CardContent><p>Edit course details here.</p></CardContent>
               </Card>;
      case 'add-educator':
        return <Card>
                  <CardHeader><CardTitle>Add a New Educator</CardTitle></CardHeader>
                  <CardContent><AddEducatorForm /></CardContent>
               </Card>;
      case 'add-live-class':
        return <Card>
                  <CardHeader><CardTitle>Schedule a New Live Class</CardTitle></CardHeader>
                  <CardContent><AddLiveClassForm /></CardContent>
               </Card>;
      case 'enrollments':
        return <Card>
                  <CardHeader><CardTitle>Manage Enrollments</CardTitle></CardHeader>
                  <CardContent><p>View and manage enrollments.</p></CardContent>
               </Card>;
      case 'promotions':
        return <Card>
                  <CardHeader><CardTitle>Add New Promotion</CardTitle></CardHeader>
                  <CardContent><AddPromotionForm /></CardContent>
               </Card>;
      default:
        return null;
    }
  }

  return (
    <div className="bg-background text-foreground min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage your application content and users.
          </p>
        </header>

        <Card className="mb-8">
          <CardContent className="p-4">
             <div className="grid grid-cols-2 gap-4">
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                     <Button 
                       key={item.value}
                       variant={activeTab === item.value ? "default" : "outline"}
                       onClick={() => setActiveTab(item.value)}
                       className="justify-start text-left h-auto py-2"
                     >
                        <Icon className="h-5 w-5 mr-2"/>
                        <span>{item.label}</span>
                     </Button>
                  )
                })}
            </div>
          </CardContent>
        </Card>

        <div>
          {renderContent()}
        </div>
        
         <Card className="mt-8">
            <CardHeader>
                <CardTitle>Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-4xl font-bold">₹ 0.00</p>
            </CardContent>
        </Card>

      </div>
    </div>
  );
}
