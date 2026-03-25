---
name: pesv-dev-fullstack
description: >
  Rol de desarrollador fullstack para el proyecto RoadWise 360 (PESV). Usar cuando
  el usuario pida crear features nuevas, páginas, componentes, Server Actions, flujos
  Genkit, importación Excel, o cualquier desarrollo nuevo. Activar también para
  implementar módulos del ciclo PHVA, integrar servicios, construir funcionalidad
  multi-tenant, crear queries Firestore, formularios, tablas de datos, diálogos ShadCN,
  o endpoints de IA. Requiere haber leído pesv-project-standards primero.
---

> **Requiere haber leído `pesv-project-standards` primero.**

# RoadWise 360 — Guía de Desarrollo Fullstack

## Patrón 1 — Página de Dashboard (Template Base)

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

  if (isLoading) return <div className="text-[#616f89]">Cargando...</div>;

  return (/* layout estándar de pesv-project-standards */);
}
```

## Patrón 2 — Escrituras Non-Blocking

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
  { placa: 'ABC123', ...data, empresaId, createdAt: new Date() }
);

// Actualizar
updateDocumentNonBlocking(
  doc(firestore, `empresas/${empresaId}/vehiculos/${id}`),
  { estado: 'Activo' }
);

// Eliminar — siempre precedido de <AlertDialog>
deleteDocumentNonBlocking(
  doc(firestore, `empresas/${empresaId}/vehiculos/${id}`)
);
```

## Patrón 3 — Formulario RHF + Zod + ShadCN

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const schema = z.object({
  placa: z.string().min(6, 'Mínimo 6 caracteres'),
  tipo: z.enum(['MOTO','LIVIANO','CAMION']),
  estado: z.string(),
});
type FormData = z.infer<typeof schema>;

// Dentro del componente:
const form = useForm<FormData>({ resolver: zodResolver(schema) });

const onSubmit = (data: FormData) => {
  addDocumentNonBlocking(colRef, { ...data, empresaId, createdAt: new Date() });
  toast({ title: '✅ Guardado exitosamente' });
  form.reset();
  setOpenDialog(false);
};
```

## Patrón 4 — Flujo de IA con Genkit

```ts
// src/ai/flows/mi-flujo.ts
"use server";
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const InputSchema = z.object({
  campo: z.string().describe('Descripción del campo'),
});
export type MiFlujInput = z.infer<typeof InputSchema>;

const OutputSchema = z.object({
  resultado: z.string().describe('Resultado del análisis'),
  score: z.number().describe('Score de 0 a 100'),
});
export type MiFlujOutput = z.infer<typeof OutputSchema>;

export const miFlujoFlowDef = ai.defineFlow(
  { name: 'miFlujoFlow', inputSchema: InputSchema, outputSchema: OutputSchema },
  async (input) => {
    const { output } = await miFlujoPrompt(input);
    return output!;
  }
);

const miFlujoPrompt = ai.definePrompt({
  name: 'miFlujoPrompt',
  input: { schema: InputSchema },
  output: { schema: OutputSchema },
  prompt: `Eres un experto en seguridad vial colombiana. Analiza: {{{campo}}}`,
});
```

Registrar en `src/ai/dev.ts`:
```ts
import '@/ai/flows/mi-flujo';
```

## Patrón 5 — Carga Masiva Excel

Componente en `src/components/shared/excel-bulk-actions.tsx`:
- Usar `xlsx` (SheetJS) para parsear.
- Validar cada fila con schema Zod antes de escribir a Firestore.
- Exportar plantilla con columnas requeridas nombradas.
- Mostrar resumen: `X filas importadas, Y errores`.

## Mapa de Módulos PHVA

### PLANEAR

| Ruta | Módulo | Colección |
|---|---|---|
| `/dashboard/diagnostico` | Autodiagnóstico Res. 40595 | `empresas/{id}/diagnostico` |
| `/dashboard/politica` | Política y documentos firmados | `empresas/{id}/politica` |
| `/dashboard/riesgos` | Matriz de riesgos 5×5 | `empresas/{id}/riesgos` |
| `/dashboard/rutas` | Rutas y puntos críticos | `empresas/{id}/rutas` |
| `/dashboard/liderazgo` | Liderazgo y comité PESV | `empresas/{id}/liderazgo` |
| `/dashboard/programas-riesgo` | Programas de gestión del riesgo | `empresas/{id}/programas-riesgo` |

### HACER

| Ruta | Módulo | Colección |
|---|---|---|
| `/dashboard/vehiculos` | Flota: SOAT, RTM, alertas | `empresas/{id}/vehiculos` |
| `/dashboard/conductores` | Talento humano, licencias, score | `empresas/{id}/conductores` |
| `/dashboard/inspecciones` | Inspección preoperacional diaria | `empresas/{id}/inspecciones` |
| `/dashboard/mantenimiento` | Preventivo/correctivo | `empresas/{id}/mantenimiento` |
| `/dashboard/formacion` | Cronograma de capacitaciones | `empresas/{id}/formacion` |
| `/dashboard/combustible` | Control de consumo | `empresas/{id}/combustible` |
| `/dashboard/viajes` | Registro de viajes, telemetría | `empresas/{id}/viajes` |
| `/dashboard/contratistas` | Empresas contratistas | `empresas/{id}/contratistas` |
| `/dashboard/emergencias` | Plan de emergencias vial | `empresas/{id}/emergencias` |
| `/dashboard/infraestructura` | Infraestructura vial | `empresas/{id}/infraestructura` |
| `/dashboard/documental` | Gestión documental | `empresas/{id}/documental` |

### VERIFICAR

| Ruta | Módulo |
|---|---|
| `/dashboard/siniestros` | Accidentes + análisis de causas + IA |
| `/dashboard/indicadores` | SISI: 13 indicadores mínimos de ley |
| `/dashboard/auditorias` | Auditorías internas Res. 40595 |

### ACTUAR

| Ruta | Módulo |
|---|---|
| `/dashboard/planes-accion` | No Conformidades + seguimiento |
| `/dashboard/comunicacion` | Comunicación y divulgación |

## Tipos Clave

```ts
type TipoVehiculo =
  | "MOTO" | "LIVIANO" | "FURGON" | "MINIBUS" | "BUS"
  | "CAMION" | "TRACTO" | "AUTOTANQUE" | "MAQUINARIA"
  | "MINICARGADOR" | "GOLF" | "GRUA" | "AMBULANCIA";

// Inspección: src/app/dashboard/(hacer)/inspecciones/schema.ts
// Segmentos: Documental, SeguridadActiva, SeguridadPasiva,
//            Iluminacion, Carroceria, KitCarretera, SegmentosEspecificos
```

## Reglas Firestore (Patrón Base)

```js
match /empresas/{empresaId}/vehiculos/{vehiculoId} {
  allow read, write: if isSignedIn()
    && (isSuperAdmin() || belongsToCompany(empresaId));
}
```

Funciones de utilidad disponibles en `firestore.rules`:
- `isSignedIn()` · `isSuperAdmin()` · `belongsToCompany(empresaId)`
- `isActiveInCompany(empresaId)` · `hasRoleInCompany(empresaId, roles)`
