import { ai } from './genkit';
import { z } from 'genkit';

/**
 * Flujo de Genkit para extraer la fecha de vencimiento de documentos (SOAT, RTM, Licencia).
 * Utiliza capacidades multimediales de Gemini.
 */
export const extractFechaVencimientoDocumento = ai.defineFlow(
  {
    name: 'extractFechaVencimientoDocumento',
    inputSchema: z.object({ 
      fileUrl: z.string(),
      contentType: z.string().optional() 
    }),
    outputSchema: z.object({
      fechaVencimiento: z.string().nullable(),
      confianza: z.enum(['alta', 'media', 'no_legible']),
    }),
  },
  async (input) => {
    const response = await ai.generate({
      prompt: [
        { text: "Eres un asistente de cumplimiento normativo experto en documentos de tránsito en Colombia (SOAT, Revisión Técnico Mecánica (RTM) y Licencias de Conducción)." },
        { text: "Analiza el documento adjunto y extrae la FECHA DE VENCIMIENTO." },
        { text: "Instrucciones críticas:\n1. Responde ÚNICAMENTE la fecha en formato YYYY-MM-DD.\n2. Si el documento tiene varias fechas, busca la que diga 'Vencimiento', 'Vence', 'Válido hasta' o similar.\n3. Si no puedes leer la fecha o el documento no es claro, responde exactamente: NO_LEGIBLE." },
        { 
          media: { 
            url: input.fileUrl, 
            contentType: input.contentType || 'application/pdf' 
          } 
        }
      ]
    });

    const text = response.text.trim();
    
    if (text.includes('NO_LEGIBLE')) {
      return { fechaVencimiento: null, confianza: 'no_legible' as const };
    }

    // Intentar extraer formato YYYY-MM-DD
    const match = text.match(/\d{4}-\d{2}-\d{2}/);
    
    if (match) {
      return { 
        fechaVencimiento: match[0], 
        confianza: 'alta' as const
      };
    }

    return { 
      fechaVencimiento: null, 
      confianza: 'no_legible' as const
    };
  }
);
