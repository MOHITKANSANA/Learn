'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { askTutor } from '@/app/ai-tutor/actions';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Loader2, Send } from 'lucide-react';
import { useEffect, useRef } from 'react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Thinking...
        </>
      ) : (
        <>
          <Send className="mr-2 h-4 w-4" />
          Ask Question
        </>
      )}
    </Button>
  );
}

export function AITutorForm() {
  const [state, formAction] = useFormState(askTutor, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.answer || state.error) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <form ref={formRef} action={formAction} className="space-y-4">
            <Textarea
              name="question"
              placeholder="e.g., Explain the theory of relativity in simple terms."
              className="min-h-[120px] text-base"
              required
            />
            <div className="flex justify-end">
              <SubmitButton />
            </div>
          </form>
        </CardContent>
      </Card>

      {state.answer && (
        <Card className="bg-accent/50 border-accent">
          <CardHeader className="flex flex-row items-center gap-3">
             <Bot className="h-6 w-6 text-accent-foreground" />
             <CardTitle className="font-headline text-accent-foreground">AI Tutor's Answer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{state.answer}</p>
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
