'use client';

import { useFormStatus } from 'react-dom';
import type { State as AITestState } from '@/app/ai-test/actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { BrainCircuit, Loader2 } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating Test...
        </>
      ) : (
        <>
          <BrainCircuit className="mr-2 h-4 w-4" />
          Generate Test
        </>
      )}
    </Button>
  );
}

interface AITestFormProps {
    state: AITestState;
    formAction: (payload: FormData) => void;
}

export function AITestForm({ state, formAction }: AITestFormProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <form action={formAction} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-1">Subject</label>
                <Input
                  id="subject"
                  name="subject"
                  placeholder="e.g., World History"
                  className="text-base"
                  required
                />
              </div>
              <div>
                <label htmlFor="numQuestions" className="block text-sm font-medium mb-1">Number of Questions</label>
                <Input
                  id="numQuestions"
                  name="numQuestions"
                  type="number"
                  placeholder="e.g., 10"
                  defaultValue="10"
                  min="1"
                  max="20"
                  className="text-base"
                  required
                />
              </div>
            </div>
            <SubmitButton />
          </form>
        </CardContent>
      </Card>

      {state.testQuestions && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Your {state.subject} Practice Test</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {state.testQuestions.map((question, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger className="text-left">
                    Question {index + 1}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p>{question}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {state.error && (
         <Card className="bg-destructive/10 border-destructive text-destructive-foreground">
           <CardHeader>
             <CardTitle>Error</CardTitle>
           </CardHeader>
           <CardContent>
            <p>{state.error}</p>
           </CardContent>
        </Card>
      )}
    </div>
  );
}
