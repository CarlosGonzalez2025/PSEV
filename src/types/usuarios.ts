/**
 * Roles del sistema RoadWise 360 — PESV Colombia
 * Resolución 40595 de 2022
 *
 * Valores compatibles con los registros existentes en Firestore.
 * No cambiar los valores de los roles sin migrar la base de datos.
 */
export type RolUsuario =
  | 'Superadmin'
  | 'Admin'
  | 'Lider_PESV'
  | 'RRHH'
  | 'Gestor_Flota'
  | 'Conductor'
  | 'Auditor';

export interface RolConfig {
  label: string;
  descripcion: string;
  /** Badge color variant */
  color: 'red' | 'primary' | 'amber' | 'blue' | 'green' | 'slate' | 'purple';
  /** Quién puede crear este rol */
  puedeSerCreadoPor: RolUsuario[];
  /** Módulos con acceso de escritura */
  modulosEscritura: string[];
}

export const ROLES_CONFIG: Record<RolUsuario, RolConfig> = {
  Superadmin: {
    label: 'Super Admin',
    descripcion: 'Acceso total a la plataforma — Solo DateNova',
    color: 'red',
    puedeSerCreadoPor: [],
    modulosEscritura: ['*'],
  },
  Admin: {
    label: 'Admin Tenant',
    descripcion: 'Administrador de la empresa — Gestiona usuarios y toda la organización',
    color: 'primary',
    puedeSerCreadoPor: ['Superadmin'],
    modulosEscritura: ['*'],
  },
  Lider_PESV: {
    label: 'Líder SST / PESV',
    descripcion: 'Responsable del sistema de gestión de seguridad vial',
    color: 'amber',
    puedeSerCreadoPor: ['Superadmin', 'Admin'],
    modulosEscritura: [
      'riesgos', 'rutas', 'inspecciones', 'conductores',
      'capacitaciones', 'auditorias', 'indicadores', 'siniestros',
      'planesAccion', 'politica', 'diagnostico',
    ],
  },
  RRHH: {
    label: 'Recursos Humanos',
    descripcion: 'Gestión de talento humano, formación y competencias viales',
    color: 'blue',
    puedeSerCreadoPor: ['Superadmin', 'Admin'],
    modulosEscritura: ['conductores', 'capacitaciones'],
  },
  Gestor_Flota: {
    label: 'Gestor de Flota',
    descripcion: 'Vehículos, mantenimiento preventivo/correctivo y combustible',
    color: 'green',
    puedeSerCreadoPor: ['Superadmin', 'Admin'],
    modulosEscritura: ['vehiculos', 'mantenimientos', 'combustible', 'inspecciones'],
  },
  Conductor: {
    label: 'Conductor / Actor Vial',
    descripcion: 'Acceso a inspecciones preoperacionales y hoja de vida vial',
    color: 'slate',
    puedeSerCreadoPor: ['Superadmin', 'Admin', 'RRHH'],
    modulosEscritura: ['inspecciones'],
  },
  Auditor: {
    label: 'Auditor',
    descripcion: 'Lectura completa para auditorías internas y externas (sin modificar)',
    color: 'purple',
    puedeSerCreadoPor: ['Superadmin', 'Admin'],
    modulosEscritura: ['auditorias'],
  },
};

/** Roles que un Admin Tenant puede asignar a usuarios de su empresa */
export const ROLES_ASIGNABLES_POR_ADMIN: RolUsuario[] = [
  'Lider_PESV', 'RRHH', 'Gestor_Flota', 'Conductor', 'Auditor',
];

/** Todos los roles excepto Superadmin (para uso en UI de Superadmin) */
export const ROLES_PARA_SUPERADMIN: RolUsuario[] = [
  'Admin', 'Lider_PESV', 'RRHH', 'Gestor_Flota', 'Conductor', 'Auditor',
];

export function getRolesDisponibles(creadorRol: RolUsuario): RolUsuario[] {
  if (creadorRol === 'Superadmin') return ROLES_PARA_SUPERADMIN;
  if (creadorRol === 'Admin') return ROLES_ASIGNABLES_POR_ADMIN;
  if (creadorRol === 'RRHH') return ['Conductor'];
  return [];
}

export function puedeCrearUsuarios(rol: RolUsuario): boolean {
  return ['Superadmin', 'Admin', 'RRHH'].includes(rol);
}
