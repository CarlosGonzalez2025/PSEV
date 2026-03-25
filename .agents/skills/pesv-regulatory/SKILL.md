---
name: pesv-regulatory
description: >
  Conocimiento regulatorio del PESV colombiano para el proyecto RoadWise 360.
  Usar cuando el usuario pregunte sobre normativa de seguridad vial, la Resolución
  40595 de 2022, los 24 pasos del PESV, niveles de diagnóstico (Básico / Estándar /
  Avanzado), indicadores SISI, cálculo de cumplimiento normativo, auditorías internas,
  inspección preoperacional, matriz de riesgos viales, habilitación de conductores,
  Supertransporte, SG-SST, accidente vial, siniestro, investigación de causas,
  plan de ayuda mutua, comité de seguridad vial, política de seguridad.
---

# RoadWise 360 — Marco Regulatorio PESV Colombia

## Marco Normativo

| Norma | Alcance |
|---|---|
| **Resolución 40595 de 2022** (Min. Transporte) | Requisitos obligatorios del PESV para empresas con flota |
| **Código Nacional de Tránsito** (Ley 769/2002) | Base legal de tránsito y transporte |
| **SG-SST** (Dec. 1072/2015) | Articulación del PESV con el sistema de seguridad laboral |
| Supervisión: **Supertransporte** | Ente que recibe reportes SISI |

## Niveles de Diagnóstico

| Nivel | Criterio |
|---|---|
| **Básico** | 1 a 10 vehículos propios |
| **Estándar** | 11 a 50 vehículos propios |
| **Avanzado** | Más de 50 vehículos o empresa prestadora de transporte |

> En código: `profile.nivel` puede ser `'Básico' | 'Estándar' | 'Avanzado'` para controlar acceso a módulos.

## Los 24 Pasos del PESV (Res. 40595/2022)

### PLANEAR (Pasos 1–9)

| Paso | Nombre | Módulo App |
|---|---|---|
| 1 | Constitución del Comité de Seguridad Vial | `/dashboard/liderazgo` |
| 2 | Definición del responsable del PESV | `/dashboard/liderazgo` |
| 3 | Diagnóstico situacional de seguridad vial | `/dashboard/diagnostico` |
| 4 | Objetivos y metas del PESV | `/dashboard/diagnostico` |
| 5 | Plan de trabajo anual | `/dashboard/plan-trabajo` |
| 6 | Presupuesto asignado | `/dashboard/diagnostico` |
| 7 | Política de seguridad vial | `/dashboard/politica` |
| 8 | Gestión del riesgo vial | `/dashboard/riesgos` |
| 9 | Programas de gestión del riesgo | `/dashboard/programas-riesgo` |

### HACER (Pasos 10–19)

| Paso | Nombre | Módulo App |
|---|---|---|
| 10 | Gestión del talento humano | `/dashboard/conductores` |
| 11 | Habilitación de conductores | `/dashboard/conductores` |
| 12 | Normas y reglamentos internos | `/dashboard/politica` |
| 13 | Mantenimiento vehicular | `/dashboard/mantenimiento` |
| 14 | Dispositivos de seguridad | `/dashboard/vehiculos` |
| 15 | Rutas y puntos críticos de siniestralidad | `/dashboard/rutas` |
| 16 | Gestión de la flota | `/dashboard/vehiculos` |
| 17 | Inspección preoperacional de vehículos | `/dashboard/inspecciones` |
| 18 | Plan de ayuda mutua y atención de emergencias | `/dashboard/emergencias` |
| 19 | Contratistas y proveedores | `/dashboard/contratistas` |

### VERIFICAR (Pasos 20–22)

| Paso | Nombre | Módulo App |
|---|---|---|
| 20 | Indicadores de gestión (SISI) | `/dashboard/indicadores` |
| 21 | Investigación de siniestros viales | `/dashboard/siniestros` |
| 22 | Auditorías internas | `/dashboard/auditorias` |

### ACTUAR (Pasos 23–24)

| Paso | Nombre | Módulo App |
|---|---|---|
| 23 | Acciones correctivas, preventivas y de mejora | `/dashboard/planes-accion` |
| 24 | Revisión por la Alta Dirección | `/dashboard/auditorias` |

## Indicadores SISI — 13 Mínimos de Ley (Paso 20)

Calculados mensualmente y reportados al sistema SISI de Supertransporte:

| # | Indicador | Fórmula |
|---|---|---|
| 1 | Tasa de accidentalidad | (N° accidentes / veh·km) × 10⁶ |
| 2 | Tasa de lesionados | (N° lesionados / veh·km) × 10⁶ |
| 3 | Tasa de muertos | (N° muertos / veh·km) × 10⁶ |
| 4 | Kilometraje total recorrido | Suma km flota |
| 5 | Horas de conducción total | Suma horas operación |
| 6 | N° infracciones de tránsito | Comparendos registrados |
| 7 | Cobertura capacitación | (Capacitados / Total) × 100 |
| 8 | Cobertura mantenimiento preventivo | (Con mtto al día / Total flota) × 100 |
| 9 | Cobertura inspección preoperacional | (Inspecciones realizadas / Requeridas) × 100 |
| 10 | Índice de renovación de flota | (Vehículos nuevos / Total) × 100 |
| 11 | Índice de antigüedad | Promedio de años de los vehículos |
| 12 | Cobertura exámenes médicos | (Con EMO vigente / Total) × 100 |
| 13 | Cobertura licencias vigentes | (Con licencia vigente / Total) × 100 |

## Matriz de Riesgos Viales (5×5)

```
Nivel de Riesgo = Probabilidad (1–5) × Consecuencia (1–5)

1–4:   Riesgo Bajo    → Verde
5–9:   Riesgo Medio   → Amarillo
10–16: Riesgo Alto    → Naranja
17–25: Riesgo Extremo → Rojo
```

**Categorías de riesgo a identificar:** velocidad inadecuada, fatiga, uso de celular,
infraestructura deficiente, condiciones climáticas, estado del vehículo, comportamiento
del peatón, zona de trabajo.

## Inspección Preoperacional — Segmentos Obligatorios (Paso 17)

| Segmento | Descripción |
|---|---|
| **Documental** | Tarjeta propiedad, SOAT, RTM, póliza RC, licencia, tarjeta de operación |
| **Seguridad Activa** | Frenos, dirección, suspensión, llantas, motor |
| **Seguridad Pasiva** | Cinturones, airbags, apoyacabezas, extintor, botiquín |
| **Iluminación** | Luces delanteras, traseras, direccionales, stop |
| **Carrocería** | Estado general, espejos, vidrios, parabrisas |
| **Kit de Carretera** | Triángulos, linterna, llanta de repuesto, herramientas |
| **Segmentos Específicos** | Según tipo (grúa, ambulancia, maquinaria, etc.) |

> **Criterio de bloqueo:** Si `hallazgo.bloqueante === true`, el vehículo NO puede iniciar operaciones hasta que se corrija y se registre la solución.

## Contexto de Negocio

- **Cliente objetivo:** Empresas colombianas con 1+ vehículos propios o contratados (mineras, constructoras, transporte de carga/pasajeros, empresas con flota corporativa).
- **Modelo SaaS:** Membresía mensual/anual por empresa; aislamiento multi-tenant.
- **Onboarding:** Superadmin (`info@datenova.io`) crea empresa → token de activación → cliente define contraseña.
- **Propuesta de valor:** Automatizar los 24 pasos del PESV, generar reportes SISI y acompañar desde el diagnóstico hasta la auditoría externa.
- **Branding:** RoadWise 360, desarrollado por **DateNova** (`https://www.datenova.io`).
