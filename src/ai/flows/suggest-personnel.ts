// src/ai/flows/suggest-personnel.ts
'use server';

/**
 * @fileOverview Suggests personnel best suited to address a given risk based on their skills and the risk score.
 *
 * - suggestPersonnel - A function that suggests personnel for risk mitigation.
 * - SuggestPersonnelInput - The input type for the suggestPersonnel function.
 * - SuggestPersonnelOutput - The return type for the suggestPersonnel function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestPersonnelInputSchema = z.object({
  riskDescription: z.string().describe('Description of the risk to be addressed.'),
  riskScore: z.number().describe('The risk score associated with the risk.'),
  availablePersonnel: z.array(z.string()).describe('List of available personnel.'),
});

export type SuggestPersonnelInput = z.infer<typeof SuggestPersonnelInputSchema>;

const SuggestPersonnelOutputSchema = z.object({
  suggestedPersonnel: z.array(z.string()).describe('List of suggested personnel to address the risk.'),
  reasoning: z.string().describe('The reasoning behind the personnel suggestions.'),
});

export type SuggestPersonnelOutput = z.infer<typeof SuggestPersonnelOutputSchema>;

export async function suggestPersonnel(input: SuggestPersonnelInput): Promise<SuggestPersonnelOutput> {
  return suggestPersonnelFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestPersonnelPrompt',
  input: {schema: SuggestPersonnelInputSchema},
  output: {schema: SuggestPersonnelOutputSchema},
  prompt: `You are an AI assistant that suggests personnel best suited to address a given risk.

Based on the following risk description and score:
Risk Description: {{{riskDescription}}}
Risk Score: {{{riskScore}}}

And the following list of available personnel:
Available Personnel: {{{availablePersonnel}}}

Suggest personnel from the list of available personnel that are best suited to address the risk. Explain your reasoning.

Output:
{{json output}}`,
});

const suggestPersonnelFlow = ai.defineFlow(
  {
    name: 'suggestPersonnelFlow',
    inputSchema: SuggestPersonnelInputSchema,
    outputSchema: SuggestPersonnelOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
