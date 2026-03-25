"use server"

import { deriveRiskScoreFlowDef } from "@/ai/flows/derive-risk-score";
import { z } from "genkit";
import { getAuth } from "firebase-admin/auth";
import { initAdmin } from "@/firebase/admin"; // Asegúrate que Firebase Admin está inicializado.

const DeriveRiskScoreInputSchema = z.object({
    routeDescription: z.string(),
    driverStats: z.string(),
    realTimeData: z.string(),
});

type DeriveRiskScoreInput = z.infer<typeof DeriveRiskScoreInputSchema>;

export async function submitToDeriveRiskScoreFlow(token: string, input: DeriveRiskScoreInput) {
    try {
        // Inicializar app de administrador (se asume que existe src/firebase/admin.ts o equivalente)
        initAdmin();
        const decodedToken = await getAuth().verifyIdToken(token);

        if (!decodedToken) {
            throw new Error("No estás autorizado para usar la Inteligencia Artificial.");
        }

        // Si la validación (bearer token pass) sale bien, ejecutamos la IA.
        const output = await deriveRiskScoreFlowDef(input);
        return { success: true, data: output };

    } catch (err: any) {
        console.error("AI Genkit error:", err);
        return { success: false, error: "Ocurrió un error consultando este flujo." }
    }
}
