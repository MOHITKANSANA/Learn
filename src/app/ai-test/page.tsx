'use client';

import { useActionState } from 'react';
import { AITestForm } from '@/components/ai-test-form';
import { generateTest } from './actions';

export default function AITestPage() {
  const [state, formAction] = useActionState(generateTest, {});

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-headline">AI Test Generator</h1>
        <p className="text-muted-foreground mt-2">
          Create a practice test on any subject to challenge your knowledge.
        </p>
      </div>
      <AITestForm state={state} formAction={formAction} />
    </div>
  );
}
