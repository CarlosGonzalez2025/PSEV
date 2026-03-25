---
name: pesv-project-standards
description: >
  Estándares críticos y obligatorios para el proyecto RoadWise 360 (PESV, Next.js 15,
  Firebase, Genkit). LEER SIEMPRE antes de cualquier tarea en este proyecto.
  Activar también cuando el usuario mencione: RoadWise, PESV, seguridad vial,
  conductores, flota, vehículos, inspecciones, siniestros, contratistas, norma
  vial colombiana, resolución 40595, cumplimiento normativo, multi-tenant, empresaId,
  tablero de mando, módulo de gestión, ciclo PHVA, indicadores SISI.
---

> **LEER SIEMPRE. Complementar con `pesv-dev-fullstack` para implementación.**

# RoadWise 360 — Estándares del Proyecto

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Estilos | Tailwind CSS v3 + ShadCN UI (Radix) + Lucide React |
| Auth & DB | Firebase Authentication + Cloud Firestore |
| IA | Google Genkit 1.x con Gemini 2.5 Flash |
| Formularios | React Hook Form + Zod |
| Gráficas | Recharts |
| Deploy | Firebase App Hosting (`apphosting.yaml`) |
| Dev port | `9002` (`next dev --turbopack -p 9002`) |

## Arquitectura Multi-Tenant ⚠️ REGLA CRÍTICA

- Aislamiento estricto por `empresaId` en **TODAS** las colecciones de Firestore.
- **Nunca** crear queries sin filtrar por `empresaId`.
- **Roles:** `Superadmin` (UID: `I9Al3kS46rcTAbylTHgufUFke8b2` / email: `info@datenova.io`) · `Admin` · `Usuario`

### Esquema de Colecciones

```
/usuarios/{uid}                           ← Perfil global (Passport)
/invitaciones/{token}                     ← Activación de nuevos clientes
/empresas/{empresaId}                     ← Datos institucionales
/empresas/{empresaId}/usuarios/{uid}      ← Membresía local (Visa)
/empresas/{empresaId}/vehiculos/
/empresas/{empresaId}/conductores/
/empresas/{empresaId}/inspecciones/
/empresas/{empresaId}/siniestros/
/empresas/{empresaId}/mantenimiento/
/empresas/{empresaId}/planes-accion/
/empresas/{empresaId}/indicadores/
/empresas/{empresaId}/viajes/
/empresas/{empresaId}/formacion/
/empresas/{empresaId}/auditorias/
/empresas/{empresaId}/riesgos/
/empresas/{empresaId}/rutas/
```

## Design System — Tokens Obligatorios

```css
/* Paleta RoadWise 360 — NO usar hex hardcodeados inline en cada componente */
--background-dark:  #101622   /* fondo de página (dark) */
--surface:          #1a2234   /* cards / paneles */
--border-dark:      #2d3748   /* bordes */
--text-secondary:   #616f89   /* texto secundario */
--primary:          #135BEC   /* azul principal (confianza) */
--accent:           #7D65E8   /* púrpura acento (interactivos) */
```

**Tipografía:**
- Headlines: `font-headline` (Space Grotesk / Public Sans)
- Body: `font-body` (Inter / Public Sans)

### Layout de Página Dashboard (template obligatorio)

```tsx
<div className="space-y-6">
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold font-headline">Título del Módulo</h1>
      <p className="text-[#616f89] text-sm mt-1">Descripción breve</p>
    </div>
    <Button onClick={() => setOpenDialog(true)}>
      <Plus className="mr-2 h-4 w-4" /> Agregar
    </Button>
  </div>
  <Card className="bg-[#1a2234] border-[#2d3748]">
    <CardHeader><CardTitle>...</CardTitle></CardHeader>
    <CardContent>...</CardContent>
  </Card>
</div>
```

### Badge de Estado

```tsx
<Badge className="bg-green-500/20 text-green-400 border border-green-500/30">Activo</Badge>
<Badge variant="destructive">Vencido</Badge>
```

## Estructura de Directorios

```
src/
├── actions/            ← Server Actions (Next.js)
├── ai/
│   ├── genkit.ts       ← Config Genkit
│   ├── dev.ts          ← Entry point genkit:dev
│   └── flows/          ← Flujos IA ("use server")
├── app/
│   ├── login/ · activar/ · admin/
│   └── dashboard/      ← Módulos PESV (protegidos por AuthGuard)
│       ├── layout.tsx
│       ├── page.tsx    ← KPIs principales
│       ├── (planear)/ · (hacer)/ · (verificar)/ · (actuar)/
│       └── configuracion/
├── components/
│   ├── auth/auth-guard.tsx
│   ├── navigation/sidebar.tsx + header.tsx
│   ├── dashboard/      ← Widgets reutilizables
│   └── ui/             ← ShadCN (NO modificar directamente)
├── firebase/
│   ├── index.ts · config.ts · provider.tsx
│   ├── non-blocking-updates.tsx
│   └── firestore/
│       ├── use-collection.tsx
│       └── use-doc.tsx
└── hooks/use-toast.ts · use-mobile.tsx
```

## Convenciones Obligatorias (Top 10)

1. Toda página del dashboard está bajo `<AuthGuard>` (gestionado por el layout).
2. Queries de Firestore **siempre con `useMemo`** — nunca inline en el render.
3. Writes **siempre con helpers `*NonBlocking`** — nunca `await addDoc(...)` directo en componentes.
4. Eliminaciones precedidas de **`<AlertDialog>` de confirmación**.
5. Formularios **siempre con RHF + Zod + ShadCN `<Form>`**.
6. Iconos **solo de `lucide-react`** (`^0.475.0`).
7. Toasts via `import { toast } from '@/hooks/use-toast'`.
8. **No crear rutas fuera de `/dashboard/`** sin actualizar el `<Sidebar>`.
9. IA **solo desde flujos en `src/ai/flows/`** — nunca llamar Genkit desde componentes.
10. Nuevos módulos: identificar la fase PHVA (Planear/Hacer/Verificar/Actuar) antes de crear la ruta.

## Comandos

```bash
npm run dev          # Puerto 9002 con Turbopack
npm run build        # Build producción
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run genkit:dev   # UI Genkit para probar flows
```
