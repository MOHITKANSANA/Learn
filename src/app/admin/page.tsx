

'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Book,
  Users,
  PlusCircle,
  Video,
  UserPlus,
  Loader2,
  Megaphone,
  BookCopy,
  PenSquare,
  BadgeIndianRupee,
  Youtube,
  Ticket,
  Languages,
  Settings,
  BookOpen,
  ShoppingBag,
  ClipboardList,
  Newspaper,
  FilePlus,
  Trash2,
  List,
  MessageSquare,
  HelpCircle,
  BrainCircuit,
  Swords,
  Heart,
  Home,
  Gift,
  PlaySquare,
  Library,
  Bot,
  Rss,
  Trophy,
  MapPin,
  Check,
  X,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, errorEmitter, useUser, useDoc } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc, updateDoc, where, query, getDocs, arrayUnion, deleteDoc, orderBy } from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';
import Link from 'next/link';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';


const adminNavItems = [
  { value: 'add-course', icon: PlusCircle, label: 'Add Course' },
  { value: 'add-content', icon: FilePlus, label: 'Add Content to Course' },
  { value: 'add-ebook', icon: BookOpen, label: 'Add E-book' },
  { value: 'add-test-series', icon: PenSquare, label: 'Add Test Series' },
  { value: 'add-previous-paper', icon: Newspaper, label: 'Add Previous Paper'},
  { value: 'add-educator', icon: UserPlus, label: 'Add Educator' },
  { value: 'add-live-class', icon: Video, label: 'Add Live Class' },
  { value: 'enrollments', icon: Users, label: 'Enrollments' },
  { value: 'promotions', icon: Megaphone, label: 'Promotions' },
  { value: 'add-book', icon: BookCopy, label: 'Add Book' },
  { value: 'book-orders', icon: ShoppingBag, label: 'Book Orders' },
  { value: 'add-coupon', icon: Ticket, label: 'Add Coupon' },
  { value: 'scholarship-management', icon: Trophy, label: 'Scholarship' },
  { value: 'center-management', icon: MapPin, label: 'Center Management' },
  { value: 'manage-content', icon: List, label: 'Manage Content' },
  { value: 'app-settings', icon: Settings, label: 'App Settings' },
  { value: 'vidya-search-admin', icon: Bot, label: 'Vidya Search Admin' },
];

const courseSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  price: z.coerce.number().min(0, 'Price cannot be negative.'),
  courseImage: z.any().refine(files => files?.length == 1, 'Image is required.'),
  isFree: z.boolean().default(false),
});

function CreateCourseForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: { title: '', description: '', price: 0, isFree: false },
  });

  const fileToDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(new Error('Failed to read file: ' + (error.target?.error?.message || 'Unknown error')));
    reader.readAsDataURL(file);
  });

  async function onSubmit(values: z.infer<typeof courseSchema>) {
    setIsSubmitting(true);
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Firestore is not initialized.' });
      setIsSubmitting(false);
      return;
    }

    const imageUrl = await fileToDataUrl(values.courseImage[0]);
    const newDocRef = doc(collection(firestore, 'courses'));
    const courseData = {
      id: newDocRef.id,
      title: values.title,
      description: values.description,
      price: values.isFree ? 0 : values.price,
      imageUrl,
      isFree: values.isFree,
      videos: [],
      notes: [],
      tests: [],
      createdAt: serverTimestamp(),
    };

    setDoc(newDocRef, courseData)
      .then(() => {
        toast({ title: 'Success!', description: 'Course added successfully.' });
        form.reset();
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: newDocRef.path,
          operation: 'create',
          requestResourceData: courseData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setIsSubmitting(false));
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem>
            <FormLabel>Course Title</FormLabel>
            <FormControl><Input placeholder="e.g., Advanced Web Development" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Course Description</FormLabel>
            <FormControl><Textarea placeholder="Describe the course content..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="price" render={({ field }) => (
          <FormItem>
            <FormLabel>Price</FormLabel>
            <FormControl><Input type="number" placeholder="e.g., 999" {...field} disabled={form.watch('isFree')} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="isFree" render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Free Course</FormLabel>
            </div>
          </FormItem>
        )} />
        <FormField control={form.control} name="courseImage" render={({ field }) => (
          <FormItem>
            <FormLabel>Course Image</FormLabel>
            <FormControl><Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Course
        </Button>
      </form>
    </Form>
  );
}

const ebookSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  price: z.coerce.number().min(0, 'Price cannot be negative.'),
  ebookImage: z.any().refine(files => files?.length == 1, 'Image is required.'),
  fileUrl: z.string().url('A valid file URL is required.'),
  isFree: z.boolean().default(false),
});

function CreateEbookForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const firestore = useFirestore();

    const form = useForm<z.infer<typeof ebookSchema>>({
        resolver: zodResolver(ebookSchema),
        defaultValues: { title: '', description: '', price: 0, fileUrl: '', isFree: false },
    });

    const fileToDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(new Error('Failed to read file: ' + (error.target?.error?.message || 'Unknown error')));
        reader.readAsDataURL(file);
    });

    async function onSubmit(values: z.infer<typeof ebookSchema>) {
        setIsSubmitting(true);
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Firestore is not initialized.' });
            setIsSubmitting(false);
            return;
        }

        const imageUrl = await fileToDataUrl(values.ebookImage[0]);
        const newDocRef = doc(collection(firestore, 'ebooks'));
        const ebookData = {
            id: newDocRef.id,
            title: values.title,
            description: values.description,
            price: values.isFree ? 0 : values.price,
            imageUrl,
            fileUrl: values.fileUrl,
            isFree: values.isFree,
            createdAt: serverTimestamp(),
        };

        setDoc(newDocRef, ebookData)
            .then(() => {
                toast({ title: 'Success!', description: 'E-book added successfully.' });
                form.reset();
            })
            .catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: newDocRef.path,
                    operation: 'create',
                    requestResourceData: ebookData,
                });
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => setIsSubmitting(false));
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                        <FormLabel>E-book Title</FormLabel>
                        <FormControl><Input placeholder="e.g., The Art of Programming" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                        <FormLabel>E-book Description</FormLabel>
                        <FormControl><Textarea placeholder="Describe the e-book..." {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl><Input type="number" placeholder="e.g., 299" {...field} disabled={form.watch('isFree')} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="fileUrl" render={({ field }) => (
                    <FormItem>
                        <FormLabel>E-book File URL</FormLabel>
                        <FormControl><Input type="url" placeholder="https://example.com/ebook.pdf" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="isFree" render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>Free E-book</FormLabel>
                        </div>
                    </FormItem>
                )} />
                <FormField control={form.control} name="ebookImage" render={({ field }) => (
                    <FormItem>
                        <FormLabel>E-book Image</FormLabel>
                        <FormControl><Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add E-book
                </Button>
            </form>
        </Form>
    );
}

const previousPaperSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  price: z.coerce.number().min(0, 'Price cannot be negative.'),
  paperImage: z.any().refine(files => files?.length == 1, 'Image is required.'),
  fileUrl: z.string().url('A valid file URL is required.'),
  isFree: z.boolean().default(false),
});

function CreatePreviousPaperForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const firestore = useFirestore();

    const form = useForm<z.infer<typeof previousPaperSchema>>({
        resolver: zodResolver(previousPaperSchema),
        defaultValues: { title: '', description: '', price: 0, fileUrl: '', isFree: false },
    });

    const fileToDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(new Error('Failed to read file: ' + (error.target?.error?.message || 'Unknown error')));
        reader.readAsDataURL(file);
    });

    async function onSubmit(values: z.infer<typeof previousPaperSchema>) {
        setIsSubmitting(true);
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Firestore is not initialized.' });
            setIsSubmitting(false);
            return;
        }

        const imageUrl = await fileToDataUrl(values.paperImage[0]);
        const newDocRef = doc(collection(firestore, 'previousYearPapers'));
        const paperData = {
            id: newDocRef.id,
            title: values.title,
            description: values.description,
            price: values.isFree ? 0 : values.price,
            imageUrl,
            fileUrl: values.fileUrl,
            isFree: values.isFree,
            createdAt: serverTimestamp(),
        };

        setDoc(newDocRef, paperData)
            .then(() => {
                toast({ title: 'Success!', description: 'Previous Year Paper added successfully.' });
                form.reset();
            })
            .catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: newDocRef.path,
                    operation: 'create',
                    requestResourceData: paperData,
                });
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => setIsSubmitting(false));
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Paper Title</FormLabel>
                        <FormControl><Input placeholder="e.g., UPSC Prelims 2022" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Paper Description</FormLabel>
                        <FormControl><Textarea placeholder="Describe the paper..." {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl><Input type="number" placeholder="e.g., 99" {...field} disabled={form.watch('isFree')} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="fileUrl" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Paper File URL</FormLabel>
                        <FormControl><Input type="url" placeholder="https://example.com/paper.pdf" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="isFree" render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>Free Paper</FormLabel>
                        </div>
                    </FormItem>
                )} />
                <FormField control={form.control} name="paperImage" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Paper Image</FormLabel>
                        <FormControl><Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Paper
                </Button>
            </form>
        </Form>
    );
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
      reader.onerror = (error) => reject(new Error('Failed to read file: ' + (error.target?.error?.message || 'Unknown error')));
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

function ManageEnrollments() {
  const firestore = useFirestore();
  const enrollmentsQuery = useMemoFirebase(() =>
    firestore ? query(collection(firestore, 'enrollments'), where('isApproved', '==', false)) : null
  , [firestore]);
  const { data: enrollments, isLoading, forceRefresh } = useCollection(enrollmentsQuery);
  const { toast } = useToast();

  const handleApproval = async (enrollmentId: string, approve: boolean) => {
    if (!firestore) return;
    const enrollmentRef = doc(firestore, 'enrollments', enrollmentId);
    
    const enrollmentToUpdate = enrollments?.find(e => e.id === enrollmentId);
    if (!enrollmentToUpdate) return;
    
    const updatedData = { isApproved: approve };

    updateDoc(enrollmentRef, updatedData)
      .then(() => {
        toast({ title: 'Success', description: `Enrollment ${approve ? 'approved' : 'rejected'}.` });
        forceRefresh();
      })
      .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
              path: enrollmentRef.path,
              operation: 'update',
              requestResourceData: updatedData,
          });
          errorEmitter.emit('permission-error', permissionError);
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to update enrollment.' });
      });
};


  if (isLoading) return <Loader2 className="animate-spin" />;

  return (
    <div className="space-y-4">
      {enrollments && enrollments.length > 0 ? (
        enrollments.map(enrollment => (
          <Card key={enrollment.id}>
            <CardHeader>
              <CardTitle>Enrollment for {enrollment.itemName || enrollment.itemId}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>Student ID: {enrollment.studentId}</p>
              <p>Item Type: {enrollment.itemType}</p>
              <p>Payment Mobile: {enrollment.paymentMobileNumber || 'N/A'}</p>
              {enrollment.transactionId && <p>Transaction ID: {enrollment.transactionId}</p>}
            </CardContent>
            <CardContent className="flex gap-4">
              <Button onClick={() => handleApproval(enrollment.id, true)}>Approve</Button>
              <Button variant="destructive" onClick={() => handleApproval(enrollment.id, false)}>Reject</Button>
            </CardContent>
          </Card>
        ))
      ) : (
        <p>No pending enrollments.</p>
      )}
    </div>
  );
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

const bookSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  author: z.string().min(3, "Author must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  price: z.coerce.number().min(0, "Price cannot be negative."),
  verificationCharge: z.coerce.number().min(0, "Verification charge cannot be negative."),
  bookImage: z.any().refine(files => files?.length === 1, "Book image is required."),
});

function AddBookForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const firestore = useFirestore();

    const form = useForm<z.infer<typeof bookSchema>>({
        resolver: zodResolver(bookSchema),
        defaultValues: { title: '', author: '', description: '', price: 0, verificationCharge: 5 },
    });

    const fileToDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(new Error('Failed to read file: ' + (error.target?.error?.message || 'Unknown error')));
        reader.readAsDataURL(file);
    });

    async function onSubmit(values: z.infer<typeof bookSchema>) {
        setIsSubmitting(true);
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Firestore is not initialized.' });
            setIsSubmitting(false);
            return;
        }

        const imageUrl = await fileToDataUrl(values.bookImage[0]);
        const newDocRef = doc(collection(firestore, 'books'));
        const bookData = {
            id: newDocRef.id,
            ...values,
            imageUrl,
            createdAt: serverTimestamp(),
        };

        delete (bookData as any).bookImage;

        setDoc(newDocRef, bookData)
            .then(() => {
                toast({ title: 'Success!', description: 'Book added successfully.' });
                form.reset();
            })
            .catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: newDocRef.path,
                    operation: 'create',
                    requestResourceData: bookData,
                });
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => setIsSubmitting(false));
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Book Title</FormLabel><FormControl><Input placeholder="Book Title" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="author" render={({ field }) => (
                    <FormItem><FormLabel>Author</FormLabel><FormControl><Input placeholder="Author Name" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Book Description" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem><FormLabel>Price</FormLabel><FormControl><Input type="number" placeholder="e.g., 499" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="verificationCharge" render={({ field }) => (
                    <FormItem><FormLabel>Verification Charge</FormLabel><FormControl><Input type="number" placeholder="e.g., 5" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="bookImage" render={({ field }) => (
                    <FormItem><FormLabel>Book Image</FormLabel><FormControl><Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Book
                </Button>
            </form>
        </Form>
    );
}

function ManageBookOrders() {
    const firestore = useFirestore();
    const ordersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'bookOrders'), orderBy('orderDate', 'desc')) : null, [firestore]);
    const { data: orders, isLoading, forceRefresh } = useCollection(ordersQuery);
    const { toast } = useToast();
    const [editingOrder, setEditingOrder] = useState<any>(null);

    const handleStatusChange = async (orderId: string, status: 'approved' | 'rejected' | 'shipped') => {
        if (!firestore) return;
        const orderRef = doc(firestore, 'bookOrders', orderId);
        try {
            await updateDoc(orderRef, { status });
            toast({ title: 'Success', description: `Order status updated to ${status}.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update order status.' });
        }
    };

    const handleDelete = async (orderId: string) => {
        if (!firestore) return;
        try {
            await deleteDoc(doc(firestore, "bookOrders", orderId));
            toast({ title: "Order Deleted", description: "The order has been removed." });
            forceRefresh();
        } catch (error) {
             toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete order.' });
        }
    };

    const handleUpdateOrder = async (values: { tentativeDeliveryDate?: string; trackingLink?: string }) => {
        if (!firestore || !editingOrder) return;
        const orderRef = doc(firestore, 'bookOrders', editingOrder.id);
        try {
            await updateDoc(orderRef, { ...values, status: 'shipped' });
            toast({ title: 'Success', description: 'Order details updated and marked as shipped.' });
            setEditingOrder(null);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update order details.' });
        }
    };

    if (isLoading) return <div className="flex justify-center items-center"><Loader2 className="animate-spin" /></div>;
    
    return (
        <div className="space-y-4">
            {orders && orders.length > 0 ? orders.map(order => (
                <Card key={order.id}>
                    <CardHeader>
                        <CardTitle>Order #{order.id.substring(0, 6)}</CardTitle>
                        <p className="text-sm text-muted-foreground">Status: <span className="font-bold">{order.status}</span></p>
                    </CardHeader>
                    <CardContent>
                        <p><strong>Student ID:</strong> {order.studentId}</p>
                        <p><strong>Book ID:</strong> {order.bookId}</p>
                         <p><strong>Shipping To:</strong> {order.shippingAddress.name}, {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zipCode}</p>
                        <p><strong>Mobile:</strong> {order.shippingAddress.mobile}</p>
                        <p><strong>Payment Mobile:</strong> {order.paymentMobileNumber || 'N/A'}</p>
                        {order.transactionId && <p>Transaction ID: {order.transactionId}</p>}
                    </CardContent>
                    <CardContent className="flex gap-2 flex-wrap">
                        {order.status === 'pending' && (
                            <>
                                <Button size="sm" onClick={() => handleStatusChange(order.id, 'approved')}>Approve</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleStatusChange(order.id, 'rejected')}>Reject</Button>
                            </>
                        )}
                         {order.status === 'approved' && (
                             <Button size="sm" onClick={() => setEditingOrder(order)}>Add Shipping Details</Button>
                         )}
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive" className="ml-auto"><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Order?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently remove the order. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(order.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                         </AlertDialog>
                    </CardContent>
                </Card>
            )) : <p>No book orders found.</p>}

            {editingOrder && (
                <Card className="mt-4">
                    <CardHeader><CardTitle>Ship Order #{editingOrder.id.substring(0, 6)}</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            handleUpdateOrder({
                                tentativeDeliveryDate: formData.get('deliveryDate') as string,
                                trackingLink: formData.get('trackingLink') as string,
                            });
                        }} className="space-y-4">
                            <div>
                                <Label htmlFor="deliveryDate">Tentative Delivery Date</Label>
                                <Input id="deliveryDate" name="deliveryDate" type="date" defaultValue={editingOrder.tentativeDeliveryDate || ''} />
                            </div>
                            <div>
                                <Label htmlFor="trackingLink">Tracking Link</Label>
                                <Input id="trackingLink" name="trackingLink" type="url" placeholder="https://tracking.example.com/..." defaultValue={editingOrder.trackingLink || ''} />
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit">Mark as Shipped</Button>
                                <Button variant="ghost" onClick={() => setEditingOrder(null)}>Cancel</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

const couponSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters."),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.coerce.number().min(1, "Discount value must be positive."),
  expiryDate: z.string().min(1, "Expiry date is required."),
  maxUses: z.coerce.number().min(1, "Max uses must be at least 1."),
});

function AddCouponForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const firestore = useFirestore();

    const form = useForm<z.infer<typeof couponSchema>>({
        resolver: zodResolver(couponSchema),
        defaultValues: { 
            code: '',
            discountType: 'fixed', 
            discountValue: 0,
            expiryDate: '',
            maxUses: 100 
        },
    });

    async function onSubmit(values: z.infer<typeof couponSchema>) {
        setIsSubmitting(true);
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Firestore is not initialized.' });
            setIsSubmitting(false);
            return;
        }

        const newDocRef = doc(collection(firestore, 'coupons'));
        const couponData = {
            id: newDocRef.id,
            ...values,
            expiryDate: new Date(values.expiryDate),
            usedCount: 0,
            createdAt: serverTimestamp(),
        };

        setDoc(newDocRef, couponData)
            .then(() => {
                toast({ title: 'Success!', description: 'Coupon added successfully.' });
                form.reset();
            })
            .catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: newDocRef.path,
                    operation: 'create',
                    requestResourceData: couponData,
                });
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => setIsSubmitting(false));
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="code" render={({ field }) => (
                    <FormItem><FormLabel>Coupon Code</FormLabel><FormControl><Input placeholder="e.g., SUMMER50" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="discountType" render={({ field }) => (
                     <FormItem>
                        <FormLabel>Discount Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select discount type" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="percentage">Percentage</SelectItem>
                                <SelectItem value="fixed">Fixed Amount</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="discountValue" render={({ field }) => (
                    <FormItem><FormLabel>Discount Value</FormLabel><FormControl><Input type="number" placeholder={form.watch('discountType') === 'percentage' ? 'e.g., 10 for 10%' : 'e.g., 100 for ₹100'} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="expiryDate" render={({ field }) => (
                    <FormItem><FormLabel>Expiry Date</FormLabel><FormControl><Input type="date" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="maxUses" render={({ field }) => (
                    <FormItem><FormLabel>Max Uses</FormLabel><FormControl><Input type="number" placeholder="e.g., 100" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Coupon
                </Button>
            </form>
        </Form>
    );
}

const contentSchema = z.object({
  courseId: z.string().min(1, 'Please select a course.'),
  contentType: z.enum(['video', 'note', 'test']),
  title: z.string().min(3, 'Title is required.'),
  url: z.string().min(1, 'URL or ID is required.'),
});

function AddContentForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const coursesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'courses') : null, [firestore]);
  const { data: courses, isLoading: isLoadingCourses } = useCollection(coursesQuery);
  
  const form = useForm<z.infer<typeof contentSchema>>({
    resolver: zodResolver(contentSchema),
    defaultValues: { courseId: '', contentType: 'video', title: '', url: '' },
  });

  async function onSubmit(values: z.infer<typeof contentSchema>) {
    setIsSubmitting(true);
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Firestore is not initialized.' });
      setIsSubmitting(false);
      return;
    }

    const courseRef = doc(firestore, 'courses', values.courseId);
    const contentId = doc(collection(firestore, 'sub')).id; // Generate a random ID for the content
    
    let content;
    let updateData = {};

    if (values.contentType === 'test') {
        // For tests, the 'url' field is actually the test series ID. We link it.
        content = { id: values.url, title: values.title };
        updateData = { tests: arrayUnion(content) };
    } else {
        // For videos and notes, it's a URL.
        content = { id: contentId, title: values.title, url: values.url };
        if (values.contentType === 'video') {
            updateData = { videos: arrayUnion(content) };
        } else if (values.contentType === 'note') {
            updateData = { notes: arrayUnion(content) };
        }
    }

    updateDoc(courseRef, updateData)
      .then(() => {
        toast({ title: 'Success!', description: 'Content added successfully.' });
        form.reset();
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: courseRef.path,
          operation: 'update',
          requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setIsSubmitting(false));
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="courseId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder={isLoadingCourses ? 'Loading...' : 'Select a course'} /></SelectTrigger></FormControl>
                <SelectContent>
                  {!isLoadingCourses && courses?.map(course => <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select content type" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="note">Note (PDF)</SelectItem>
                  <SelectItem value="test">Test Series</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Content Title</FormLabel><FormControl><Input placeholder="e.g., Introduction to React" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="url" render={({ field }) => (
          <FormItem>
            <FormLabel>{form.watch('contentType') === 'test' ? 'Test Series ID' : 'Content URL'}</FormLabel>
            <FormControl><Input placeholder={form.watch('contentType') === 'test' ? "Enter the ID of the test series" : "https://youtube.com/watch?v=..."} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Content
        </Button>
      </form>
    </Form>
  );
}


const testSeriesSchema = z.object({
  title: z.string().min(5, 'Title is required'),
  description: z.string().min(10, 'Description is required'),
  price: z.coerce.number().min(0),
  isFree: z.boolean().default(false),
  isStandalone: z.boolean().default(true),
  courseId: z.string().optional(),
  imageUrl: z.any().refine(files => files?.length == 1, 'Image is required.'),
  questions: z.string().optional(),
  isScholarshipTest: z.boolean().default(false),
}).refine(data => data.isStandalone || (!data.isStandalone && data.courseId), {
  message: "A course must be selected for non-standalone test series.",
  path: ["courseId"],
});


function AddTestSeriesForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const coursesQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'courses') : null), [firestore]);
  const { data: courses, isLoading: isLoadingCourses } = useCollection(coursesQuery);

  const form = useForm<z.infer<typeof testSeriesSchema>>({
    resolver: zodResolver(testSeriesSchema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      isFree: false,
      isStandalone: true,
      courseId: '',
      questions: '',
      isScholarshipTest: false,
    },
  });

  const isStandalone = form.watch('isStandalone');

  const fileToDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(new Error('Failed to read file: ' + (error.target?.error?.message || 'Unknown error')));
    reader.readAsDataURL(file);
  });

  async function onSubmit(values: z.infer<typeof testSeriesSchema>) {
    setIsSubmitting(true);
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Firestore is not initialized.' });
      setIsSubmitting(false);
      return;
    }
    
    let questionsArray = [];
    if (values.questions) {
      try {
        questionsArray = JSON.parse(values.questions);
        if (!Array.isArray(questionsArray)) throw new Error("JSON must be an array.");
      } catch (e) {
        toast({ variant: 'destructive', title: 'Invalid JSON', description: 'The questions field contains invalid JSON.' });
        setIsSubmitting(false);
        return;
      }
    }

    const imageUrl = await fileToDataUrl(values.imageUrl[0]);
    const testSeriesRef = doc(collection(firestore, 'test_series'));

    const testSeriesData = {
      id: testSeriesRef.id,
      title: values.title,
      description: values.description,
      price: values.isFree ? 0 : values.price,
      isFree: values.isFree,
      imageUrl,
      isStandalone: values.isStandalone,
      courseId: values.isStandalone ? null : values.courseId,
      isScholarshipTest: values.isScholarshipTest,
      createdAt: serverTimestamp(),
      questions: questionsArray
    };

    setDoc(testSeriesRef, testSeriesData).then(async () => {
        if (!values.isStandalone && values.courseId) {
            const courseRef = doc(firestore, 'courses', values.courseId);
            const content = { id: testSeriesRef.id, title: values.title };
            await updateDoc(courseRef, { tests: arrayUnion(content) }).catch((e) => {
                 toast({ variant: 'destructive', title: 'Error', description: 'Failed to associate test series with course.' });
            });
        }
        toast({ title: 'Success!', description: 'Test Series added successfully.' });
        form.reset();
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: testSeriesRef.path,
            operation: 'create',
            requestResourceData: testSeriesData,
        });
        errorEmitter.emit('permission-error', permissionError);
    }).finally(() => {
        setIsSubmitting(false);
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g., Complete Physics Test Series" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe the test series" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="flex space-x-4">
            <FormField control={form.control} name="isStandalone" render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <div className="space-y-1 leading-none"><FormLabel>Standalone</FormLabel></div>
            </FormItem>
            )} />
             <FormField control={form.control} name="isScholarshipTest" render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <div className="space-y-1 leading-none"><FormLabel>Scholarship Test</FormLabel></div>
            </FormItem>
            )} />
        </div>

        {isStandalone ? (
          <>
            <FormField control={form.control} name="price" render={({ field }) => (
              <FormItem><FormLabel>Price</FormLabel><FormControl><Input type="number" placeholder="e.g., 199" {...field} disabled={form.watch('isFree')} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="isFree" render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <div className="space-y-1 leading-none"><FormLabel>Free Test Series</FormLabel></div>
              </FormItem>
            )} />
          </>
        ) : (
          <FormField
            control={form.control}
            name="courseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Associate with Course</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder={isLoadingCourses ? 'Loading...' : 'Select a course'} /></SelectTrigger></FormControl>
                  <SelectContent>
                    {!isLoadingCourses && courses?.map(course => <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField control={form.control} name="imageUrl" render={({ field }) => (
          <FormItem><FormLabel>Image</FormLabel><FormControl><Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="questions" render={({ field }) => (
          <FormItem>
            <FormLabel>Questions (JSON format)</FormLabel>
            <FormControl>
                <Textarea placeholder='[{"text": "Question 1?", "options": [{"text": "A", "isCorrect": true}, {"text": "B", "isCorrect": false}]}]' {...field} rows={10} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Test Series
        </Button>
      </form>
    </Form>
  );
}

function ManageContent() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const collections = [
        { name: 'Courses', path: 'courses' },
        { name: 'E-books', path: 'ebooks' },
        { name: 'Test Series', path: 'test_series' },
        { name: 'Previous Papers', path: 'previousYearPapers' },
        { name: 'Live Classes', path: 'live_classes' },
    ];

    const { data: coursesData, isLoading: coursesLoading, forceRefresh: refreshCourses } = useCollection(useMemoFirebase(() => firestore ? collection(firestore, 'courses') : null, [firestore]));
    const { data: ebooksData, isLoading: ebooksLoading, forceRefresh: refreshEbooks } = useCollection(useMemoFirebase(() => firestore ? collection(firestore, 'ebooks') : null, [firestore]));
    const { data: testSeriesData, isLoading: testSeriesLoading, forceRefresh: refreshTestSeries } = useCollection(useMemoFirebase(() => firestore ? collection(firestore, 'test_series') : null, [firestore]));
    const { data: papersData, isLoading: papersLoading, forceRefresh: refreshPapers } = useCollection(useMemoFirebase(() => firestore ? collection(firestore, 'previousYearPapers') : null, [firestore]));
    const { data: liveClassesData, isLoading: liveClassesLoading, forceRefresh: refreshLiveClasses } = useCollection(useMemoFirebase(() => firestore ? collection(firestore, 'live_classes') : null, [firestore]));

    const dataMap = {
        courses: { data: coursesData, loading: coursesLoading, refresh: refreshCourses },
        ebooks: { data: ebooksData, loading: ebooksLoading, refresh: refreshEbooks },
        test_series: { data: testSeriesData, loading: testSeriesLoading, refresh: refreshTestSeries },
        previousYearPapers: { data: papersData, loading: papersLoading, refresh: refreshPapers },
        live_classes: { data: liveClassesData, loading: liveClassesLoading, refresh: refreshLiveClasses },
    };

    const handleDelete = async (collectionPath: string, docId: string, refreshFunc: () => void) => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Firestore is not available.' });
            return;
        }
        try {
            await deleteDoc(doc(firestore, collectionPath, docId));
            toast({ title: 'Success', description: 'Item deleted successfully.' });
            refreshFunc();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete item.' });
            console.error("Delete error: ", error);
        }
    };

    return (
        <Tabs defaultValue="courses" className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 h-auto">
                {collections.map(c => <TabsTrigger key={c.path} value={c.path}>{c.name}</TabsTrigger>)}
            </TabsList>
            {collections.map(c => {
                const { data, loading, refresh } = dataMap[c.path as keyof typeof dataMap];
                return (
                    <TabsContent key={c.path} value={c.path}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Manage {c.name}</CardTitle>
                                <CardDescription>View and delete items from the '{c.path}' collection.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {loading ? <Loader2 className="mx-auto animate-spin" /> :
                                    data && data.length > 0 ? (
                                        data.map(item => (
                                            <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                                <span className="font-medium">{item.title}</span>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>This action cannot be undone. This will permanently delete the item.</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(c.path, item.id, refresh)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-muted-foreground py-4">No items found in this collection.</p>
                                    )
                                }
                            </CardContent>
                        </Card>
                    </TabsContent>
                );
            })}
        </Tabs>
    );
}

const settingsSchema = z.object({
  qrCodeImage: z.any().optional(),
  mobileNumber: z.string().optional(),
  upiId: z.string().optional(),
  scholarshipFee: z.coerce.number().min(0).optional(),
});

function AppSettingsForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'payment') : null, [firestore]);
  const { data: settings, isLoading } = useDoc(settingsRef);

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      mobileNumber: '',
      upiId: '',
      scholarshipFee: 60,
    }
  });
  
  useState(() => {
    if (settings) {
      form.reset({
        mobileNumber: settings.mobileNumber || '',
        upiId: settings.upiId || '',
        scholarshipFee: settings.scholarshipFee || 60,
      });
    }
  }, [settings, form]);

  const fileToDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });

  async function onSubmit(values: z.infer<typeof settingsSchema>) {
    setIsSubmitting(true);
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Firestore is not available.' });
      setIsSubmitting(false);
      return;
    }

    try {
      const settingsData: { mobileNumber?: string; qrCodeImageUrl?: string; upiId?: string; scholarshipFee?: number } = {
        mobileNumber: values.mobileNumber,
        upiId: values.upiId,
        scholarshipFee: values.scholarshipFee,
      };

      if (values.qrCodeImage && values.qrCodeImage.length > 0) {
        settingsData.qrCodeImageUrl = await fileToDataUrl(values.qrCodeImage[0]);
      }
      
      const docRef = doc(firestore, 'settings', 'payment');
      await setDoc(docRef, settingsData, { merge: true });
      toast({ title: 'Success!', description: 'Settings saved successfully.' });
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to save settings.' });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      {isLoading ? <Loader2 className="animate-spin" /> :
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="mobileNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Mobile Number</FormLabel>
              <FormControl><Input placeholder="Enter mobile number for payments" {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="upiId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>UPI ID</FormLabel>
              <FormControl><Input placeholder="your-upi-id@okhdfcbank" {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="qrCodeImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment QR Code</FormLabel>
              <FormControl><Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {settings?.qrCodeImageUrl && (
            <div>
                <p className="text-sm font-medium mb-2">Current QR Code:</p>
                <Image src={settings.qrCodeImageUrl} alt="Current QR Code" width={150} height={150} className="rounded-md border"/>
            </div>
        )}
        <FormField
          control={form.control}
          name="scholarshipFee"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scholarship Admit Card Fee (₹)</FormLabel>
              <FormControl><Input type="number" placeholder="e.g., 60" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </form>}
    </Form>
  )

}


const vidyaSearchAdminSchema = z.object({
  title: z.string().min(3, "Title is required."),
  description: z.string().min(10, "Description is required."),
  link: z.string().url("Must be a valid URL."),
  image: z.any().optional(),
});

function VidyaSearchAdmin() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof vidyaSearchAdminSchema>>({
    resolver: zodResolver(vidyaSearchAdminSchema),
    defaultValues: { title: "", description: "", link: "" },
  });

  const fileToDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });

  async function onSubmit(values: z.infer<typeof vidyaSearchAdminSchema>) {
    setIsSubmitting(true);
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Firestore is not available.' });
      setIsSubmitting(false);
      return;
    }
    
    let imageUrl: string | null = null;
    if (values.image && values.image.length > 0) {
      imageUrl = await fileToDataUrl(values.image[0]);
    }

    const docRef = doc(collection(firestore, 'vidya_search_data'));
    const data = {
      id: docRef.id,
      title: values.title,
      description: values.description,
      link: values.link,
      imageUrl: imageUrl,
      createdAt: serverTimestamp(),
    };

    try {
      await setDoc(docRef, data);
      toast({ title: "Success", description: "Custom search data added." });
      form.reset();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add custom data.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vidya Search Admin</CardTitle>
        <CardDescription>Add custom links and data that will appear first in Vidya Search results.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="Title of the search result" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Short description for the search result" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="link" render={({ field }) => (
              <FormItem><FormLabel>Link URL</FormLabel><FormControl><Input type="url" placeholder="https://example.com" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="image" render={({ field }) => (
              <FormItem><FormLabel>Image (Optional)</FormLabel><FormControl><Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} /></FormControl><FormMessage /></FormItem>
            )} />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Search Data
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function ScholarshipManagement() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const applicationsQuery = useMemoFirebase(() => 
        firestore ? query(collection(firestore, 'scholarshipApplications'), orderBy('createdAt', 'desc')) : null,
        [firestore]
    );
    const { data: applications, isLoading, forceRefresh } = useCollection(applicationsQuery);

    const handleStatusChange = async (appId: string, status: 'approved' | 'rejected') => {
        if (!firestore) return;
        const appRef = doc(firestore, 'scholarshipApplications', appId);
        try {
            await updateDoc(appRef, { status });
            toast({ title: 'Success', description: `Application status updated to ${status}.` });
            forceRefresh();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status.' });
        }
    };
    
    if (isLoading) return <Loader2 className="animate-spin" />;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Scholarship Management</CardTitle>
                <CardDescription>Review and manage all scholarship applications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 {applications && applications.length > 0 ? applications.map((app: any) => (
                    <Card key={app.id}>
                         <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg">{app.fullName}</CardTitle>
                                    <CardDescription>ID: {app.id}</CardDescription>
                                </div>
                                 <Badge variant={app.status === 'rejected' ? 'destructive' : 'default'} className="capitalize">{app.status}</Badge>
                            </div>
                         </CardHeader>
                         <CardContent className="text-sm space-y-2">
                             <p><strong>Father's Name:</strong> {app.fatherName}</p>
                             <p><strong>Exam Mode:</strong> {app.examMode}</p>
                             <p><strong>Score:</strong> {app.testScore !== undefined ? `${app.testScore} / ${app.totalQuestions} (${app.percentage}%)` : 'Not Taken'}</p>
                         </CardContent>
                         <CardFooter className="flex gap-2">
                            {app.status === 'submitted' || app.status === 'rejected' ? (
                                 <Button size="sm" onClick={() => handleStatusChange(app.id, 'approved')}>
                                    <Check className="mr-2 h-4 w-4" /> Approve
                                </Button>
                            ) : null}
                            {app.status === 'submitted' || app.status === 'approved' ? (
                                <Button size="sm" variant="destructive" onClick={() => handleStatusChange(app.id, 'rejected')}>
                                    <X className="mr-2 h-4 w-4" /> Reject
                                </Button>
                            ) : null}
                         </CardFooter>
                    </Card>
                 )) : <p className="text-muted-foreground text-center">No applications found.</p>}
            </CardContent>
        </Card>
    );
}

const centerSchema = z.object({
  name: z.string().min(3, "Center name is required."),
  address: z.string().min(10, "Address is required."),
  city: z.string().min(3, "City is required."),
  state: z.string().min(2, "State is required."),
  pincode: z.string().min(6, "Pincode is required.").max(6),
  examDate: z.string().min(1, "Exam date is required."),
  examTime: z.string().min(1, "Exam time is required."),
  admitCardDate: z.string().min(1, "Admit card download date is required."),
  resultDate: z.string().min(1, "Result date is required."),
});

function CenterManagement() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof centerSchema>>({
    resolver: zodResolver(centerSchema),
    defaultValues: { name: "", address: "", city: "", state: "", pincode: "" },
  });

  async function onSubmit(values: z.infer<typeof centerSchema>) {
    setIsSubmitting(true);
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Firestore is not available.' });
      setIsSubmitting(false);
      return;
    }
    const centerRef = doc(collection(firestore, 'scholarship_centers'));
    const centerData = {
      id: centerRef.id,
      ...values,
      createdAt: serverTimestamp(),
    };
    try {
      await setDoc(centerRef, centerData);
      toast({ title: 'Success', description: 'New examination center added.' });
      form.reset();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add center.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Center Management</CardTitle>
        <CardDescription>Add and manage scholarship examination centers.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Center Name</FormLabel><FormControl><Input placeholder="e.g., Vidya Public School" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem><FormLabel>Address</FormLabel><FormControl><Textarea placeholder="Full address of the center" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="state" render={({ field }) => (
                <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="pincode" render={({ field }) => (
                <FormItem><FormLabel>Pincode</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField control={form.control} name="examDate" render={({ field }) => (
                <FormItem><FormLabel>Exam Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="examTime" render={({ field }) => (
                <FormItem><FormLabel>Exam Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField control={form.control} name="admitCardDate" render={({ field }) => (
                <FormItem><FormLabel>Admit Card Download Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="resultDate" render={({ field }) => (
                <FormItem><FormLabel>Result Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Center
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('add-course');
  
  const renderContent = () => {
    switch (activeTab) {
      case 'add-course':
        return <Card><CardHeader><CardTitle>Create a New Course</CardTitle></CardHeader><CardContent className="pt-6"><CreateCourseForm /></CardContent></Card>;
      case 'add-content':
        return <Card><CardHeader><CardTitle>Add Content to Course</CardTitle></CardHeader><CardContent className="pt-6"><AddContentForm /></CardContent></Card>;
      case 'add-ebook':
        return <Card><CardHeader><CardTitle>Add a New E-book</CardTitle></CardHeader><CardContent className="pt-6"><CreateEbookForm /></CardContent></Card>;
      case 'add-test-series':
        return <Card><CardHeader><CardTitle>Add a New Test Series</CardTitle></CardHeader><CardContent className="pt-6"><AddTestSeriesForm /></CardContent></Card>;
      case 'add-previous-paper':
        return <Card><CardHeader><CardTitle>Add Previous Year Paper</CardTitle></CardHeader><CardContent className="pt-6"><CreatePreviousPaperForm /></CardContent></Card>;
      case 'add-educator':
        return <Card><CardHeader><CardTitle>Add a New Educator</CardTitle></CardHeader><CardContent className="pt-6"><AddEducatorForm /></CardContent></Card>;
      case 'add-live-class':
        return <Card><CardHeader><CardTitle>Schedule a New Live Class</CardTitle></CardHeader><CardContent className="pt-6"><AddLiveClassForm /></CardContent></Card>;
      case 'enrollments':
        return <Card><CardHeader><CardTitle>Manage Enrollments</CardTitle></CardHeader><CardContent className="pt-6"><ManageEnrollments /></CardContent></Card>;
      case 'promotions':
        return <Card><CardHeader><CardTitle>Add New Promotion</CardTitle></CardHeader><CardContent className="pt-6"><AddPromotionForm /></CardContent></Card>;
      case 'add-book':
        return <Card><CardHeader><CardTitle>Add a New Book</CardTitle></CardHeader><CardContent className="pt-6"><AddBookForm /></CardContent></Card>;
      case 'book-orders':
        return <Card><CardHeader><CardTitle>Manage Book Orders</CardTitle></CardHeader><CardContent className="pt-6"><ManageBookOrders /></CardContent></Card>;
      case 'add-coupon':
        return <Card><CardHeader><CardTitle>Create a New Coupon</CardTitle></CardHeader><CardContent className="pt-6"><AddCouponForm /></CardContent></Card>;
      case 'scholarship-management':
        return <ScholarshipManagement />;
      case 'center-management':
        return <CenterManagement />;
      case 'manage-content':
        return <ManageContent />;
      case 'app-settings':
        return <Card><CardHeader><CardTitle>App Settings</CardTitle></CardHeader><CardContent className="pt-6"><AppSettingsForm /></CardContent></Card>;
       case 'vidya-search-admin':
        return <VidyaSearchAdmin />;
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

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
          <div className="flex flex-col gap-2">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              return (
                 <Button 
                   key={item.value}
                   variant={activeTab === item.value ? "default" : "outline"}
                   onClick={() => setActiveTab(item.value)}
                   className="justify-start text-left h-12"
                 >
                    <Icon className="h-5 w-5 mr-3"/>
                    <span className="text-base">{item.label}</span>
                 </Button>
              )
            })}
          </div>
          
          <div className="lg:col-start-2">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}


    