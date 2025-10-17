'use server';
/**
 * @fileOverview A general purpose search flow powered by AI.
 *
 * - vidyaSearch - A function that answers general knowledge questions.
 * - VidyaSearchInput - The input type for the vidyaSearch function.
 * - VidyaSearchOutput - The return type for the vidyaSearch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VidyaSearchInputSchema = z.object({
  query: z.string().describe('The search query from the user.'),
});
export type VidyaSearchInput = z.infer<typeof VidyaSearchInputSchema>;

const VidyaSearchOutputSchema = z.object({
  result: z.string().describe('The answer to the user\'s search query.'),
});
export type VidyaSearchOutput = z.infer<typeof VidyaSearchOutputSchema>;

export async function vidyaSearch(input: VidyaSearchInput): Promise<VidyaSearchOutput> {
  return vidyaSearchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'vidyaSearchPrompt',
  input: {schema: VidyaSearchInputSchema},
  output: {schema: VidyaSearchOutputSchema},
  prompt: `You are a helpful search assistant for the "Learn with Munedra" educational platform. Answer the user's query as accurately and concisely as possible.

  User Query: {{{query}}}
  Answer:`,
});

const vidyaSearchFlow = ai.defineFlow(
  {
    name: 'vidyaSearchFlow',
    inputSchema: VidyaSearchInputSchema,
    outputSchema: VidyaSearchOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
