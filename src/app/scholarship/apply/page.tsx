
'use client';
import { useState, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp, getDocs, runTransaction, updateDoc } from 'firebase/firestore';
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

const finalSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  fatherName: z.string().min(2, "Father's name is required."),
  dob: z.string().min(1, "Date of birth is required."),
  gender: z.string().min(1, "Please select a gender."),
  mobile: z.string().length(10, "A valid 10-digit mobile number is required."),
  email: z.string().email("Please enter a valid email address."),
  currentClass: z.string().min(1, "Please select your current class."),
  school: z.string().min(2, "School name is required."),
  previousMarks: z.coerce.number().min(0, "Marks must be between 0 and 100.").max(100, "Marks must be between 0 and 100."),
  examMode: z.enum(['online', 'offline'], { required_error: 'Please select an exam mode.' }),
  center1: z.string().optional(),
  center2: z.string().optional(),
  center3: z.string().optional(),
  photo: z.any().optional(),
  signature: z.any().optional(),
  paymentMobileNumber: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.examMode === 'offline') {
        if (!data.center1) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please select a center.', path: ['center1'] });
        if (!data.center2) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please select a center.', path: ['center2'] });
        if (!data.center3) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please select a center.', path: ['center3'] });

        const centers = [data.center1, data.center2, data.center3];
        if (centers.some(c => c) && new Set(centers.filter(Boolean)).size !== centers.filter(Boolean).length) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Please select three different centers.",
                path: ["center1"],
            });
        }
    }
    if (data.examMode === 'online') {
        if (!data.paymentMobileNumber || data.paymentMobileNumber.length !== 10) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Please enter a valid 10-digit UPI mobile number.',
                path: ['paymentMobileNumber'],
            });
        }
    }
});


export default function ScholarshipApplyPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'payment') : null, [firestore]);
  const { data: settings, isLoading: isLoadingSettings } = useDoc(settingsRef);

  const centersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'scholarship_centers') : null, [firestore]);
  const { data: centers, isLoading: isLoadingCenters } = useCollection(centersQuery);
  
  const methods = useForm<z.infer<typeof finalSchema>>({
    resolver: zodResolver(finalSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: user?.displayName || '',
      fatherName: '',
      dob: '',
      gender: '',
      mobile: user?.phoneNumber || '',
      email: user?.email || '',
      currentClass: '',
      school: '',
      previousMarks: 0,
      examMode: 'offline',
      center1: '',
      center2: '',
      center3: '',
      photo: undefined,
      signature: undefined,
      paymentMobileNumber: '',
    }
  });

  const watchExamMode = methods.watch('examMode');
  const fee = watchExamMode === 'online' ? settings?.onlineScholarshipFee : settings?.offlineScholarshipFee;
  
  const personalInfoFields: (keyof z.infer<typeof finalSchema>)[] = ['fullName', 'fatherName', 'dob', 'gender', 'mobile', 'email'];
  const academicInfoFields: (keyof z.infer<typeof finalSchema>)[] = ['currentClass', 'school', 'previousMarks'];
  const examModeFields: (keyof z.infer<typeof finalSchema>)[] = ['examMode'];
  const centerChoiceFields: (keyof z.infer<typeof finalSchema>)[] = ['center1', 'center2', 'center3'];
  const uploadFields: (keyof z.infer<typeof finalSchema>)[] = ['photo', 'signature'];
  const paymentFields: (keyof z.infer<typeof finalSchema>)[] = ['paymentMobileNumber'];


  const steps = useMemo(() => [
    { id: 1, title: 'Personal Information', fields: personalInfoFields },
    { id: 2, title: 'Academic Information', fields: academicInfoFields },
    { id: 3, title: 'Choose Exam Mode', fields: examModeFields },
    ...(watchExamMode === 'offline' ? [
        { id: 4, title: 'Exam Center Choice', fields: centerChoiceFields },
        { id: 5, title: 'Upload Documents (Optional)', fields: uploadFields },
        { id: 6, title: 'Review & Submit', fields: [] as (keyof z.infer<typeof finalSchema>)[]},
    ] : [
        { id: 4, title: 'Upload Documents (Optional)', fields: uploadFields },
        { id: 5, title: 'Payment', fields: paymentFields },
        { id: 6, title: 'Review & Submit', fields: [] as (keyof z.infer<typeof finalSchema>)[]},
    ]),
  ], [watchExamMode]);

  const nextStep = async () => {
    const currentStepConfig = steps[currentStep - 1];
    if (!currentStepConfig) return;
    
    const result = await methods.trigger(currentStepConfig.fields);
    
    if (result) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  async function generateUniqueAppId() {
        if (!firestore) throw new Error("Firestore not initialized");
        const counterRef = doc(firestore, "counters", "scholarshipApplications");

        let newId;
        await runTransaction(firestore, async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            let nextId = 10001; // Start from 10001
            if (counterDoc.exists()) {
                nextId = counterDoc.data().currentId + 1;
            }
            transaction.set(counterRef, { currentId: nextId }, { merge: true });
            newId = nextId;
        });
        return newId;
    }

  const onSubmit = async (data: z.infer<typeof finalSchema>) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'User or database not available.' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      let paymentId: string | null = null;

      if (data.examMode === 'online') {
          if (fee === undefined) {
              toast({ variant: 'destructive', title: 'Error', description: 'Fee is not defined. Cannot proceed with payment.' });
              setIsSubmitting(false);
              return;
            }
          if (!data.paymentMobileNumber || data.paymentMobileNumber.length !== 10) {
             methods.setError('paymentMobileNumber', {type: 'manual', message: 'Please enter a valid 10-digit UPI mobile number for verification.'});
             toast({ variant: 'destructive', title: 'Error', description: 'Invalid UPI mobile number.'});
             setIsSubmitting(false);
             return;
          }

          const paymentRef = doc(collection(firestore, 'scholarshipPayments'));
          const paymentData = {
              id: paymentRef.id,
              userId: user.uid,
              examMode: data.examMode,
              amount: fee,
              paymentMobileNumber: data.paymentMobileNumber,
              status: 'pending', 
              createdAt: serverTimestamp(),
          };
          await setDoc(paymentRef, paymentData);
          paymentId = paymentRef.id;
      }
      
      const newAppId = await generateUniqueAppId();
      const applicationData: any = {
        id: String(newAppId),
        userId: user.uid,
        paymentId: paymentId,
        fullName: data.fullName,
        fatherName: data.fatherName,
        dob: data.dob,
        gender: data.gender,
        mobile: data.mobile,
        email: data.email,
        currentClass: data.currentClass,
        school: data.school,
        previousMarks: data.previousMarks,
        examMode: data.examMode,
        center1: data.center1 || null,
        center2: data.center2 || null,
        center3: data.center3 || null,
        status: data.examMode === 'offline' ? 'approved' : 'submitted',
        createdAt: serverTimestamp(),
      };
      
      const photoFile = (data.photo as FileList)?.[0];
      if (photoFile) {
        applicationData.photoUrl = await fileToDataUrl(photoFile);
      }

      const signatureFile = (data.signature as FileList)?.[0];
      if (signatureFile) {
        applicationData.signatureUrl = await fileToDataUrl(signatureFile);
      }

      delete applicationData.photo;
      delete applicationData.signature;
      if (data.examMode === 'offline') {
          delete applicationData.paymentMobileNumber;
      }

      await setDoc(doc(firestore, "scholarshipApplications", String(newAppId)), applicationData);
      
      if (paymentId) {
        await updateDoc(doc(firestore, 'scholarshipPayments', paymentId), { applicationId: String(newAppId) });
      }

      setSubmittedAppId(String(newAppId));
    } catch (error) {
        console.error("Application submission error:", error);
        toast({ variant: 'destructive', title: 'Submission Failed', description: 'There was an error submitting your application.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  if(isLoadingSettings) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin"/></div>;
  }
  
  if (submittedAppId) {
    return (
        <div className="max-w-md mx-auto text-center">
            <Card className="bg-gradient-to-br from-green-500/10 via-teal-500/10 to-blue-500/10">
                <CardHeader>
                    <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                    <CardTitle className="text-2xl">Application Submitted!</CardTitle>
                    <CardDescription>Your application has been received successfully.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="mb-2">Your 5-digit Application ID is:</p>
                    <div className="bg-muted p-3 rounded-lg">
                        <p className="text-3xl font-bold tracking-widest text-primary">{submittedAppId}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Please save this number for future reference.</p>
                </CardContent>
                <CardFooter>
                     <Button asChild className="w-full">
                        <Link href="/scholarship/my-applications">Go to My Applications</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
  }

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

      <Card className="bg-gradient-to-br from-background to-card">
        <CardHeader>
          <CardTitle>Step {currentStep}: {steps.find(s => s.id === currentStep)?.title}</CardTitle>
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

              {steps.find(s => s.id === currentStep)?.title === 'Choose Exam Mode' && (
                 <FormField control={methods.control} name="examMode" render={({ field }) => (
                    <FormItem className="space-y-3">
                    <FormLabel>Choose Exam Mode</FormLabel>
                    <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center gap-4">
                        <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="offline" /></FormControl>
                            <FormLabel className="font-normal">Offline</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="online" /></FormControl>
                            <FormLabel className="font-normal">Online (Fee: ₹{settings?.onlineScholarshipFee || 30})</FormLabel>
                        </FormItem>
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
              )}
              
              {steps.find(s => s.id === currentStep)?.title === 'Exam Center Choice' && watchExamMode === 'offline' && (
                 <>
                    {isLoadingCenters ? <Loader2 className="animate-spin" /> :
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
                    }
                 </>
              )}
               
               {steps.find(s => s.id === currentStep)?.title === 'Upload Documents (Optional)' && (
                 <>
                    <FormField name="photo" control={methods.control} render={({ field: { onChange, ...rest } }) => (
                        <FormItem><FormLabel>Upload Photo (Optional)</FormLabel><FormControl><Input type="file" accept="image/*" onChange={(e) => onChange(e.target.files)} {...rest} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField name="signature" control={methods.control} render={({ field: { onChange, ...rest } }) => (
                        <FormItem><FormLabel>Upload Signature (Optional)</FormLabel><FormControl><Input type="file" accept="image/*" onChange={(e) => onChange(e.target.files)} {...rest} /></FormControl><FormMessage /></FormItem>
                    )} />
                 </>
               )}
               
               {steps.find(s => s.id === currentStep)?.title === 'Payment' && watchExamMode === 'online' && (
                 <div className="space-y-6">
                    <div className="text-sm font-semibold text-center bg-primary/20 p-3 rounded-md border border-primary/30">
                        <p>You need to pay ₹{fee || '...'} as application fee.</p>
                    </div>
                     {settings?.qrCodeImageUrl && (
                            <div className='flex flex-col items-center gap-2'>
                                <Image src={settings.qrCodeImageUrl} alt="Payment QR Code" width={150} height={150} className="rounded-md border p-1"/>
                                <p className="text-xs text-muted-foreground text-center">1. Scan this QR to pay ₹{fee || '...'}</p>
                            </div>
                     )}
                     <FormField
                        control={methods.control}
                        name="paymentMobileNumber"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>2. Enter your 10-digit UPI Mobile Number for verification</FormLabel>
                            <FormControl>
                            <Input type="tel" placeholder="10-Digit Mobile Number" {...field} maxLength={10} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                 </div>
               )}

              {steps.find(s => s.id === currentStep)?.title === 'Review & Submit' && (
                 <div className="space-y-4">
                    <h3 className="font-semibold">Review your application details.</h3>
                    <Card>
                        <CardContent className="p-4 space-y-2 text-sm">
                            {Object.entries(methods.getValues()).map(([key, value]) => {
                                if (value instanceof FileList || typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length === 0) return null;
                                if (value === '' || value === undefined || value === null) return null;
                                const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
                                const file = value instanceof FileList ? value[0]?.name : String(value);

                                return (
                                    <div key={key} className="flex justify-between">
                                        <span className="font-medium capitalize">{formattedKey}:</span>
                                        <span>{file}</span>
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
                {currentStep < steps.length ? (
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

    