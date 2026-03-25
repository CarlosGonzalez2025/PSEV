import { getApps, initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const PROJECT_ID = process.env.GCLOUD_PROJECT
    || process.env.FIREBASE_PROJECT_ID
    || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    || 'studio-9801675963-9d2a7';

// Este singleton asegura que no instanciemos Firebase Admin multiples veces
// durante los hot-reloads de Next.js.
export function initAdmin() {
    if (getApps().length === 0) {
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            // Opción A: clave de cuenta de servicio explícita en variable de entorno
            try {
                const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                initializeApp({ credential: cert(serviceAccount), projectId: PROJECT_ID });
            } catch (e) {
                console.error("Error parsing FIREBASE_SERVICE_ACCOUNT:", e);
                initializeApp({ projectId: PROJECT_ID });
            }
        } else {
            // Opción B: Application Default Credentials o solo projectId
            try {
                initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
            } catch (e) {
                // En desarrollo local sin gcloud auth, inicializar solo con projectId.
                // Las operaciones Admin que requieran credenciales fallarán individualmente;
                // las que solo necesiten projectId (como Firestore reads via client SDK) seguirán funcionando.
                console.warn("Firebase Admin: applicationDefault() falló. Inicializando solo con projectId.", (e as Error).message);
                initializeApp({ projectId: PROJECT_ID });
            }
        }
    }
}

export function getAdminDb() {
    initAdmin();
    return getFirestore();
}
