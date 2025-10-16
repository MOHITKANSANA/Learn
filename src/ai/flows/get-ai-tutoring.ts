'use server';
/**
 * @fileOverview An AI tutoring agent that answers questions on any subject.
 *
 * - getAiTutoring - A function that answers questions on any subject.
 * - GetAiTutoringInput - The input type for the getAiTutoring function.
 * - GetAiTutoringOutput - The return type for the getAiTutoring function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetAiTutoringInputSchema = z.object({
  question: z.string().describe('The question to be answered by the AI Tutor.'),
});
export type GetAiTutoringInput = z.infer<typeof GetAiTutoringInputSchema>;

const GetAiTutoringOutputSchema = z.object({
  answer: z.string().describe('The answer to the question provided.'),
});
export type GetAiTutoringOutput = z.infer<typeof GetAiTutoringOutputSchema>;

export async function getAiTutoring(input: GetAiTutoringInput): Promise<GetAiTutoringOutput> {
  return getAiTutoringFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getAiTutoringPrompt',
  input: {schema: GetAiTutoringInputSchema},
  output: {schema: GetAiTutoringOutputSchema},
  prompt: `You are an AI Tutor that can answer questions on any subject.

  Question: {{{question}}}
  Answer:`, // Keep as a single line
});

const getAiTutoringFlow = ai.defineFlow(
  {
    name: 'getAiTutoringFlow',
    inputSchema: GetAiTutoringInputSchema,
    outputSchema: GetAiTutoringOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
