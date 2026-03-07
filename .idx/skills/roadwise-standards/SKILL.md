---
name: roadwise-standards
description: >
  Estándares críticos obligatorios del proyecto RoadWise 360 (PESV/SaaS).
  Usar en CUALQUIER tarea: nuevos módulos, componentes, Server Actions,
  reglas Firestore, flujos Genkit, o cualquier modificación al sistema.
---

# RoadWise 360 — Estándares del Proyecto

## SECCIÓN 1 — IDENTIDAD DEL PROYECTO
- **Nombre:** RoadWise 360 — Sistema Integral de Gestión de Seguridad Vial (PESV)
- **Empresa dueña:** Datnova IO
- **Propósito:** Plataforma SaaS multi-tenant para que empresas colombianas gestionen su Plan Estratégico de Seguridad Vial conforme a la Resolución 40595 de 2022, articulado con SG-SST.
- **Ciclo de gestión:** PHVA (Planear, Hacer, Verificar, Actuar).
- **Stack Tecnológico:**
  - **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS.
  - **Componentes:** ShadCN UI, Lucide React.
  - **Backend:** Firebase Auth, Cloud Firestore.
  - **IA:** Google Genkit (Gemini 2.5 Flash).

## SECCIÓN 2 — ARQUITECTURA MULTI-TENANT (REGLA CRÍTICA)
Todo dato pertenece a una empresa. El aislamiento es la prioridad #1.

**REGLA ABSOLUTA:** Nunca crear consultas Firestore sin filtrar por `empresaId`.
```typescript
// Ejemplo correcto en Cliente
const q = query(collection(db, "empresas", empresaId, "vehiculos"));

// Ejemplo correcto en Servidor (Action)
const snapshot = await adminDb.collection("empresas").doc(empresaId).collection("vehiculos").get();
```

**Estructura de colecciones Firestore:**
- `/usuarios/{uid}` — Perfiles globales y roles (Superadmin, Admin, Conductor, etc.).
- `/invitaciones/{token}` — Tokens temporales para activación de nuevos inquilinos.
- `/empresas/{empresaId}` — Datos institucionales de cada cliente (tenant).
- `/empresas/{empresaId}/vehiculos` — Inventario de flota.
- `/empresas/{empresaId}/conductores` — Talento humano vial.
- `/empresas/{empresaId}/inspeccionesPreoperacionales` — Registros diarios.
- `/empresas/{empresaId}/siniestros` — Gestión de accidentes.
- `/empresas/{empresaId}/mantenimientos` — Servicios técnicos.
- `/empresas/{empresaId}/capacitaciones` — Plan de formación.
- `/empresas/{empresaId}/planesAccion` — No conformidades.
- `/empresas/{empresaId}/auditLogs` — Registro de errores y auditoría por tenant.

**Roles (RBAC):**
- `superadmin`: UID fijo `I9Al3kS46rcTAbylTHgufUFke8b2`. Acceso global a `/admin`.
- `admin`: Administrador de la empresa, acceso total a su tenant.
- `supervisor`: Gestión operativa y reportes.
- `conductor`: Registro de inspecciones y siniestros propios.

## SECCIÓN 3 — SISTEMA DE COLORES (NO MODIFICAR)
Valores extraídos de `globals.css` y `tailwind.config.ts`.

**Propiedades CSS (HSL):**
- `--background`: `240 8% 97%` (Light) / `216 33% 10%` (Dark)
- `--primary`: `223 85% 54%`
- `--surface-dark`: `#1a2234`
- `--border-dark`: `#2d3748`
- `--text-secondary`: `#616f89`

**Reglas de Estilo:**
- Prohibido usar hex/rgb hardcodeado. Usar: `bg-primary`, `text-text-secondary`, `bg-surface-dark`.
- Dark mode obligatorio via clase `.dark`.
- La sidebar usa `bg-card` (en ShadCN) o `bg-surface-dark`.

## SECCIÓN 4 — CONVENCIONES DE CÓDIGO
**Estructura de Carpetas:**
- `src/actions/`: Server Actions con sufijo "Action".
- `src/ai/flows/`: Flujos Genkit con Zod schemas.
- `src/app/dashboard/`: Módulos por fase PHVA.
- `src/app/admin/`: Panel Superadmin.
- `src/components/ui/`: Componentes ShadCN.
- `src/firebase/`: `index.ts` (cliente) y `admin.ts` (servidor).

**Librerías Permitidas:**
- Iconos: `lucide-react`.
- Gráficos: `recharts` (integrado en componentes de ShadCN).
- Formularios: `react-hook-form` + `zod`.

## SECCIÓN 5 — INTELIGENCIA ARTIFICIAL (Genkit)
- **Modelo:** Gemini 2.5 Flash.
- **Uso:** Análisis de riesgos, resúmenes de siniestros, recomendaciones.
- **Invocación:** Siempre desde Server Actions para proteger la `GOOGLE_GENAI_API_KEY`.

## SECCIÓN 6 — MANEJO DE ERRORES (OBLIGATORIO)
**ActionResult Pattern:**
```typescript
export type ActionResult<T = null> =
  | { success: true;  data: T;      error?: never }
  | { success: false; data?: never; error: string; code?: ErrorCode }
```

**Códigos de Error:**
- `VALIDATION_ERROR`, `AUTH_ERROR`, `PERMISSION_DENIED`, `TENANT_MISMATCH`, `NOT_FOUND`, `FIRESTORE_ERROR`, `GENKIT_ERROR`, `INVITATION_ERROR`, `INTERNAL_ERROR`.

## SECCIÓN 7 — AUDITORÍA (Colección `auditLogs`)
Todo fallo crítico se registra en `/empresas/{empresaId}/auditLogs`.
- Campos: `timestamp`, `nivel`, `codigo`, `mensaje`, `usuarioId`, `modulo`, `contexto`.

## SECCIÓN 8 — DOMINIO DE NEGOCIO (Glosario)
- **PESV:** Plan Estratégico de Seguridad Vial.
- **SISI:** Sistema de Información de Seguridad Vial (Supertransporte).
- **Misionalidad:** Actividad principal de la empresa (Transporte vs No Transporte).
- **Preoperacional:** Inspección técnica obligatoria antes de cada jornada.

## SECCIÓN 9 — CHECKLIST ANTES DE CADA COMMIT
- [ ] ¿La query tiene filtro `empresaId`?
- [ ] ¿El `empresaId` viene del servidor (token/perfil)?
- [ ] ¿Usa variables CSS del tema?
- [ ] ¿Compila `npm run build` sin errores?
- [ ] ¿Tiene `error.tsx` y `loading.tsx`?

## SECCIÓN 10 — PROHIBIDO
- Consultar Firestore sin filtrar por `empresaId`.
- Confiar en el `empresaId` enviado desde el cliente.
- Usar colores hardcodeados.
- Lanzar excepciones crudas al cliente desde Server Actions.
- Exponer UIDs sensibles en logs visibles.