
'use server';

import { z } from 'zod';
import { getAdminDb } from '@/firebase/admin';

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
 * Usa Admin SDK — no está sujeto a Security Rules.
 */
export async function assignUserToCompanyAction(input: MembershipInput) {
  try {
    const validated = MembershipInputSchema.parse(input);
    const db = getAdminDb();
    const batch = db.batch();

    const payload = {
      id: validated.uid,
      empresaId: validated.empresaId,
      rol: validated.rol,
      nombreCompleto: validated.nombreCompleto,
      email: validated.email,
      estado: 'Activo',
      fechaActualizacion: new Date().toISOString()
    };

    batch.set(db.doc(`usuarios/${validated.uid}`), payload, { merge: true });
    batch.set(db.doc(`empresas/${validated.empresaId}/usuarios/${validated.uid}`), {
      ...payload,
      asignadoPor: validated.assignedBy,
      fechaCreacion: new Date().toISOString()
    }, { merge: true });
    batch.set(db.collection('_audit_log').doc(), {
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
 * Activa una invitación: crea Passport + Visa atómicamente via Admin SDK.
 * Llamado desde /activar después de que el usuario se autentica en el cliente.
 */
export async function activateInvitationAction(uid: string, token: string) {
  try {
    const db = getAdminDb();
    const invRef = db.doc(`invitaciones/${token}`);
    const invSnap = await invRef.get();

    if (!invSnap.exists || invSnap.data()?.usada) {
      return { success: false, message: "Invitación inválida o ya utilizada." };
    }

    const invitation = invSnap.data()!;
    const batch = db.batch();

    const payload = {
      id: uid,
      empresaId: invitation.empresaId,
      rol: invitation.rol,
      nombreCompleto: invitation.nombreCompleto,
      email: invitation.email,
      estado: 'Activo'
    };

    // Passport (perfil global)
    batch.set(db.doc(`usuarios/${uid}`), {
      ...payload,
      fechaActualizacion: new Date().toISOString()
    }, { merge: true });

    // Visa (membresía de empresa)
    batch.set(db.doc(`empresas/${invitation.empresaId}/usuarios/${uid}`), {
      ...payload,
      fechaCreacion: new Date().toISOString()
    }, { merge: true });

    // Consumir invitación
    batch.update(invRef, {
      usada: true,
      fechaActivacion: new Date().toISOString(),
      usuarioUid: uid
    });

    await batch.commit();
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Registra un error de permisos detectado en el cliente para auditoría.
 */
export async function logPermissionErrorAction(input: { uid: string, email: string | null, error: string, profile: any }) {
  try {
    const db = getAdminDb();
    await db.collection('_audit_errors').add({
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
 * Sincroniza perfiles globales (Passport) con subcolecciones de empresa (Visa).
 */
export async function repairMultitenancyAction() {
  try {
    const db = getAdminDb();
    const usersSnap = await db.collection('usuarios').get();

    let repairedCount = 0;
    const log: string[] = [];

    // Passport -> Visa
    for (const userDoc of usersSnap.docs) {
      const data = userDoc.data();
      if (!data.empresaId || data.empresaId === 'system') continue;

      const companyUserRef = db.doc(`empresas/${data.empresaId}/usuarios/${userDoc.id}`);
      const companyUserSnap = await companyUserRef.get();

      if (!companyUserSnap.exists) {
        const batch = db.batch();
        batch.set(companyUserRef, {
          ...data,
          fechaCreacion: new Date().toISOString(),
          reparadoAuto: true,
          estado: data.estado || 'Activo'
        });
        await batch.commit();
        repairedCount++;
        log.push(`Visa creada: ${data.email} en Empresa ${data.empresaId}`);
      }
    }

    // Visa -> Passport
    const empresasSnap = await db.collection('empresas').get();
    for (const empDoc of empresasSnap.docs) {
      const visasSnap = await db.collection(`empresas/${empDoc.id}/usuarios`).get();
      for (const visaDoc of visasSnap.docs) {
        const visaData = visaDoc.data();
        const rootRef = db.doc(`usuarios/${visaDoc.id}`);
        const rootSnap = await rootRef.get();

        if (!rootSnap.exists || rootSnap.data()?.empresaId !== empDoc.id) {
          const batch = db.batch();
          batch.set(rootRef, {
            ...visaData,
            empresaId: empDoc.id,
            fechaActualizacion: new Date().toISOString()
          }, { merge: true });
          await batch.commit();
          repairedCount++;
          log.push(`Passport reparado: ${visaData.email} vinculado a ${empDoc.id}`);
        }
      }
    }

    return { success: true, repairedCount, log, message: `Proceso finalizado. ${repairedCount} documentos sincronizados.` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Estampa empresaId en todos los registros operativos para aislamiento total.
 */
export async function fixTenantRecordsAction() {
  try {
    const db = getAdminDb();
    const empresasSnap = await db.collection('empresas').get();

    let totalFixed = 0;
    const report: string[] = [];
    const subcollections = [
      'vehiculos', 'mantenimientos', 'inspeccionesPreoperacionales', 'conductores',
      'rutas', 'siniestros', 'capacitaciones', 'indicadoresMedicion', 'auditorias', 'planesAccion'
    ];

    for (const empDoc of empresasSnap.docs) {
      const empId = empDoc.id;
      let empFixed = 0;
      for (const sub of subcollections) {
        const subSnap = await db.collection(`empresas/${empId}/${sub}`).get();
        for (const recordDoc of subSnap.docs) {
          const data = recordDoc.data();
          if (data.empresaId !== empId) {
            const batch = db.batch();
            batch.update(recordDoc.ref, {
              empresaId: empId,
              reparadoAuto: true,
              fechaSincronizacion: new Date().toISOString()
            });
            await batch.commit();
            empFixed++;
            totalFixed++;
          }
        }
      }
      if (empFixed > 0) report.push(`${empDoc.data().razonSocial}: ${empFixed} registros reparados.`);
    }

    return { success: true, totalFixed, report, message: `Total: ${totalFixed} registros operativos aislados.` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Diagnostica si un usuario tiene Passport y Visa correctamente configurados.
 */
export async function getUserDiagnosticAction(email: string) {
  try {
    const db = getAdminDb();
    const snap = await db.collection('usuarios').where('email', '==', email).get();

    if (snap.empty) return { success: false, message: "Usuario no encontrado." };

    const user = snap.docs[0].data();
    const uid = snap.docs[0].id;

    let membership = null;
    if (user.empresaId && user.empresaId !== 'system') {
      const memSnap = await db.doc(`empresas/${user.empresaId}/usuarios/${uid}`).get();
      membership = memSnap.exists ? memSnap.data() : "VISADO FALTANTE";
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
