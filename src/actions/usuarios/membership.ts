
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
  serverTimestamp,
  addDoc
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
 * Vincula un usuario a una empresa de forma atómica.
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
 * Registra un error de permisos para depuración del Superadmin.
 */
export async function logPermissionErrorAction(errorData: any) {
  try {
    const { firestore } = initializeFirebase();
    await addDoc(collection(firestore, '_audit_errors'), {
      ...errorData,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
    });
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

/**
 * Diagnóstico de un usuario específico.
 */
export async function getUserDiagnosticAction(email: string) {
  try {
    const { firestore } = initializeFirebase();
    const usersRef = collection(firestore, 'usuarios');
    const q = query(usersRef, where('email', '==', email));
    const snap = await getDocs(q);

    if (snap.empty) return { success: false, message: "Usuario no encontrado en Firestore." };

    const user = snap.docs[0].data();
    const uid = snap.docs[0].id;

    // Verificar membresía en empresa
    let membership = null;
    if (user.empresaId && user.empresaId !== 'system') {
      const memRef = doc(firestore, 'empresas', user.empresaId, 'usuarios', uid);
      const memSnap = await getDoc(memRef);
      membership = memSnap.exists() ? memSnap.data() : "FALTANTE EN EMPRESA";
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

/**
 * Script de reparación: Sincroniza perfiles inconsistentes.
 */
export async function repairBrokenUsersAction() {
  try {
    const { firestore } = initializeFirebase();
    const usersSnap = await getDocs(collection(firestore, 'usuarios'));
    
    let repairedCount = 0;
    const log: string[] = [];

    for (const userDoc of usersSnap.docs) {
      const data = userDoc.data();
      if (!data.empresaId || data.empresaId === 'system') continue;

      const companyUserRef = doc(firestore, 'empresas', data.empresaId, 'usuarios', userDoc.id);
      const companyUserSnap = await getDoc(companyUserRef);

      if (!companyUserSnap.exists()) {
        const batch = writeBatch(firestore);
        batch.set(companyUserRef, {
          ...data,
          fechaCreacion: new Date().toISOString(),
          reparadoAuto: true
        });
        await batch.commit();
        repairedCount++;
        log.push(`Reparado: ${data.email} vinculado a Empresa ${data.empresaId}`);
      }
    }

    return { success: true, repairedCount, log, message: `Proceso finalizado. ${repairedCount} perfiles restaurados.` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Sincroniza el campo empresaId en todos los registros.
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
          if (recordDoc.data().empresaId !== empId) {
            const batch = writeBatch(firestore);
            batch.update(recordDoc.ref, { empresaId: empId });
            await batch.commit();
            totalFixed++;
          }
        }
      }
      report.push(`${empDoc.data().razonSocial}: Procesada.`);
    }

    return { success: true, totalFixed, report, message: `Total: ${totalFixed} documentos corregidos.` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
