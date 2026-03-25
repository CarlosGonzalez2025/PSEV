// DeriveRiskScore - A function that handles the risk scoring process using AI to analyze route and driver data.
// DeriveRiskScoreInput - The input type for the deriveRiskScore function, including route and driver details.
// DeriveRiskScoreOutput - The return type for the deriveRiskScore function, providing a risk score and rationale.

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DeriveRiskScoreInputSchema = z.object({
  routeDescription: z.string().describe('Description of the route, including typical conditions and traffic.'),
  driverStats: z.string().describe('Statistics and history of the driver, including past incidents.'),
  realTimeData: z.string().describe('Real-time data such as weather conditions, traffic alerts, and vehicle telemetry.'),
});
export type DeriveRiskScoreInput = z.infer<typeof DeriveRiskScoreInputSchema>;

const DeriveRiskScoreOutputSchema = z.object({
  riskScore: z.number().describe('The overall risk score for the route and driver, from 0 to 100.'),
  rationale: z.string().describe('The AI reasoning behind the risk score, including key factors.'),
});
export type DeriveRiskScoreOutput = z.infer<typeof DeriveRiskScoreOutputSchema>;

// Este flow ahora es de uso INTERNO para el backend. No se expone directo al cliente.
export const deriveRiskScoreFlowDef = ai.defineFlow(
  {
    name: 'deriveRiskScoreFlow',
    inputSchema: DeriveRiskScoreInputSchema,
    outputSchema: DeriveRiskScoreOutputSchema,
  },
  async input => {
    const { output } = await deriveRiskScorePrompt(input);
    return output!;
  }
);

const deriveRiskScorePrompt = ai.definePrompt({
  name: 'deriveRiskScorePrompt',
  input: { schema: DeriveRiskScoreInputSchema },
  output: { schema: DeriveRiskScoreOutputSchema },
  prompt: `You are an AI safety analyst specializing in risk assessment for commercial transport. Given the following information about a route, a driver, and real-time conditions, derive a risk score from 0 to 100, and provide a brief rationale for the score.\n\nRoute Description: {{{routeDescription}}}\nDriver Statistics: {{{driverStats}}}\nReal-time Data: {{{realTimeData}}}\n\nConsider all factors carefully to provide an accurate risk assessment. Return the risk score and a concise rationale.`, // Improved prompt text
});

// The deriveRiskScoreFlow was moved up and exported securely.
