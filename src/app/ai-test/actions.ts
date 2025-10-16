'use server';

import { generatePracticeTest } from '@/ai/flows/generate-practice-test';
import { z } from 'zod';

const GenerateTestSchema = z.object({
  subject: z.string().min(3, 'Subject must be at least 3 characters long.'),
  numQuestions: z.coerce.number().min(1, 'Number of questions must be at least 1.').max(20, 'You can generate a maximum of 20 questions.'),
});

type State = {
  testQuestions?: string[];
  error?: string;
  subject?: string;
};

export async function generateTest(prevState: State, formData: FormData): Promise<State> {
  const validatedFields = GenerateTestSchema.safeParse({
    subject: formData.get('subject'),
    numQuestions: formData.get('numQuestions'),
  });

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors;
    return {
      error: errors.subject?.join(', ') || errors.numQuestions?.join(', '),
    };
  }
  
  try {
    const { testQuestions } = await generatePracticeTest(validatedFields.data);
    return { testQuestions, subject: validatedFields.data.subject };
  } catch (error) {
    console.error(error);
    return { error: 'An unexpected error occurred while generating the test. Please try again.' };
  }
}
