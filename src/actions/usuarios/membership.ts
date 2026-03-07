
'use server';

import { z } from 'zod';
import { initializeFirebase } from '@/firebase';
import { 
  doc, 
  writeBatch, 
  getDoc, 
  collection, 
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';

const MembershipInputSchema = z.object({
  uid: z.string(),
  empresaId: z.string(),
  rol: z.enum(['Admin', 'Lider_PESV', 'Conductor', 'Auditor', 'Superadmin']),
  assignedBy: z.string(),
  email: z.string().email(),
  nombreCompleto: z.string()
});

export type MembershipInput = z.infer<typeof MembershipInputSchema>;

/**
 * Vincula un usuario a una empresa de forma atómica (Passport + Visa).
 */
export async function assignUserToCompanyAction(input: MembershipInput) {
  try {
    const validated = MembershipInputSchema.parse(input);
    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);

    const rootUserRef = doc(firestore, 'usuarios', validated.uid);
    const companyUserRef = doc(firestore, 'empresas', validated.empresaId, 'usuarios', validated.uid);

    const payload = {
      id: validated.uid,
      empresaId: validated.empresaId,
      rol: validated.rol,
      nombreCompleto: validated.nombreCompleto,
      email: validated.email,
      estado: 'Activo',
      fechaActualizacion: new Date().toISOString()
    };

    batch.set(rootUserRef, payload, { merge: true });
    batch.set(companyUserRef, {
      ...payload,
      asignadoPor: validated.assignedBy,
      fechaCreacion: new Date().toISOString()
    }, { merge: true });

    const auditRef = doc(collection(firestore, '_audit_log'));
    batch.set(auditRef, {
      accion: 'user.assigned_to_company',
      targetUid: validated.uid,
      empresaId: validated.empresaId,
      ejecutadoPor: validated.assignedBy,
      fecha: new Date().toISOString()
    });

    await batch.commit();
    return { success: true, message: "Membresía vinculada correctamente." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Registra un error de permisos detectado en el cliente para auditoría del Superadmin.
 */
export async function logPermissionErrorAction(input: { uid: string, email: string | null, error: string, profile: any }) {
  try {
    const { firestore } = initializeFirebase();
    await addDoc(collection(firestore, '_audit_errors'), {
      ...input,
      fecha: new Date().toISOString(),
      tipo: 'AuthGuard_Validation_Failure'
    });
    return { success: true };
  } catch (e: any) {
    console.error("Error logging permission error:", e.message);
    return { success: false, message: e.message };
  }
}

/**
 * Script de reparación integral (Fase 3).
 * Sincroniza perfiles raíz con subcolecciones y estampa empresaId.
 */
export async function repairMultitenancyAction() {
  try {
    const { firestore } = initializeFirebase();
    const usersSnap = await getDocs(collection(firestore, 'usuarios'));
    
    let repairedCount = 0;
    const log: string[] = [];

    for (const userDoc of usersSnap.docs) {
      const data = userDoc.data();
      if (!data.empresaId || data.empresaId === 'system') continue;

      // 1. Verificar/Crear Visa (Subcolección)
      const companyUserRef = doc(firestore, 'empresas', data.empresaId, 'usuarios', userDoc.id);
      const companyUserSnap = await getDoc(companyUserRef);

      if (!companyUserSnap.exists()) {
        const batch = writeBatch(firestore);
        batch.set(companyUserRef, {
          ...data,
          fechaCreacion: new Date().toISOString(),
          reparadoAuto: true,
          estado: data.estado || 'Activo'
        });
        await batch.commit();
        repairedCount++;
        log.push(`Visa creada para: ${data.email} en Empresa ${data.empresaId}`);
      }
    }

    return { success: true, repairedCount, log, message: `Proceso finalizado. ${repairedCount} documentos sincronizados.` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Sincroniza el campo empresaId en todos los registros operativos para aislamiento total.
 */
export async function fixTenantRecordsAction() {
  try {
    const { firestore } = initializeFirebase();
    const empresasSnap = await getDocs(collection(firestore, 'empresas'));
    
    let totalFixed = 0;
    const report: string[] = [];
    const subcollections = ['vehiculos', 'mantenimientos', 'inspeccionesPreoperacionales', 'conductores', 'rutas', 'siniestros'];

    for (const empDoc of empresasSnap.docs) {
      const empId = empDoc.id;
      for (const sub of subcollections) {
        const subSnap = await getDocs(collection(firestore, 'empresas', empId, sub));
        for (const recordDoc of subSnap.docs) {
          const data = recordDoc.data();
          if (data.empresaId !== empId) {
            const batch = writeBatch(firestore);
            batch.update(recordDoc.ref, { empresaId: empId });
            await batch.commit();
            totalFixed++;
          }
        }
      }
      report.push(`${empDoc.data().razonSocial}: Sincronizada.`);
    }

    return { success: true, totalFixed, report, message: `Total: ${totalFixed} registros operativos aislados.` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function getUserDiagnosticAction(email: string) {
  try {
    const { firestore } = initializeFirebase();
    const usersRef = collection(firestore, 'usuarios');
    const q = query(usersRef, where('email', '==', email));
    const snap = await getDocs(q);

    if (snap.empty) return { success: false, message: "Usuario no encontrado." };

    const user = snap.docs[0].data();
    const uid = snap.docs[0].id;

    let membership = null;
    if (user.empresaId && user.empresaId !== 'system') {
      const memRef = doc(firestore, 'empresas', user.empresaId, 'usuarios', uid);
      const memSnap = await getDoc(memRef);
      membership = memSnap.exists() ? memSnap.data() : "VISADO FALTANTE";
    }

    return { 
      success: true, 
      data: {
        uid,
        rootProfile: user,
        membershipRecord: membership,
        isConsistent: typeof membership === 'object' && membership !== null && membership.empresaId === user.empresaId
      }
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
