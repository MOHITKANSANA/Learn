'use server';
/**
 * @fileOverview An AI agent that provides step-by-step solutions to student doubts.
 *
 * - solveDoubt - A function that takes a student's doubt and returns a solution.
 * - SolveDoubtInput - The input type for the solveDoubt function.
 * - SolveDoubtOutput - The return type for the solveDoubt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SolveDoubtInputSchema = z.object({
  doubtText: z.string().describe("The student's doubt or question."),
});
export type SolveDoubtInput = z.infer<typeof SolveDoubtInputSchema>;

const SolveDoubtOutputSchema = z.object({
  solution: z.string().describe('A step-by-step solution to the doubt.'),
});
export type SolveDoubtOutput = z.infer<typeof SolveDoubtOutputSchema>;

export async function solveDoubt(input: SolveDoubtInput): Promise<SolveDoubtOutput> {
  return solveDoubtFlow(input);
}

const prompt = ai.definePrompt({
  name: 'solveDoubtPrompt',
  input: {schema: SolveDoubtInputSchema},
  output: {schema: SolveDoubtOutputSchema},
  prompt: `You are an expert teacher and doubt solver. A student has asked the following question. Provide a clear, step-by-step solution. Explain the concepts involved simply.

  Student's Doubt: {{{doubtText}}}
  
  Your Solution:`,
});

const solveDoubtFlow = ai.defineFlow(
  {
    name: 'solveDoubtFlow',
    inputSchema: SolveDoubtInputSchema,
    outputSchema: SolveDoubtOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
