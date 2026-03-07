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
 * Vincula un usuario a una empresa de forma atómica en ambas ubicaciones.
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

    // 1. Perfil Raíz (Passport)
    batch.set(rootUserRef, payload, { merge: true });

    // 2. Registro Local en Empresa (Denormalizado)
    batch.set(companyUserRef, {
      ...payload,
      asignadoPor: validated.assignedBy,
      fechaCreacion: new Date().toISOString()
    }, { merge: true });

    // 3. Auditoría
    const auditRef = doc(collection(firestore, '_audit_log'));
    batch.set(auditRef, {
      accion: 'user.assigned_to_company',
      targetUid: validated.uid,
      empresaId: validated.empresaId,
      ejecutadoPor: validated.assignedBy,
      fecha: new Date().toISOString()
    });

    await batch.commit();
    return { success: true, message: "Membresía vinculada correctamente en todas las fuentes." };
  } catch (error: any) {
    console.error("Error en assignUserToCompanyAction:", error);
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
          id: userDoc.id,
          empresaId: data.empresaId,
          rol: data.rol || 'Lider_PESV',
          nombreCompleto: data.nombreCompleto || 'Usuario Migrado',
          email: data.email || '',
          estado: 'Activo',
          fechaCreacion: new Date().toISOString(),
          reparadoAuto: true
        });
        await batch.commit();
        repairedCount++;
        log.push(`Reparado: ${data.email} vinculado a Empresa ${data.empresaId}`);
      }
    }

    return { 
      success: true, 
      repairedCount, 
      log,
      message: `Proceso finalizado. ${repairedCount} perfiles restaurados.` 
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Script de sincronización: Estampa empresaId en registros huérfanos.
 */
export async function fixTenantRecordsAction() {
  try {
    const { firestore } = initializeFirebase();
    const empresasSnap = await getDocs(collection(firestore, 'empresas'));
    
    let totalFixed = 0;
    const report: string[] = [];
    const subcollections = [
      'vehiculos', 
      'mantenimientos', 
      'inspeccionesPreoperacionales', 
      'conductores', 
      'rutas', 
      'siniestros',
      'auditorias',
      'indicadoresMedicion',
      'capacitaciones'
    ];

    for (const empDoc of empresasSnap.docs) {
      const empId = empDoc.id;
      let empFixed = 0;

      for (const sub of subcollections) {
        const subSnap = await getDocs(collection(firestore, 'empresas', empId, sub));
        
        for (const recordDoc of subSnap.docs) {
          const data = recordDoc.data();
          if (data.empresaId !== empId) {
            const batch = writeBatch(firestore);
            batch.update(recordDoc.ref, { empresaId: empId });
            await batch.commit();
            empFixed++;
            totalFixed++;
          }
        }
      }
      if (empFixed > 0) report.push(`${empDoc.data().razonSocial}: ${empFixed} registros corregidos.`);
    }

    return { 
      success: true, 
      totalFixed, 
      report,
      message: `Sincronización completada. Total: ${totalFixed} documentos estampados.` 
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}