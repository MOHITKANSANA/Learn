import { AITutorForm } from '@/components/ai-tutor-form';

export default function AITutorPage() {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-headline">AI Tutor</h1>
        <p className="text-muted-foreground mt-2">
          Ask any question on any subject and get an instant answer from your personal AI tutor.
        </p>
      </div>
      <AITutorForm />
    </div>
  );
}
