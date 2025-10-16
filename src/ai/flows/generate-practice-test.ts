'use server';

/**
 * @fileOverview Generates practice tests using AI based on the subject.
 *
 * - generatePracticeTest - A function that generates a practice test.
 * - GeneratePracticeTestInput - The input type for the generatePracticeTest function.
 * - GeneratePracticeTestOutput - The return type for the generatePracticeTest function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePracticeTestInputSchema = z.object({
  subject: z.string().describe('The subject for which to generate the practice test.'),
  numQuestions: z.number().optional().default(10).describe('The number of questions to generate. Defaults to 10.'),
});
export type GeneratePracticeTestInput = z.infer<typeof GeneratePracticeTestInputSchema>;

const GeneratePracticeTestOutputSchema = z.object({
  testQuestions: z.array(z.string()).describe('An array of questions for the practice test.'),
});
export type GeneratePracticeTestOutput = z.infer<typeof GeneratePracticeTestOutputSchema>;

export async function generatePracticeTest(input: GeneratePracticeTestInput): Promise<GeneratePracticeTestOutput> {
  return generatePracticeTestFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePracticeTestPrompt',
  input: {schema: GeneratePracticeTestInputSchema},
  output: {schema: GeneratePracticeTestOutputSchema},
  prompt: `You are a test generator. Generate a practice test for the subject: {{{subject}}}.  The test should have {{{numQuestions}}} questions. Return the questions as a JSON array of strings.

Example:
[
  "Question 1",
  "Question 2",
  "Question 3"
]
`,
});

const generatePracticeTestFlow = ai.defineFlow(
  {
    name: 'generatePracticeTestFlow',
    inputSchema: GeneratePracticeTestInputSchema,
    outputSchema: GeneratePracticeTestOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
