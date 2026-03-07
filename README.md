# RoadWise 360 - Sistema Integral de Gestión de Seguridad Vial (PESV)

RoadWise 360 es una plataforma **SaaS (Software as a Service)** diseñada para que múltiples empresas en Colombia gestionen, monitoreen y den cumplimiento al **Plan Estratégico de Seguridad Vial (PESV)**, conforme a la **Resolución 40595 de 2022** y articulado con el **SG-SST**.

## 🚀 Propuesta de Valor
Acompañamos a las organizaciones en todo el ciclo **PHVA** (Planear, Hacer, Verificar, Actuar), automatizando la recolección de datos, el cálculo de indicadores de ley y la gestión de riesgos para reducir la siniestralidad vial.

---

## 🏗️ Arquitectura del Sistema

### Multi-tenancy & Seguridad
El sistema utiliza una arquitectura de **aislamiento de datos por empresa**:
- **Aislamiento Total**: Cada empresa (`tenant`) solo tiene acceso a sus propios datos (Vehículos, Conductores, Inspecciones, etc.).
- **Reglas de Firebase**: La seguridad está garantizada a nivel de base de datos mediante reglas de Firestore que validan el `empresaId` del usuario autenticado.
- **Perfil de Superadmin**: Acceso maestro (`UID: I9Al3kS46rcTAbylTHgufUFke8b2`) para la creación de nuevas empresas y gestión global de la plataforma.

### Tecnologías Utilizadas
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS.
- **Componentes**: ShadCN UI + Lucide React Icons.
- **Backend**: Firebase Authentication & Cloud Firestore.
- **IA**: Google Genkit (Gemini 2.5 Flash) para análisis de riesgos y resúmenes de siniestros.

---

## 📦 Módulos Implementados (Ciclo PHVA)

### 1. Fase: PLANEAR
- **Determinación de Nivel**: Clasificación automática (Básico, Estándar, Avanzado) según misionalidad y tamaño de flota.
- **Política y Metas**: Editor de política institucional y carga de documentos firmados.
- **Matriz de Riesgos**: Visualización interactiva 5x5 para la identificación y valoración de riesgos viales.
- **Rutas y Puntos Críticos**: Mapeo de trayectos seguros y detección de zonas de alta accidentalidad.

### 2. Fase: HACER
- **Gestión de Flota (Paso 16)**: Hoja de vida digital de vehículos con alertas de vencimiento de SOAT y RTM.
- **Talento Humano (Paso 10)**: Directorio de conductores con sistema de gamificación y score de seguridad.
- **Inspecciones Diarias**: Registro preoperacional digital con lógica de bloqueo para vehículos no aptos.
- **Mantenimiento (Paso 17)**: Control de servicios preventivos y correctivos con trazabilidad de costos.
- **Plan de Formación**: Cronograma de capacitaciones y seguimiento de cobertura.

### 3. Fase: VERIFICAR
- **Siniestralidad**: Registro y seguimiento de accidentes con análisis de causas.
- **Indicadores SISI (Paso 20)**: Dashboard con cálculo automático de los 13 indicadores mínimos de ley.
- **Auditorías Internas**: Módulo de autodiagnóstico basado en la Resolución 40595.

### 4. Fase: ACTUAR
- **Planes de Acción**: Gestión de No Conformidades, asignación de responsables y seguimiento de cierres eficaces.

---

## 🔑 Guía para el Superadmin

### Acceso al Panel Maestro
1. Inicie sesión en `/login` con la cuenta de superusuario (`info@datnova.io`).
2. Diríjase a la ruta `/admin` (solo visible para este UID).
3. **Inicializar Perfil**: Si es la primera vez, use el botón "Inicializar Mi Perfil" para registrar su rol de Superadmin en Firestore.

### Registro de Nuevos Clientes (Empresas)
1. En el Panel Maestro, complete los datos de la nueva empresa (NIT, Razón Social).
2. Ingrese el correo del administrador del cliente.
3. El sistema generará un **Link de Activación**.
4. Envíe ese link al cliente. Al abrirlo, el cliente podrá crear su contraseña y activar su instancia privada de RoadWise 360.

---

## 🛠️ Estructura de Datos (Firestore)
- `/usuarios/{uid}`: Perfiles globales y roles (Superadmin, Admin, etc.).
- `/invitaciones/{token}`: Tokens temporales para activación de nuevas empresas.
- `/empresas/{empresaId}`: Datos institucionales de cada cliente.
- `/empresas/{empresaId}/vehiculos`: Inventario de flota del cliente.
- `/empresas/{empresaId}/conductores`: Talento humano vial del cliente.
- `/empresas/{empresaId}/inspeccionesPreoperacionales`: Registros diarios.
- `/empresas/{empresaId}/siniestros`: Gestión de incidentes.

---
© 2024 RoadWise 360 - Datnova IO. Todos los derechos reservados.