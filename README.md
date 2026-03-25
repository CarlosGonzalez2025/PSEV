# RoadWise 360 - Sistema Integral de Gestión de Seguridad Vial (PESV)

RoadWise 360 es una plataforma **SaaS (Software as a Service)** de última generación diseñada para que empresas en Colombia gestionen, monitoreen y den cumplimiento al **Plan Estratégico de Seguridad Vial (PESV)**, conforme a la **Resolución 40595 de 2022** y articulado con el **SG-SST**.

## 🚀 Propuesta de Valor
Acompañamos a las organizaciones en todo el ciclo **PHVA** (Planear, Hacer, Verificar, Actuar), automatizando la recolección de datos en campo, el cálculo de indicadores de ley y la gestión de riesgos críticos para reducir la siniestralidad vial..

---

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico
- **Frontend**: [Next.js 15](https://nextjs.org/) (App Router & Turbopack), [React 19](https://react.dev/).
- **Estilo y UI**: [Tailwind CSS](https://tailwindcss.com/), [ShadCN UI](https://ui.shadcn.com/), [Lucide Icons](https://lucide.dev/).
- **Backend & DB**: [Firebase](https://firebase.google.com/) (Authentication, Cloud Firestore).
- **Inteligencia Artificial**: [Google Genkit](https://firebase.google.com/docs/genkit) (Gemini 2.0 Flash) para análisis de riesgos y automatización de reportes.
- **PWA**: Configurado para instalación en dispositivos móviles y soporte offline nativo (IndexedDB Persistence).

### Multi-tenancy & Seguridad
El sistema opera bajo un modelo de **aislamiento estricto por empresa**:
- **Tenant Isolation**: Cada empresa tiene su propio espacio de datos. Un usuario de la "Empresa A" jamás podrá ver registros de la "Empresa B".
- **Reglas de Firestore**: Seguridad validada por el servidor mediante `empresaId`.
- **Acceso Superadmin**: Control centralizado para gestión de clientes e infraestructura (`info@datenova.io`).

---

## 📦 Módulos Implementados (Ciclo PHVA)

### 1. Fase: PLANEAR (P)
Organización y fundamentación del sistema.
- **Paso 5: Diagnóstico**: Línea base de seguridad vial y caracterización de la empresa.
- **Paso 7: Política y Metas**: Gestión documental de políticas institucionales.
- **Paso 8: Gestión de Riesgos**: Matriz interactiva de identificación y valoración de riesgos.
- **Paso 15: Rutas y Puntos Críticos**: Planificación de desplazamientos seguros y geocodificación de riesgos.

### 2. Fase: HACER (H)
Operación diaria y control de riesgos.
- **Paso 16: Gestión de Flota**: Hoja de vida digital de vehículos.
- **Paso 10: Talento Humano**: Gestión de conductores, licencias y perfiles de riesgo.
- **Paso 17: Mantenimiento**: Control preventivo y correctivo de vehículos (vinculado a odómetros).
- **Paso 16: Inspecciones Preoperacionales**: App móvil para revisión diaria de seguridad.
- **Paso 15 & 8: Viajes y Telemetría**: Registro de desplazamientos, fatiga (conducción/descanso) y alertas de telemetría (frenados bruscos, velocidad).
- **Carga Masiva (Excel)**: Importación y exportación de vehículos y conductores mediante plantillas inteligentes con validación Zod.

### 3. Fase: VERIFICAR (V)
Monitoreo de resultados e indicadores.
- **Paso 20: Indicadores SISI**: Cálculo en tiempo real de los 14 indicadores mínimos de ley (Tasa Siniestralidad, Kilometraje, etc.).
- **Paso 21: Auditorías Internas**: Autodiagnóstico anual y verificación de cumplimiento normativo.
- **Investigación de Siniestros**: Registro detallado de accidentes con análisis de causas soportado por IA.

### 4. Fase: ACTUAR (A)
Mejora continua.
- **Planes de Acción**: Gestión de hallazgos, No Conformidades y seguimiento a cierres eficaces.

---

## 🛠️ Estructura del Proyecto

```text
src/
├── app/                      # Next.js App Router
│   ├── dashboard/            # Consola de gestión (PHVA)
│   │   ├── (planear)/        # Pasos 1 a 9
│   │   ├── (hacer)/          # Pasos 10 a 19 (Vehículos, Conductores, Viajes)
│   │   ├── (verificar)/      # Pasos 20 a 22 (Indicadores, Accidentes)
│   │   └── (actuar)/         # Mejora continua
│   ├── admin/                # Panel de control de Superadmin
│   └── (auth)/               # Login y activación de cuentas
├── components/               # UI Components reutilizables (ShadCN)
├── firebase/                 # Configuración de Firestore y Auth
├── lib/                      # Lógica compartida y validaciones
└── utils/                    # Helpers (Excel, fechas, formateo)
```

---

## ⚙️ Estructura de Datos (Firestore)

- `/usuarios/{uid}`: Perfiles globales y roles.
- `/empresas/{empresaId}`: Datos institucionales.
- `/empresas/{empresaId}/vehiculos`: Hoja de vida técnica y legal.
- `/empresas/{empresaId}/conductores`: Información del talento humano vial.
- `/empresas/{empresaId}/inspecciones`: Registros diarios preoperacionales.
- `/empresas/{empresaId}/mantenimientos`: Ordenes de servicio y bitácora.
- `/empresas/{empresaId}/viajes`: Registro transaccional de rutas y telemetría.
- `/empresas/{empresaId}/indicadores`: Consolidado mensual/anual de KPIs.

---

## 🚦 Primeros Pasos para Desarrolladores

1. **Instalación**: `npm install`
2. **Setup**: Configura el `.env` con las credenciales de Firebase de tu proyecto.
3. **Ejecución**: `npm run dev`
4. **Despliegue**: `npm run build`

---
© 2025 RoadWise 360 - Desarrollado por [DateNova](https://www.datenova.io). Todos los derechos reservados.
