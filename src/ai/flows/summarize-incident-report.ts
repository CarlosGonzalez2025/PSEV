'use server';
/**
 * @fileOverview A Genkit flow that summarizes incident reports using GenAI.
 *
 * - summarizeIncidentReport - A function that summarizes the incident report.
 * - SummarizeIncidentReportInput - The input type for the summarizeIncidentReport function.
 * - SummarizeIncidentReportOutput - The return type for the summarizeIncidentReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeIncidentReportInputSchema = z.object({
  report: z.string().describe('The full text of the incident report.'),
});

export type SummarizeIncidentReportInput = z.infer<typeof SummarizeIncidentReportInputSchema>;

const SummarizeIncidentReportOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the incident report.'),
  keyCauses: z.string().describe('A list of the key causes of the incident.'),
});

export type SummarizeIncidentReportOutput = z.infer<typeof SummarizeIncidentReportOutputSchema>;

export async function summarizeIncidentReport(input: SummarizeIncidentReportInput): Promise<SummarizeIncidentReportOutput> {
  return summarizeIncidentReportFlow(input);
}

const summarizeIncidentReportPrompt = ai.definePrompt({
  name: 'summarizeIncidentReportPrompt',
  input: {schema: SummarizeIncidentReportInputSchema},
  output: {schema: SummarizeIncidentReportOutputSchema},
  prompt: `You are an AI assistant that summarizes incident reports.
  Given the following incident report, provide a concise summary and list the key causes.
  Report: {{{report}}}`,
});

const summarizeIncidentReportFlow = ai.defineFlow(
  {
    name: 'summarizeIncidentReportFlow',
    inputSchema: SummarizeIncidentReportInputSchema,
    outputSchema: SummarizeIncidentReportOutputSchema,
  },
  async input => {
    const {output} = await summarizeIncidentReportPrompt(input);
    return output!;
  }
);
