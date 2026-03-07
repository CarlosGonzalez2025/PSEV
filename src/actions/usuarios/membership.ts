'use server';

import { z } from 'zod';
import { initializeFirebase } from '@/firebase';
import { 
  doc, 
  writeBatch, 
  getDoc, 
  collection, 
  getDocs,
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

export async function assignUserToCompanyAction(input: MembershipInput) {
  try {
    const validated = MembershipInputSchema.parse(input);
    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);

    // 1. Verificar permisos del asignador (Simulado para Server Action)
    // En una implementación real, aquí verificaríamos los Custom Claims del contexto de la sesión

    // 2. Referencias
    const rootUserRef = doc(firestore, 'usuarios', validated.uid);
    const companyUserRef = doc(firestore, 'empresas', validated.empresaId, 'usuarios', validated.uid);

    // 3. Escribir atómicamente en ambos nodos
    batch.set(rootUserRef, {
      id: validated.uid,
      empresaId: validated.empresaId,
      rol: validated.rol,
      nombreCompleto: validated.nombreCompleto,
      email: validated.email,
      estado: 'Activo',
      fechaActualizacion: new Date().toISOString()
    }, { merge: true });

    batch.set(companyUserRef, {
      id: validated.uid,
      empresaId: validated.empresaId,
      rol: validated.rol,
      nombreCompleto: validated.nombreCompleto,
      email: validated.email,
      estado: 'Activo',
      asignadoPor: validated.assignedBy,
      fechaCreacion: new Date().toISOString()
    });

    // 4. Log de Auditoría
    const auditRef = doc(collection(firestore, '_audit_log'));
    batch.set(auditRef, {
      accion: 'user.assigned_to_company',
      targetUid: validated.uid,
      empresaId: validated.empresaId,
      ejecutadoPor: validated.assignedBy,
      fecha: new Date().toISOString()
    });

    await batch.commit();
    return { success: true, message: "Usuario vinculado correctamente." };
  } catch (error: any) {
    console.error("Error en assignUserToCompanyAction:", error);
    return { success: false, message: error.message };
  }
}

export async function repairBrokenUsersAction() {
  try {
    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);
    const usersSnap = await getDocs(collection(firestore, 'usuarios'));
    
    let repairedCount = 0;
    const report: string[] = [];

    for (const userDoc of usersSnap.docs) {
      const data = userDoc.data();
      if (!data.empresaId || data.empresaId === 'system') continue;

      const companyUserRef = doc(firestore, 'empresas', data.empresaId, 'usuarios', userDoc.id);
      const companyUserSnap = await getDoc(companyUserRef);

      if (!companyUserSnap.exists()) {
        // Reparar creando el documento de membresía faltante
        batch.set(companyUserRef, {
          ...data,
          fechaCreacion: new Date().toISOString(),
          reparadoAuto: true
        });
        repairedCount++;
        report.push(`Reparado: ${data.email} en empresa ${data.empresaId}`);
      }
    }

    if (repairedCount > 0) {
      await batch.commit();
    }

    return { 
      success: true, 
      repairedCount, 
      report,
      message: `Proceso completado. Se repararon ${repairedCount} perfiles.` 
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}