

'use client';
import { useState, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const personalInfoSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  fatherName: z.string().min(2, "Father's name is required."),
  dob: z.string().min(1, "Date of birth is required."),
  gender: z.string().min(1, "Please select a gender."),
  mobile: z.string().min(10, "A valid 10-digit mobile number is required.").max(10),
  email: z.string().email("Please enter a valid email address."),
});

const academicInfoSchema = z.object({
  currentClass: z.string().min(1, "Please select your current class."),
  school: z.string().min(2, "School name is required."),
  previousMarks: z.coerce.number().min(0, "Marks must be between 0 and 100.").max(100, "Marks must be between 0 and 100."),
});

const centerChoiceSchema = z.object({
  examMode: z.enum(['online', 'offline'], { required_error: "Please select an exam mode." }),
  center1: z.string().optional(),
  center2: z.string().optional(),
  center3: z.string().optional(),
}).refine(data => {
  if (data.examMode === 'offline') {
    return data.center1 && data.center2 && data.center3;
  }
  return true;
}, {
  message: "Please select three different centers for offline mode.",
  path: ["center1"],
});

const uploadSchema = z.object({
  photo: z.any().optional(),
  signature: z.any().optional(),
});

const combinedSchema = personalInfoSchema.merge(academicInfoSchema).merge(centerChoiceSchema).merge(uploadSchema);


const steps = [
  { id: 1, title: 'Personal Information', fields: Object.keys(personalInfoSchema.shape) },
  { id: 2, title: 'Academic Information', fields: Object.keys(academicInfoSchema.shape) },
  { id: 3, title: 'Exam Center Choice', fields: Object.keys(centerChoiceSchema.shape) },
  { id: 4, title: 'Upload Documents', fields: Object.keys(uploadSchema.shape) },
  { id: 5, title: 'Review & Submit', fields: [] },
];

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

export default function ScholarshipApplyPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const centersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'scholarship_centers') : null, [firestore]);
  const { data: centers, isLoading: isLoadingCenters } = useCollection(centersQuery);
  
  const methods = useForm<z.infer<typeof combinedSchema>>({
    resolver: zodResolver(combinedSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      fatherName: '',
      dob: '',
      gender: '',
      mobile: '',
      email: '',
      currentClass: '',
      school: '',
      previousMarks: 0,
      examMode: 'offline',
      center1: '',
      center2: '',
      center3: '',
      photo: undefined,
      signature: undefined,
    }
  });

  const watchExamMode = methods.watch('examMode');

  const nextStep = async () => {
    const fieldsToValidate = steps[currentStep - 1].fields as (keyof z.infer<typeof combinedSchema>)[];
    const isValid = await methods.trigger(fieldsToValidate);
    
    if (isValid) {
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: z.infer<typeof combinedSchema>) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'User or database not available.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const applicationRef = doc(collection(firestore, 'scholarshipApplications'));

      const photoUrl = data.photo?.[0] ? await fileToDataUrl(data.photo[0]) : null;
      const signatureUrl = data.signature?.[0] ? await fileToDataUrl(data.signature[0]) : null;

      const applicationData = {
        id: applicationRef.id,
        userId: user.uid,
        ...data,
        photoUrl,
        signatureUrl,
        status: 'submitted',
        createdAt: serverTimestamp(),
      };
      
      delete (applicationData as any).photo;
      delete (applicationData as any).signature;

      await setDoc(applicationRef, applicationData);
      
      toast({
        title: 'Application Submitted!',
        description: `Your application number is ${applicationRef.id}. You will be redirected shortly.`,
      });
      router.push('/scholarship/my-applications');
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Submission Failed', description: 'There was an error submitting your application.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
        <div className='flex items-center gap-4 mb-6'>
            <Button asChild variant="ghost" size="icon">
                <Link href="/scholarship">
                    <ArrowLeft />
                </Link>
            </Button>
            <h1 className="text-3xl font-bold font-headline">Scholarship Application</h1>
         </div>

      <Card>
        <CardHeader>
          <CardTitle>Step {currentStep}: {steps[currentStep - 1].title}</CardTitle>
          <CardDescription>Please fill out the details carefully.</CardDescription>
        </CardHeader>
        <CardContent>
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
              {currentStep === 1 && (
                <>
                  <FormField name="fullName" control={methods.control} render={({ field }) => (
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField name="fatherName" control={methods.control} render={({ field }) => (
                    <FormItem><FormLabel>Father's Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <FormField name="dob" control={methods.control} render={({ field }) => (
                    <FormItem><FormLabel>Date of Birth</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <FormField name="gender" control={methods.control} render={({ field }) => (
                    <FormItem><FormLabel>Gender</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                  )} />
                   <FormField name="mobile" control={methods.control} render={({ field }) => (
                    <FormItem><FormLabel>Mobile Number</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <FormField name="email" control={methods.control} render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </>
              )}

              {currentStep === 2 && (
                <>
                  <FormField name="currentClass" control={methods.control} render={({ field }) => (
                    <FormItem><FormLabel>Current Class</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger></FormControl>
                        <SelectContent>{Array.from({ length: 12 }, (_, i) => i + 1).map(c => <SelectItem key={c} value={String(c)}>Class {c}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                  )} />
                  <FormField name="school" control={methods.control} render={({ field }) => (
                    <FormItem><FormLabel>School Name</FormLabel><FormControl><Input placeholder="e.g., Delhi Public School" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField name="previousMarks" control={methods.control} render={({ field }) => (
                    <FormItem><FormLabel>Previous Class Percentage (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </>
              )}

              {currentStep === 3 && (
                 <>
                  <FormField name="examMode" control={methods.control} render={({ field }) => (
                    <FormItem className="space-y-3"><FormLabel>Select Exam Mode</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4"><FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="offline" /></FormControl><FormLabel className="font-normal">Offline</FormLabel></FormItem><FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="online" /></FormControl><FormLabel className="font-normal">Online</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>
                  )} />

                  {watchExamMode === 'offline' && (
                    <>
                    <FormField name="center1" control={methods.control} render={({ field }) => (
                      <FormItem><FormLabel>Center Choice 1</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select first choice" /></SelectTrigger></FormControl><SelectContent>{centers?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}, {c.city}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                    )} />
                     <FormField name="center2" control={methods.control} render={({ field }) => (
                      <FormItem><FormLabel>Center Choice 2</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select second choice" /></SelectTrigger></FormControl><SelectContent>{centers?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}, {c.city}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                    )} />
                     <FormField name="center3" control={methods.control} render={({ field }) => (
                      <FormItem><FormLabel>Center Choice 3</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select third choice" /></SelectTrigger></FormControl><SelectContent>{centers?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}, {c.city}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                    )} />
                    </>
                  )}
                 </>
              )}

               {currentStep === 4 && (
                 <>
                    <FormField name="photo" control={methods.control} render={({ field: { onChange, ...rest } }) => (
                        <FormItem><FormLabel>Upload Photo (Optional)</FormLabel><FormControl><Input type="file" accept="image/*" onChange={(e) => onChange(e.target.files)} {...rest} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField name="signature" control={methods.control} render={({ field: { onChange, ...rest } }) => (
                        <FormItem><FormLabel>Upload Signature (Optional)</FormLabel><FormControl><Input type="file" accept="image/*" onChange={(e) => onChange(e.target.files)} {...rest} /></FormControl><FormMessage /></FormItem>
                    )} />
                 </>
               )}

              {currentStep === 5 && (
                 <div className="space-y-4">
                    <h3 className="font-semibold">Review your application details.</h3>
                    <Card>
                        <CardContent className="p-4 space-y-2 text-sm">
                            {Object.entries(methods.getValues()).map(([key, value]) => {
                                if (value instanceof FileList || typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length === 0) return null;
                                if (value === '' || value === undefined || value === null) return null;
                                return (
                                    <div key={key} className="flex justify-between">
                                        <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                        <span>{String(value)}</span>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                 </div>
              )}

              <div className="flex justify-between mt-8">
                <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1}>
                  Previous
                </Button>
                {currentStep < 5 ? (
                  <Button type="button" onClick={nextStep}>Next</Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Application
                  </Button>
                )}
              </div>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
}
