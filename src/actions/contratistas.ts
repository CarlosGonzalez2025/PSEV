"use server"

import { getAdminDb } from "@/firebase/admin";
import { Contratista, GestionCambioVial } from "@/types/contratistas";
import { addDays, isAfter } from "date-fns";
import { Timestamp } from "firebase-admin/firestore";

// Helper for generating tokens
const generateToken = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * Crea un nuevo contratista y genera un token único para el portal.
 */
export async function createContratista(data: Partial<Contratista>, empresaId: string) {
  try {
    const db = getAdminDb();
    const docRef = db.collection("contratistas").doc();
    const id = docRef.id;
    const portalToken = generateToken();
    
    const contratista = {
      ...data,
      id,
      empresaId,
      portalToken,
      estadoAprobacionGeneral: 'Pendiente de revisión',
      creadoEn: Timestamp.now(),
      actualizadoEn: Timestamp.now(),
    };

    await docRef.set(contratista);
    
    return { success: true, data: { ...contratista, id } };
  } catch (error: any) {
    console.error("Error creating contratista:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Devuelve la URL pública del portal de autogestión.
 */
export async function generatePortalLinkAction(portalToken: string) {
  const domain = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:9002";
  return `${domain}/portal/contratista/${portalToken}`;
}

/**
 * Evalúa vigencias de conductores y vehículos para semaforizar al contratista.
 */
export async function calcularEstadoContratista(contratistaId: string) {
  try {
    const db = getAdminDb();
    
    const [conductoresSnap, vehiculosSnap, contratistaSnap] = await Promise.all([
      db.collection("conductoresContratistas").where("contratistaId", "==", contratistaId).get(),
      db.collection("vehiculosContratistas").where("contratistaId", "==", contratistaId).get(),
      db.collection("contratistas").doc(contratistaId).get()
    ]);

    if (!contratistaSnap.exists) throw new Error("Contratista no encontrado");
    
    const conductores = conductoresSnap.docs.map(d => d.data());
    const vehiculos = vehiculosSnap.docs.map(d => d.data());

    let estado: 'Aprobado' | 'Pendiente de revisión' | 'Bloqueado/Rechazado' = 'Aprobado';
    const hoy = new Date();
    const proximaVencimiento = addDays(hoy, 30);

    // Validar Conductores
    for (const cond of conductores) {
      const vigenciaLicencia = cond.licenciaConduccionVigente?.toDate() || new Date(0);
      if (isAfter(hoy, vigenciaLicencia)) {
        estado = 'Bloqueado/Rechazado';
        break;
      }
      if (isAfter(proximaVencimiento, vigenciaLicencia)) {
        estado = 'Pendiente de revisión';
      }
      if (!cond.aptoParaConducir) {
          estado = 'Bloqueado/Rechazado';
          break;
      }
    }

    if (estado !== 'Bloqueado/Rechazado') {
      // Validar Vehículos
      for (const veh of vehiculos) {
        const soat = veh.vigenciaSOAT?.toDate() || new Date(0);
        const rtm = veh.vigenciaRTM?.toDate() || new Date(0);
        
        if (isAfter(hoy, soat) || isAfter(hoy, rtm)) {
          estado = 'Bloqueado/Rechazado';
          break;
        }
        if (isAfter(proximaVencimiento, soat) || isAfter(proximaVencimiento, rtm)) {
          estado = 'Pendiente de revisión';
        }
        if (!veh.aptoParaRodar) {
            estado = 'Bloqueado/Rechazado';
            break;
        }
      }
    }

    await db.collection("contratistas").doc(contratistaId).update({
      estadoAprobacionGeneral: estado,
      actualizadoEn: Timestamp.now()
    });

    return { success: true, estado };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Hard Stop: Valida si un contratista/vehículo/conductor puede ser despachado.
 */
export async function validarContratistaParaDespacho(contratistaId: string, vehiculoId: string, conductorId: string) {
  try {
    const db = getAdminDb();
    
    const [contratistaSnap, vehiculoSnap, conductorSnap] = await Promise.all([
      db.collection("contratistas").doc(contratistaId).get(),
      db.collection("vehiculosContratistas").doc(vehiculoId).get(),
      db.collection("conductoresContratistas").doc(conductorId).get()
    ]);

    if (!contratistaSnap.exists) return { bloqueado: true, motivo: "Contratista inexistente" };
    const contratista = contratistaSnap.data() as Contratista;

    if (contratista.estadoAprobacionGeneral === 'Bloqueado/Rechazado') {
      return { bloqueado: true, motivo: "El contratista se encuentra BLOQUEADO por incumplimiento documental general." };
    }

    if (vehiculoSnap.exists) {
      const v = vehiculoSnap.data();
      if (!v) return { bloqueado: true, motivo: "Error al leer datos del vehículo" };
      const hoy = new Date();
      if (isAfter(hoy, v.vigenciaSOAT?.toDate() || new Date(0))) return { bloqueado: true, motivo: `El SOAT del vehículo ${v.placa} está VENCIDO.` };
      if (isAfter(hoy, v.vigenciaRTM?.toDate() || new Date(0))) return { bloqueado: true, motivo: `La RTM del vehículo ${v.placa} está VENCIDA.` };
      if (!v.aptoParaRodar) return { bloqueado: true, motivo: `El vehículo ${v.placa} no cuenta con certificación de mantenimiento preventivo vigente.` };
    }

    if (conductorSnap.exists) {
      const c = conductorSnap.data();
      if (!c) return { bloqueado: true, motivo: "Error al leer datos del conductor" };
      const hoy = new Date();
      if (isAfter(hoy, c.licenciaConduccionVigente?.toDate() || new Date(0))) return { bloqueado: true, motivo: `La licencia de conducción de ${c.nombreConductor} está VENCIDA.` };
      if (!c.aptoParaConducir) return { bloqueado: true, motivo: `El conductor ${c.nombreConductor} no cuenta con soportes al día (Seguridad Social o SIMIT).` };
    }

    return { bloqueado: false };
  } catch (error: any) {
    return { bloqueado: true, motivo: "Error interno de validación: " + error.message };
  }
}

/**
 * Registra un evento de Gestión del Cambio y alerta a la Matriz de Riesgos.
 */
export async function createGestionCambio(data: Partial<GestionCambioVial>, empresaId: string) {
  try {
    const db = getAdminDb();
    const docRef = db.collection("gestionCambiosViales").doc();
    const id = docRef.id;
    
    const registro = {
      ...data,
      id,
      empresaId,
      creadoEn: Timestamp.now(),
      actualizadoEn: Timestamp.now(),
    };

    await docRef.set(registro);

    if (registro.requiereActualizarMatrizRiesgos) {
      await db.collection("empresas").doc(empresaId).collection("alertas").add({
        tipo: 'GESTION_CAMBIO_RIESGO',
        mensaje: `Nueva Gestión del Cambio: ${registro.tipoDeCambio}. Requiere revisión de la Matriz de Riesgos (Paso 6).`,
        impacto: registro.impactoSeguridadVial,
        fecha: Timestamp.now(),
        leida: false,
        modulo: 'Paso 6'
      });
    }

    return { success: true, data: { ...registro, id } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Evalúa si un conductor de contratista es apto operativamente.
 */
export async function evaluarAptoParaConducir(conductorId: string) {
    try {
        const db = getAdminDb();
        const docRef = db.collection("conductoresContratistas").doc(conductorId);
        const snap = await docRef.get();
        if (!snap.exists) throw new Error("Conductor no encontrado");
        
        const data = snap.data();
        if (!data) throw new Error("Datos del conductor no encontrados");
        const hoy = new Date();
        const vigenciaLicencia = data.licenciaConduccionVigente?.toDate() || new Date(0);
        
        const apto = isAfter(vigenciaLicencia, hoy) && 
                     !!data.pagoSeguridadSocialMes && 
                     !!data.historialInfracciones;
        
        await docRef.update({ aptoParaConducir: apto, actualizadoEn: Timestamp.now() });
        return { success: true, apto };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Evalúa si un vehículo de contratista es apto operativamente.
 */
export async function evaluarAptoParaRodar(vehiculoId: string) {
    try {
        const db = getAdminDb();
        const docRef = db.collection("vehiculosContratistas").doc(vehiculoId);
        const snap = await docRef.get();
        if (!snap.exists) throw new Error("Vehículo no encontrado");
        
        const data = snap.data();
        if (!data) throw new Error("Datos del vehículo no encontrados");
        const hoy = new Date();
        const soat = data.vigenciaSOAT?.toDate() || new Date(0);
        const rtm = data.vigenciaRTM?.toDate() || new Date(0);
        
        const apto = isAfter(soat, hoy) && 
                     isAfter(rtm, hoy) && 
                     !!data.certificadoMantenimientoPreventivo;
        
        await docRef.update({ aptoParaRodar: apto, actualizadoEn: Timestamp.now() });
        return { success: true, apto };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Busca un contratista por su token de portal (para uso público).
 */
export async function getContratistaByToken(token: string) {
  try {
    const db = getAdminDb();
    const snap = await db.collection("contratistas").where("portalToken", "==", token).get();
    
    if (snap.empty) return { success: false, error: "Link inválido o expirado." };
    
    const data = snap.docs[0].data();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Agrega un conductor desde el portal.
 */
export async function addConductorContratistaAction(data: any) {
  try {
    const db = getAdminDb();
    const docRef = db.collection("conductoresContratistas").doc();
    
    const payload = {
      ...data,
      id: docRef.id,
      creadoEn: Timestamp.now(),
      actualizadoEn: Timestamp.now(),
      // El campo 'aptoParaConducir' debe ser evaluado después de la carga
    };

    await docRef.set(payload);
    
    // Ejecutar evaluación de aptitud inmediatamente si los campos están presentes
    await evaluarAptoParaConducir(docRef.id);
    
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Agrega un vehículo desde el portal.
 */
export async function addVehiculoContratistaAction(data: any) {
  try {
    const db = getAdminDb();
    const docRef = db.collection("vehiculosContratistas").doc();
    
    const payload = {
      ...data,
      id: docRef.id,
      creadoEn: Timestamp.now(),
      actualizadoEn: Timestamp.now(),
    };

    await docRef.set(payload);
    
    // Evaluar aptitud
    await evaluarAptoParaRodar(docRef.id);
    
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Wrapper para ejecutar el flujo OCR de Genkit desde un componente.
 */
import { extractFechaVencimientoDocumento } from "@/ai/ocr-documentos";

export async function processDocumentWithOCR(fileUrl: string, contentType?: string) {
  try {
    // Nota: Los flows de Genkit pueden requerir inicialización o tokens si se ejecutan en ciertos entornos.
    // Aquí invocamos la definición directa.
    const result = await extractFechaVencimientoDocumento({ fileUrl, contentType });
    return { success: true, data: result };
  } catch (error: any) {
    console.error("OCR Error:", error);
    return { success: false, error: "No se pudo procesar el documento con IA." };
  }
}
