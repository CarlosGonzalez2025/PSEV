---
name: psev-roadwise360
description: Guía de desarrollo para RoadWise 360, la plataforma SaaS PESV de DateNova. Úsala siempre que trabajes en este proyecto: nuevas páginas, componentes, módulos PESV (Planear/Hacer/Verificar/Actuar), flujos Genkit, reglas Firestore, o cualquier ajuste de código. También actívala cuando el usuario mencione RoadWise, PESV, SISI, conductores, flota, inspecciones, siniestros, o cualquier módulo relacionado con seguridad vial colombiana.
---

# RoadWise 360 — Guía de Desarrollo

Plataforma **SaaS multi-tenant** para la gestión del **Plan Estratégico de Seguridad Vial (PESV)** según la Resolución 40595/2022, articulado con SG-SST.  
Desarrollada por **DateNova** · Repo: `https://github.com/CarlosGonzalez2025/PSEV.git`

---

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

---

## Arquitectura Multi-Tenant

Cada empresa (`tenant`) está aislada por `empresaId` en Firestore:
```
/usuarios/{uid}                          ← Perfil global (Passport)
/invitaciones/{token}                    ← Activación de nuevos clientes
/empresas/{empresaId}                    ← Datos institucionales
/empresas/{empresaId}/usuarios/{uid}     ← Membresía local (Visa)
/empresas/{empresaId}/vehiculos/         ← Flota del tenant
/empresas/{empresaId}/conductores/       ← Conductores del tenant
/empresas/{empresaId}/inspecciones/      ← Registros preoperacionales
/empresas/{empresaId}/siniestros/        ← Accidentes e incidentes
/empresas/{empresaId}/mantenimiento/     ← Servicios preventivos/correctivos
/empresas/{empresaId}/planes-accion/     ← No conformidades
```

**Roles:** `Superadmin` (UID: `I9Al3kS46rcTAbylTHgufUFke8b2`, acceso a `/admin`) · `Admin` · `Usuario`

---

## Estructura de Directorios
```
src/
├── actions/           ← Server Actions (Next.js)
│   └── usuarios/
├── ai/
│   ├── genkit.ts      ← Configuración Genkit
│   ├── dev.ts         ← Entry point para `genkit:dev`
│   └── flows/         ← Flujos de IA (Server Actions marcados "use server")
│       ├── derive-risk-score.ts
│       ├── suggest-personnel.ts
│       └── summarize-incident-report.ts
├── app/               ← Next.js App Router
│   ├── login/         ← Autenticación pública
│   ├── activar/       ← Activación de cuenta por token
│   ├── admin/         ← Panel Superadmin
│   └── dashboard/     ← Módulos PESV (protegidos por AuthGuard)
│       ├── layout.tsx
│       ├── page.tsx   ← KPIs principales
│       ├── vehiculos/
│       ├── conductores/
│       ├── inspecciones/
│       ├── mantenimiento/
│       ├── siniestros/
│       ├── riesgos/
│       ├── indicadores/   ← SISI (13 indicadores de ley)
│       ├── auditorias/
│       ├── planes-accion/
│       ├── formacion/
│       ├── rutas/
│       ├── politica/
│       ├── combustible/
│       ├── diagnostico/
│       └── configuracion/
├── components/
│   ├── auth/
│   │   └── auth-guard.tsx
│   ├── navigation/
│   │   ├── sidebar.tsx
│   │   └── header.tsx
│   ├── dashboard/         ← Widgets reutilizables del dashboard
│   │   ├── kpi-card.tsx
│   │   ├── alerts-widget.tsx
│   │   ├── compliance-chart.tsx
│   │   ├── map-widget.tsx
│   │   └── maintenance-progress.tsx
│   └── ui/                ← ShadCN (NO modificar)
├── firebase/
│   ├── index.ts           ← Exports centrales
│   ├── config.ts
│   ├── provider.tsx       ← FirebaseProvider (contexto global)
│   ├── client-provider.tsx
│   ├── non-blocking-updates.tsx  ← Writes sin await
│   ├── non-blocking-login.tsx
│   ├── error-emitter.ts
│   ├── errors.ts
│   └── firestore/
│       ├── use-collection.tsx  ← Hook reactivo para colecciones
│       └── use-doc.tsx         ← Hook reactivo para documentos
├── hooks/
│   ├── use-toast.ts
│   └── use-mobile.tsx
└── lib/
    └── utils.ts
```

---

## Patrones de Código Obligatorios

### 1. Páginas del Dashboard
```tsx
'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';

export default function MiModuloPage() {
  const { firestore } = useFirestore();
  const { profile } = useUser();

  // SIEMPRE memoizar la query para evitar re-renders infinitos
  const itemsQuery = useMemo(() => {
    if (!firestore || !profile?.empresaId) return null;
    return query(
      collection(firestore, `empresas/${profile.empresaId}/miColeccion`),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, profile?.empresaId]);

  const { data: items, isLoading } = useCollection(itemsQuery);

  // ...render
}
```

### 2. Escrituras a Firestore (Non-Blocking)
```tsx
import {
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking
} from '@/firebase/non-blocking-updates';
import { collection, doc } from 'firebase/firestore';

// Crear
addDocumentNonBlocking(
  collection(firestore, `empresas/${empresaId}/vehiculos`),
  { placa: 'ABC123', ...data, createdAt: new Date() }
);

// Actualizar
updateDocumentNonBlocking(
  doc(firestore, `empresas/${empresaId}/vehiculos/${id}`),
  { estado: 'Activo' }
);

// Eliminar — siempre pedir confirmación con AlertDialog antes
deleteDocumentNonBlocking(
  doc(firestore, `empresas/${empresaId}/vehiculos/${id}`)
);
```

### 3. Formularios con React Hook Form + Zod
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const schema = z.object({
  campo: z.string().min(2, 'Mínimo 2 caracteres'),
});
type FormData = z.infer<typeof schema>;

const form = useForm<FormData>({ resolver: zodResolver(schema) });

const onSubmit = (data: FormData) => {
  addDocumentNonBlocking(colRef, { ...data, empresaId, createdAt: new Date() });
  toast({ title: 'Guardado exitosamente' });
  form.reset();
};
```

### 4. Flujos de IA con Genkit

Los flows van en `src/ai/flows/` y son Server Actions:
```ts
"use server";
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const InputSchema = z.object({ /* ... */ });
const OutputSchema = z.object({ /* ... */ });

export async function miFlow(input: z.infer<typeof InputSchema>) {
  return miFlowDefinition(input);
}

const miFlowDefinition = ai.defineFlow(
  { name: 'miFlow', inputSchema: InputSchema, outputSchema: OutputSchema },
  async (input) => {
    const { output } = await ai.definePrompt({
      name: 'miPrompt',
      input: { schema: InputSchema },
      output: { schema: OutputSchema },
      prompt: `...`
    })(input);
    return output!;
  }
);
```

**Flows existentes:**
- `deriveRiskScore(routeDescription, driverStats, realTimeData)` → `{ riskScore: 0-100, rationale }`
- `suggestPersonnel(...)` → Asignación automática de responsables
- `summarizeIncidentReport(...)` → Resumen de siniestros

---

## Sistema de Diseño

### Paleta de Colores (Dark Theme)
```
--background-dark:  #101622   ← fondo general
--surface-dark:     #1a2234   ← cards y superficies
--border-dark:      #2d3748   ← bordes
--text-secondary:   #616f89   ← texto secundario
--primary:          #135BEC   ← azul principal (confianza)
--accent:           #7D65E8   ← púrpura acento (interactivos)
```

### Tokens de Tailwind Usados
```tsx
// Fondo de página
className="bg-background dark:bg-background-dark"

// Cards/superficies
className="bg-[#1a2234] border border-[#2d3748] rounded-lg"

// Texto secundario
className="text-[#616f89]"

// Badge de estado positivo
<Badge className="bg-green-500/20 text-green-400 border border-green-500/30">Activo</Badge>

// Badge de alerta
<Badge variant="destructive">Vencido</Badge>
```

### Tipografía

- Headlines: `font-headline` (Public Sans)
- Body: `font-body` (Public Sans)
- Código: `font-code` (monospace)

### Layout Estándar de Página
```tsx
<div className="space-y-6">
  {/* Header de página */}
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold font-headline">Título del Módulo</h1>
      <p className="text-[#616f89] text-sm mt-1">Descripción breve</p>
    </div>
    <Button onClick={() => setOpenDialog(true)}>
      <Plus className="mr-2 h-4 w-4" /> Agregar
    </Button>
  </div>

  {/* Contenido principal */}
  <Card className="bg-[#1a2234] border-[#2d3748]">
    <CardHeader>
      <CardTitle>...</CardTitle>
    </CardHeader>
    <CardContent>...</CardContent>
  </Card>
</div>
```

---

## Módulos PESV (Ciclo PHVA)

### PLANEAR
| Ruta | Módulo |
|---|---|
| `/dashboard/diagnostico` | Autodiagnóstico Res. 40595 — Nivel Básico/Estándar/Avanzado |
| `/dashboard/politica` | Política institucional y documentos firmados |
| `/dashboard/riesgos` | Matriz de riesgos 5×5 interactiva |
| `/dashboard/rutas` | Rutas y puntos críticos de siniestralidad |

### HACER
| Ruta | Módulo |
|---|---|
| `/dashboard/vehiculos` | Flota: hoja de vida, SOAT, RTM, alertas de vencimiento |
| `/dashboard/vehiculos/[id]` | Detalle de vehículo con historial |
| `/dashboard/conductores` | Talento humano, licencias, gamificación, score de seguridad |
| `/dashboard/inspecciones` | Preoperacional diario — bloqueo de vehículos no aptos |
| `/dashboard/mantenimiento` | Preventivo/correctivo con trazabilidad de costos |
| `/dashboard/formacion` | Cronograma de capacitaciones y cobertura |
| `/dashboard/combustible` | Control de consumo de combustible |

### VERIFICAR
| Ruta | Módulo |
|---|---|
| `/dashboard/siniestros` | Registro de accidentes + análisis de causas + IA |
| `/dashboard/indicadores` | SISI: 13 indicadores mínimos de ley (Paso 20) |
| `/dashboard/auditorias` | Auditorías internas basadas en Res. 40595 |

### ACTUAR
| Ruta | Módulo |
|---|---|
| `/dashboard/planes-accion` | No Conformidades — responsables — cierre eficaz |

---

## Reglas de Firestore

Las reglas están en `firestore.rules`. Toda escritura/lectura debe validar `empresaId`:
```js
// Patrón base para colecciones de un tenant
match /empresas/{empresaId}/vehiculos/{vehiculoId} {
  allow read, write: if request.auth != null
    && (
      get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol == 'Superadmin'
      || get(/databases/$(database)/documents/empresas/$(empresaId)/usuarios/$(request.auth.uid)).data.empresaId == empresaId
    );
}
```

---

## Convenciones de Desarrollo

1. **Toda página del dashboard** debe estar envuelta en `<AuthGuard>` (ya lo hace el layout).
2. **Queries de Firestore** siempre con `useMemo` — nunca inline.
3. **Writes** siempre con `*NonBlocking` helpers — no usar `await addDoc(...)` directamente en componentes.
4. **Eliminaciones** siempre con `AlertDialog` de confirmación antes de llamar `deleteDocumentNonBlocking`.
5. **Formularios** siempre con RHF + Zod + ShadCN `<Form>` components.
6. **Iconos** solo de `lucide-react` (versión `^0.475.0`).
7. **Toasts** via `import { toast } from '@/hooks/use-toast'`.
8. **No crear nuevas rutas fuera de `/dashboard/`** sin actualizar el `<Sidebar>`.
9. **IA** solo desde flujos en `src/ai/flows/` — no llamar a Genkit directamente desde componentes.
10. **Nuevos módulos** siguen el ciclo PHVA: identificar en qué fase corresponde antes de crear la ruta.

---

## Comandos Útiles
```bash
npm run dev          # Desarrollo en puerto 9002
npm run build        # Build de producción
npm run lint         # ESLint
npm run typecheck    # tsc sin emitir
npm run genkit:dev   # UI de Genkit para probar flows de IA
```

---

## Contexto de Negocio

- **Cliente objetivo:** Empresas colombianas obligadas por Res. 40595/2022 (flotas de transporte, mineras, constructoras, etc.)
- **Producto:** SaaS con modelo de membresía por empresa
- **Onboarding:** Superadmin crea empresa → genera link de activación → cliente crea contraseña
- **Superadmin email:** `info@datenova.io`
- **Branding:** RoadWise 360, desarrollado por DateNova (`https://www.datenova.io`)

---

## PWA Móvil — Inspecciones y Trabajo en Campo

Los módulos que implican captura de datos en campo (inspecciones preoperacionales, registro de siniestros, auditorías, mantenimiento correctivo) deben tener una **vista PWA optimizada para móvil**, separada o condicional respecto a la vista desktop del dashboard.

### Cuándo aplicar esta guía

Activar el modo PWA/móvil cuando el módulo involucre alguno de estos escenarios:
- Inspección preoperacional de vehículos (`/dashboard/inspecciones`)
- Registro de siniestros o incidentes en sitio (`/dashboard/siniestros`)
- Auditorías de campo (`/dashboard/auditorias`)
- Mantenimiento correctivo en taller (`/dashboard/mantenimiento`)
- Cualquier formulario que se llene desde el celular del conductor u operario

---

### Principios de Diseño Móvil / PWA
```
1. Touch-first:     Botones mínimo 48×48px, sin hover states como única interacción
2. Una columna:     Sin grids de más de 1 columna en pantallas < 640px
3. Formularios cortos: Máximo 5-7 campos visibles a la vez — usar pasos (steps)
4. Feedback inmediato: Toast + vibración (navigator.vibrate) al guardar
5. Offline-ready:   Guardar en localStorage si no hay red, sincronizar al volver
6. Cámara/firma:    Acceso nativo a cámara para evidencias fotográficas
```

### Estructura de Componente PWA
```tsx
'use client';

// Detectar si es móvil para renderizar la vista campo
import { useIsMobile } from '@/hooks/use-mobile';

export default function InspeccionesPage() {
  const isMobile = useIsMobile();
  return isMobile ? <InspeccionMovil /> : <InspeccionDesktop />;
}
```

### Layout Base para Vista Móvil
```tsx
// Vista móvil: pantalla completa, sin sidebar, navegación inferior
<div className="flex flex-col min-h-screen bg-[#101622] text-white">

  {/* Header fijo */}
  <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-[#1a2234] border-b border-[#2d3748]">
    <button onClick={onBack} className="p-2 rounded-lg active:bg-white/10">
      <ChevronLeft className="w-5 h-5" />
    </button>
    <h1 className="font-headline font-bold text-base">Inspección Preoperacional</h1>
    <span className="text-xs text-[#616f89]">Paso {step}/{total}</span>
  </header>

  {/* Barra de progreso */}
  <Progress value={(step / total) * 100} className="h-1 rounded-none bg-[#2d3748]" />

  {/* Contenido scrolleable */}
  <main className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
    {/* Campos del formulario */}
  </main>

  {/* Footer fijo con botón de acción principal */}
  <footer className="sticky bottom-0 p-4 bg-[#1a2234] border-t border-[#2d3748]">
    <Button
      className="w-full h-12 text-base font-bold bg-primary active:scale-95 transition-transform"
      onClick={handleNext}
    >
      {isLastStep ? 'Enviar Inspección' : 'Continuar'}
    </Button>
  </footer>

</div>
```

### Patrón Multi-Step para Formularios de Campo
```tsx
// Los formularios de campo se dividen en pasos lógicos:
const PASOS_INSPECCION = [
  { id: 1, titulo: 'Datos del Vehículo',    campos: ['placa', 'kilometraje'] },
  { id: 2, titulo: 'Estado Mecánico',       campos: ['frenos', 'luces', 'llantas'] },
  { id: 3, titulo: 'Estado de Documentos', campos: ['soat', 'rtm', 'licencia'] },
  { id: 4, titulo: 'Evidencia Fotográfica', campos: ['fotos'] },
  { id: 5, titulo: 'Firma del Conductor',   campos: ['firma'] },
];
```

### Captura de Evidencia Fotográfica
```tsx
// Input nativo que abre la cámara en móvil
<label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#2d3748] rounded-xl cursor-pointer active:bg-white/5">
  <Camera className="w-8 h-8 text-[#616f89] mb-2" />
  <span className="text-sm text-[#616f89]">Tomar foto o seleccionar</span>
  <input
    type="file"
    accept="image/*"
    capture="environment"
    className="hidden"
    onChange={handleFoto}
  />
</label>
```

### Manejo Offline (Sincronización Pendiente)
```tsx
// Si el dispositivo no tiene red, guardar localmente
const guardarInspeccion = async (data: InspeccionData) => {
  if (!navigator.onLine) {
    const pendientes = JSON.parse(localStorage.getItem('inspecciones_pendientes') || '[]');
    pendientes.push({ ...data, pendienteSync: true, timestamp: Date.now() });
    localStorage.setItem('inspecciones_pendientes', JSON.stringify(pendientes));
    toast({ title: 'Guardado localmente', description: 'Se sincronizará cuando haya conexión' });
    return;
  }
  addDocumentNonBlocking(colRef, { ...data, createdAt: new Date() });
  toast({ title: '✅ Inspección enviada' });
};

// Al recuperar conexión, sincronizar pendientes
useEffect(() => {
  const sync = async () => {
    const pendientes = JSON.parse(localStorage.getItem('inspecciones_pendientes') || '[]');
    if (pendientes.length === 0) return;
    for (const item of pendientes) {
      addDocumentNonBlocking(colRef, item);
    }
    localStorage.removeItem('inspecciones_pendientes');
  };
  window.addEventListener('online', sync);
  return () => window.removeEventListener('online', sync);
}, []);
```

### Configuración PWA (`public/manifest.json`)
```json
{
  "name": "RoadWise 360",
  "short_name": "RoadWise",
  "description": "Gestión PESV en campo",
  "start_url": "/dashboard/inspecciones",
  "display": "standalone",
  "background_color": "#101622",
  "theme_color": "#135BEC",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Módulos con Vista Móvil Prioritaria

| Módulo | Ruta | Prioridad PWA |
|---|---|---|
| Inspección preoperacional | `/dashboard/inspecciones` | 🔴 Alta — se llena antes de cada turno |
| Registro de siniestros | `/dashboard/siniestros` | 🔴 Alta — se captura en el lugar del hecho |
| Auditorías internas | `/dashboard/auditorias` | 🟡 Media — recorrido por instalaciones |
| Mantenimiento correctivo | `/dashboard/mantenimiento` | 🟡 Media — registro en taller |
| Planes de acción | `/dashboard/planes-accion` | 🟢 Baja — seguimiento, no captura |
