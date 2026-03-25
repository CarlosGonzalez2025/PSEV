// PERFIL MAESTRO DEL CONTRATISTA
export interface Contratista {
  id: string; // UUID auto-generado
  empresaId: string; // multi-tenant
  razonSocialONombre: string;
  nitCedula: string;
  tipoVinculacion: 'Tercerización' | 'Subcontratación' | 'Outsourcing' | 'Intermediación laboral' | 'Flota Fidelizada';
  obligadoImplementarPESV: boolean;
  soportePESVContratista?: string; // URL Firebase Storage (obligatorio si obligadoImplementarPESV=true)
  estadoAprobacionGeneral: 'Aprobado' | 'Pendiente de revisión' | 'Bloqueado/Rechazado'; // calculado
  portalToken: string; // token único para el link público del portal de autogestión
  portalTokenExpiry?: Date;
  creadoEn: Date;
  actualizadoEn: Date;
}

// CONDUCTOR TERCERIZADO
export interface ConductorContratista {
  id: string;
  contratistaId: string;
  empresaId: string;
  nombreConductor: string;
  cedula: string;
  licenciaConduccionVigente: Date; // validar que cubra categoría del vehículo
  categoriaLicencia: string;
  pagoSeguridadSocialMes: string; // URL Firebase Storage (planilla PILA mes corriente)
  historialInfracciones: string; // URL Firebase Storage (certificado SIMIT)
  aptoParaConducir: boolean; // campo calculado automáticamente
  creadoEn: Date;
  actualizadoEn: Date;
}

// VEHÍCULO TERCERIZADO
export interface VehiculoContratista {
  id: string;
  contratistaId: string;
  empresaId: string;
  placa: string;
  tipoVehiculo: string; // dropdown: Automóvil, Camioneta, Camión, Bus, Moto, etc.
  vigenciaSOAT: Date;
  vigenciaRTM: Date;
  certificadoMantenimientoPreventivo: string; // URL Firebase Storage
  aptoParaRodar: boolean; // campo calculado automáticamente
  creadoEn: Date;
  actualizadoEn: Date;
}

// CONTROL OPERATIVO DIARIO
export interface ControlOperativoContratista {
  id: string;
  contratistaId: string;
  conductorId: string;
  empresaId: string;
  preoperacionalTercerosValidado: boolean; // conectado con App Móvil Paso 16
  participacionCapacitaciones: Array<{
    capacitacionId: string;
    nombreCapacitacion: string;
    fecha: Date;
    asistio: boolean;
  }>;
  evaluacionDesempenoContratista: number; // 0-100 (%)
  periodo: string; // 'YYYY-MM'
  creadoEn: Date;
}

// GESTIÓN DEL CAMBIO
export interface GestionCambioVial {
  id: string;
  empresaId: string;
  tipoDeCambio: 'Nueva ruta' | 'Nuevas tecnologías/vehículos' | 'Nueva legislación' | 'Nuevos clientes/servicios';
  descripcionCambio: string;
  impactoSeguridadVial: 'Alto' | 'Medio' | 'Bajo';
  requiereActualizarMatrizRiesgos: boolean; // si true, disparar alerta al Módulo Paso 6
  planAccionId?: string; // UUID enlazado al gestor de tareas
  estado: 'Pendiente' | 'En curso' | 'Cerrado';
  creadoEn: Date;
  actualizadoEn: Date;
}
