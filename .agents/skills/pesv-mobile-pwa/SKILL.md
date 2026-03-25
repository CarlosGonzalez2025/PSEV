---
name: pesv-mobile-pwa
description: >
  Patrones de diseño móvil y PWA para módulos de campo del proyecto RoadWise 360.
  Usar cuando el usuario trabaje en inspecciones preoperacionales, registro de
  siniestros en sitio, auditorías de campo, mantenimiento correctivo, o cualquier
  formulario que se llene desde dispositivos móviles. También activar ante menciones
  de: vista móvil, offline, cámara, firma digital, formulario de campo, PWA, touch,
  responsive, campo, taller, conductor en sitio, preoperacional, sin conexión.
---

# RoadWise 360 — Patrones Móvil / PWA

## ¿Cuándo usar vista PWA vs Desktop?

| Módulo | Prioridad |
|---|---|
| Inspección preoperacional (`/dashboard/inspecciones`) | 🔴 Alta |
| Registro de siniestros en sitio (`/dashboard/siniestros`) | 🔴 Alta |
| Auditorías de campo (`/dashboard/auditorias`) | 🟡 Media |
| Mantenimiento correctivo en taller (`/dashboard/mantenimiento`) | 🟡 Media |
| Planes de acción – seguimiento | 🟢 Baja |

## Detección de Dispositivo

```tsx
'use client';
import { useIsMobile } from '@/hooks/use-mobile';

export default function InspeccionesPage() {
  const isMobile = useIsMobile();
  return isMobile ? <InspeccionMovil /> : <InspeccionDesktop />;
}
```

## 6 Principios Touch-First

1. **Touch targets:** Botones mínimo `48×48px`; no depender de hover.
2. **Una columna:** Sin grids de más de 1 columna en pantallas `< 640px`.
3. **Formularios cortos:** Máximo 5-7 campos visibles; usar pasos (wizard).
4. **Feedback inmediato:** Toast + `navigator.vibrate([100])` al guardar.
5. **Offline-ready:** Guardar en `localStorage` si sin red; sincronizar al reconectar.
6. **Cámara/Firma:** Acceso nativo con `<input capture="environment">`.

## Layout Base — Vista Móvil

```tsx
<div className="flex flex-col min-h-screen bg-[#101622] text-white">

  {/* Header fijo */}
  <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3
                     bg-[#1a2234] border-b border-[#2d3748]">
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

  {/* Footer fijo */}
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

## Patrón Multi-Step para Formularios de Campo

```tsx
const PASOS_INSPECCION = [
  { id: 1, titulo: 'Datos del Vehículo',     campos: ['placa', 'kilometraje'] },
  { id: 2, titulo: 'Estado Mecánico',        campos: ['frenos', 'luces', 'llantas'] },
  { id: 3, titulo: 'Estado de Documentos',  campos: ['soat', 'rtm', 'licencia'] },
  { id: 4, titulo: 'Evidencia Fotográfica', campos: ['fotos'] },
  { id: 5, titulo: 'Firma del Conductor',   campos: ['firma'] },
];
```

## Captura Fotográfica (Cámara Nativa)

```tsx
<label className="flex flex-col items-center justify-center w-full h-32
                  border-2 border-dashed border-[#2d3748] rounded-xl
                  cursor-pointer active:bg-white/5">
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

## Manejo Offline + Sincronización

```tsx
const guardarInspeccion = async (data: InspeccionData) => {
  if (!navigator.onLine) {
    const pendientes = JSON.parse(
      localStorage.getItem('inspecciones_pendientes') || '[]'
    );
    pendientes.push({ ...data, pendienteSync: true, timestamp: Date.now() });
    localStorage.setItem('inspecciones_pendientes', JSON.stringify(pendientes));
    toast({ title: 'Guardado localmente', description: 'Se sincronizará al reconectar' });
    return;
  }
  addDocumentNonBlocking(colRef, { ...data, createdAt: new Date() });
  toast({ title: '✅ Inspección enviada' });
  navigator.vibrate?.([100]);
};

// Sincronización automática al recuperar conexión
useEffect(() => {
  const sync = async () => {
    const pendientes = JSON.parse(
      localStorage.getItem('inspecciones_pendientes') || '[]'
    );
    if (!pendientes.length) return;
    for (const item of pendientes) addDocumentNonBlocking(colRef, item);
    localStorage.removeItem('inspecciones_pendientes');
    toast({ title: '☁️ Sincronización completada' });
  };
  window.addEventListener('online', sync);
  return () => window.removeEventListener('online', sync);
}, []);
```

## Configuración PWA (`public/manifest.json`)

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
