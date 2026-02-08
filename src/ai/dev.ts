import { config } from 'dotenv';
config();

import '@/ai/flows/derive-risk-score.ts';
import '@/ai/flows/summarize-incident-report.ts';
import '@/ai/flows/suggest-personnel.ts';