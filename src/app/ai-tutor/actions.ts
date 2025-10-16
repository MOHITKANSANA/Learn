'use server';

import { getAiTutoring } from '@/ai/flows/get-ai-tutoring';
import { z } from 'zod';

const AskTutorSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters long.'),
});

type State = {
  answer?: string;
  error?: string;
};

export async function askTutor(prevState: State, formData: FormData): Promise<State> {
  const validatedFields = AskTutorSchema.safeParse({
    question: formData.get('question'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.question?.join(', '),
    };
  }
  
  try {
    const { answer } = await getAiTutoring({ question: validatedFields.data.question });
    return { answer };
  } catch (error) {
    console.error(error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
