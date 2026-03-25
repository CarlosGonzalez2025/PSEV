'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    ShieldCheck,
    User,
    Car,
    Map,
    CreditCard,
    AlertTriangle,
    Send,
} from 'lucide-react';

// ─── Firebase init (public — no auth) ────────────────────────────────────────

function getPublicFirestore() {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    return getFirestore(app);
}

// ─── Types ────────────────────────────────────────────────────────────────────

type TipoDocumento = 'CC' | 'CE' | 'PEP' | 'Pasaporte';
type Genero = 'Femenino' | 'Masculino' | 'Otro';
type TipoContrato = 'Término Fijo' | 'Indefinido' | 'Obra/Labor' | 'Prestación de Servicios';
type GrupoSanguineo = 'O+' | 'O-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-';
type RolVial =
    | 'Peatón'
    | 'Pasajero Transporte Público'
    | 'Pasajero Ruta Corporativa'
    | 'Ciclista'
    | 'Motociclista'
    | 'Conductor Vehículo Liviano'
    | 'Conductor Vehículo Pesado';
type FrecuenciaMision = 'Diaria' | 'Semanal' | 'Quincenal' | 'Mensual' | 'Ocasional';
type MedioTransporteMision =
    | 'Vehículo Empresa'
    | 'Vehículo Propio'
    | 'Transporte Público'
    | 'Moto Propia';
type TipoVehiculoPropio =
    | 'Automóvil'
    | 'Camioneta'
    | 'Motocicleta'
    | 'Bicicleta'
    | 'Patineta Eléctrica';
type GravedadSiniestro =
    | 'Solo daños'
    | 'Con heridos leves'
    | 'Con heridos graves'
    | 'Fatalidad';
type CategoriaLicencia = 'A1' | 'A2' | 'B1' | 'B2' | 'B3' | 'C1' | 'C2' | 'C3';
type RiesgoRuta =
    | 'Mal estado de la vía'
    | 'Falta de iluminación'
    | 'Inseguridad/Robos'
    | 'Congestión vehicular'
    | 'Falta de señalización'
    | 'Actores viales imprudentes';

interface SurveyData {
    // Step 1
    nombresCompletos: string;
    tipoDocumento: TipoDocumento | '';
    numeroDocumento: string;
    fechaNacimiento: string;
    genero: Genero | '';
    areaDependencia: string;
    cargo: string;
    tipoContrato: TipoContrato | '';
    grupoSanguineoRh: GrupoSanguineo | '';
    // Step 2
    rolVialPrincipal: RolVial | '';
    municipioResidencia: string;
    distanciaCasaTrabajo: number | '';
    tiempoPromedioTrayecto: number | '';
    desplazamientosMision: boolean | null;
    frecuenciaMision: FrecuenciaMision | '';
    medioTransporteMision: MedioTransporteMision | '';
    // Step 3
    tipoVehiculoPropio: TipoVehiculoPropio | '';
    placaVehiculo: string;
    modeloVehiculo: number | '';
    fechaVencimientoSoat: string;
    fechaVencimientoRtm: string;
    // Step 4
    poseeVigente: boolean | null;
    categoriaLicencia: CategoriaLicencia[];
    fechaVencimientoLicencia: string;
    infraccionesUltimoAnio: boolean | null;
    cantidadInfracciones: number | '';
    siniestrosUltimoAnio: boolean | null;
    gravedadSiniestro: GravedadSiniestro | '';
    // Step 5
    riesgosRutaInItinere: RiesgoRuta[];
    riesgosRutaMision: RiesgoRuta[];
    observacionesSeguridad: string;
}

const initialData: SurveyData = {
    nombresCompletos: '', tipoDocumento: '', numeroDocumento: '',
    fechaNacimiento: '', genero: '', areaDependencia: '', cargo: '',
    tipoContrato: '', grupoSanguineoRh: '',
    rolVialPrincipal: '', municipioResidencia: '', distanciaCasaTrabajo: '',
    tiempoPromedioTrayecto: '', desplazamientosMision: null,
    frecuenciaMision: '', medioTransporteMision: '',
    tipoVehiculoPropio: '', placaVehiculo: '', modeloVehiculo: '',
    fechaVencimientoSoat: '', fechaVencimientoRtm: '',
    poseeVigente: null, categoriaLicencia: [], fechaVencimientoLicencia: '',
    infraccionesUltimoAnio: null, cantidadInfracciones: '',
    siniestrosUltimoAnio: null, gravedadSiniestro: '',
    riesgosRutaInItinere: [], riesgosRutaMision: [],
    observacionesSeguridad: '',
};

const RIESGOS_OPCIONES: RiesgoRuta[] = [
    'Mal estado de la vía',
    'Falta de iluminación',
    'Inseguridad/Robos',
    'Congestión vehicular',
    'Falta de señalización',
    'Actores viales imprudentes',
];

const LICENCIAS: CategoriaLicencia[] = ['A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'];

const STEPS = [
    { id: 1, label: 'Datos Personales', icon: User },
    { id: 2, label: 'Perfil Vial', icon: Map },
    { id: 3, label: 'Vehículo Propio', icon: Car },
    { id: 4, label: 'Licencia e Historial', icon: CreditCard },
    { id: 5, label: 'Percepción del Riesgo', icon: AlertTriangle },
];

function needsVehicleStep(rol: RolVial | ''): boolean {
    return ['Ciclista', 'Motociclista', 'Conductor Vehículo Liviano', 'Conductor Vehículo Pesado'].includes(rol);
}

// ─── Helper: styled field label ───────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
    return (
        <Label className="text-[11px] font-bold uppercase text-gray-500 tracking-widest">
            {children}
        </Label>
    );
}

// ─── Helper: radio yes/no ─────────────────────────────────────────────────────
function YesNoRadio({
    value,
    onChange,
    name,
}: {
    value: boolean | null;
    onChange: (v: boolean) => void;
    name: string;
}) {
    return (
        <div className="flex gap-4">
            {[true, false].map(opt => (
                <label
                    key={String(opt)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all text-sm font-bold ${value === opt
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                        }`}
                >
                    <input
                        type="radio"
                        name={name}
                        value={String(opt)}
                        checked={value === opt}
                        onChange={() => onChange(opt)}
                        className="sr-only"
                    />
                    {opt ? 'Sí' : 'No'}
                </label>
            ))}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SurveyPage() {
    const params = useParams();
    const empresaId = typeof params.empresaId === 'string' ? params.empresaId : '';

    const [step, setStep] = useState(1);
    const [data, setData] = useState<SurveyData>(initialData);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [empresaNombre, setEmpresaNombre] = useState('');
    const [loadingEmpresa, setLoadingEmpresa] = useState(true);

    // Load company name once
    useMemo(() => {
        if (!empresaId) return;
        const db = getPublicFirestore();
        getDoc(doc(db, 'empresas', empresaId))
            .then(snap => {
                if (snap.exists()) {
                    setEmpresaNombre(snap.data()?.nombre ?? snap.data()?.razonSocial ?? '');
                }
            })
            .finally(() => setLoadingEmpresa(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [empresaId]);

    const set = <K extends keyof SurveyData>(key: K, value: SurveyData[K]) => {
        setData(prev => ({ ...prev, [key]: value }));
    };

    const toggleArrayItem = <T extends string>(
        key: keyof SurveyData,
        item: T,
        arr: T[]
    ) => {
        const next = arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
        setData(prev => ({ ...prev, [key]: next }));
    };

    // Effective steps (skip step 3 if not applicable)
    const showVehicleStep = needsVehicleStep(data.rolVialPrincipal);
    const totalSteps = showVehicleStep ? 5 : 4;
    const effectiveSteps = showVehicleStep ? STEPS : STEPS.filter(s => s.id !== 3);
    const currentStepIndex = effectiveSteps.findIndex(s => s.id === step);
    const progressPct = Math.round(((currentStepIndex + 1) / totalSteps) * 100);

    const goNext = () => {
        if (step === 2 && !showVehicleStep) {
            setStep(4);
        } else if (step < 5) {
            setStep(step + 1);
        }
    };

    const goPrev = () => {
        if (step === 4 && !showVehicleStep) {
            setStep(2);
        } else if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleSubmit = async () => {
        if (!empresaId) return;
        setSubmitting(true);
        try {
            const db = getPublicFirestore();
            await addDoc(collection(db, 'empresas', empresaId, 'encuestas_pesv'), {
                ...data,
                empresaId,
                submittedAt: serverTimestamp(),
            });
            setSubmitted(true);
        } catch (err) {
            console.error('Error saving survey:', err);
            alert('Hubo un error al enviar la encuesta. Por favor intenta de nuevo.');
        } finally {
            setSubmitting(false);
        }
    };

    // ─── Success screen ────────────────────────────────────────────────────
    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="size-10 text-emerald-600" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                        ¡Encuesta Enviada!
                    </h1>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Gracias por completar el censo de actores viales. Tu información ayuda a construir
                        un entorno de trabajo más seguro.
                    </p>
                    {empresaNombre && (
                        <Badge className="bg-blue-100 text-blue-700 border-none px-4 py-1">
                            {empresaNombre}
                        </Badge>
                    )}
                    <p className="text-xs text-gray-400 italic">Puedes cerrar esta ventana.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-4">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                            <ShieldCheck className="size-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                Encuesta PESV
                            </p>
                            <p className="text-sm font-black text-gray-800 leading-tight">
                                {loadingEmpresa ? 'Cargando...' : (empresaNombre || 'Censo de Actores Viales')}
                            </p>
                        </div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 border-none text-xs font-bold">
                        Paso {currentStepIndex + 1} de {totalSteps}
                    </Badge>
                </div>
            </header>

            {/* Progress */}
            <div className="bg-white border-b border-gray-100 px-4 py-3">
                <div className="max-w-2xl mx-auto space-y-2">
                    <Progress value={progressPct} className="h-2 bg-gray-100" />
                    <div className="flex justify-between">
                        {effectiveSteps.map((s, idx) => {
                            const Icon = s.icon;
                            const isActive = s.id === step;
                            const isDone = effectiveSteps.findIndex(x => x.id === step) > idx;
                            return (
                                <div key={s.id} className="flex flex-col items-center gap-1 flex-1">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${isDone ? 'bg-emerald-500' : isActive ? 'bg-blue-600' : 'bg-gray-200'}`}>
                                        {isDone
                                            ? <CheckCircle2 className="size-4 text-white" />
                                            : <Icon className={`size-3.5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                                        }
                                    </div>
                                    <span className={`text-[9px] font-bold uppercase hidden sm:block ${isActive ? 'text-blue-600' : isDone ? 'text-emerald-600' : 'text-gray-400'}`}>
                                        {s.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Form body */}
            <main className="flex-1 px-4 py-6">
                <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-6">

                    {/* ── STEP 1: Datos Sociodemográficos ── */}
                    {step === 1 && (
                        <div className="space-y-5">
                            <div>
                                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Datos Personales</h2>
                                <p className="text-sm text-gray-500 mt-1">Información sociodemográfica básica.</p>
                            </div>

                            <div className="space-y-1">
                                <FieldLabel>Nombres Completos *</FieldLabel>
                                <Input value={data.nombresCompletos} onChange={e => set('nombresCompletos', e.target.value)} placeholder="Ej: Juan Carlos Rodríguez Pérez" required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <FieldLabel>Tipo de Documento *</FieldLabel>
                                    <Select value={data.tipoDocumento} onValueChange={v => set('tipoDocumento', v as TipoDocumento)}>
                                        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                        <SelectContent>
                                            {(['CC', 'CE', 'PEP', 'Pasaporte'] as TipoDocumento[]).map(t => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <FieldLabel>Número de Documento *</FieldLabel>
                                    <Input value={data.numeroDocumento} onChange={e => set('numeroDocumento', e.target.value)} placeholder="Ej: 1020304050" required />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <FieldLabel>Fecha de Nacimiento</FieldLabel>
                                    <Input type="date" value={data.fechaNacimiento} onChange={e => set('fechaNacimiento', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <FieldLabel>Género</FieldLabel>
                                    <Select value={data.genero} onValueChange={v => set('genero', v as Genero)}>
                                        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                        <SelectContent>
                                            {(['Femenino', 'Masculino', 'Otro'] as Genero[]).map(g => (
                                                <SelectItem key={g} value={g}>{g}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <FieldLabel>Área / Dependencia</FieldLabel>
                                    <Input value={data.areaDependencia} onChange={e => set('areaDependencia', e.target.value)} placeholder="Ej: Operaciones" />
                                </div>
                                <div className="space-y-1">
                                    <FieldLabel>Cargo</FieldLabel>
                                    <Input value={data.cargo} onChange={e => set('cargo', e.target.value)} placeholder="Ej: Técnico de Mantenimiento" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <FieldLabel>Tipo de Contrato</FieldLabel>
                                    <Select value={data.tipoContrato} onValueChange={v => set('tipoContrato', v as TipoContrato)}>
                                        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                        <SelectContent>
                                            {(['Término Fijo', 'Indefinido', 'Obra/Labor', 'Prestación de Servicios'] as TipoContrato[]).map(t => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <FieldLabel>Grupo Sanguíneo / RH</FieldLabel>
                                    <Select value={data.grupoSanguineoRh} onValueChange={v => set('grupoSanguineoRh', v as GrupoSanguineo)}>
                                        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                        <SelectContent>
                                            {(['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] as GrupoSanguineo[]).map(g => (
                                                <SelectItem key={g} value={g}>{g}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: Perfil Vial ── */}
                    {step === 2 && (
                        <div className="space-y-5">
                            <div>
                                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Perfil Vial</h2>
                                <p className="text-sm text-gray-500 mt-1">¿Cómo te desplazas habitualmente?</p>
                            </div>

                            <div className="space-y-1">
                                <FieldLabel>Rol Vial Principal *</FieldLabel>
                                <Select value={data.rolVialPrincipal} onValueChange={v => set('rolVialPrincipal', v as RolVial)}>
                                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                    <SelectContent>
                                        {([
                                            'Peatón',
                                            'Pasajero Transporte Público',
                                            'Pasajero Ruta Corporativa',
                                            'Ciclista',
                                            'Motociclista',
                                            'Conductor Vehículo Liviano',
                                            'Conductor Vehículo Pesado',
                                        ] as RolVial[]).map(r => (
                                            <SelectItem key={r} value={r}>{r}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <FieldLabel>Municipio de Residencia</FieldLabel>
                                    <Input value={data.municipioResidencia} onChange={e => set('municipioResidencia', e.target.value)} placeholder="Ej: Bogotá" />
                                </div>
                                <div className="space-y-1">
                                    <FieldLabel>Distancia Casa–Trabajo (km)</FieldLabel>
                                    <Input type="number" min={0} value={data.distanciaCasaTrabajo} onChange={e => set('distanciaCasaTrabajo', Number(e.target.value))} placeholder="0" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <FieldLabel>Tiempo Promedio de Trayecto (minutos)</FieldLabel>
                                <Input type="number" min={0} value={data.tiempoPromedioTrayecto} onChange={e => set('tiempoPromedioTrayecto', Number(e.target.value))} placeholder="0" />
                            </div>

                            <div className="space-y-2">
                                <FieldLabel>¿Realiza desplazamientos en misión laboral?</FieldLabel>
                                <YesNoRadio
                                    value={data.desplazamientosMision}
                                    onChange={v => set('desplazamientosMision', v)}
                                    name="desplazamientosMision"
                                />
                            </div>

                            {data.desplazamientosMision === true && (
                                <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                    <div className="space-y-1">
                                        <FieldLabel>Frecuencia en Misión</FieldLabel>
                                        <Select value={data.frecuenciaMision} onValueChange={v => set('frecuenciaMision', v as FrecuenciaMision)}>
                                            <SelectTrigger className="bg-white"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                            <SelectContent>
                                                {(['Diaria', 'Semanal', 'Quincenal', 'Mensual', 'Ocasional'] as FrecuenciaMision[]).map(f => (
                                                    <SelectItem key={f} value={f}>{f}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <FieldLabel>Medio de Transporte en Misión</FieldLabel>
                                        <Select value={data.medioTransporteMision} onValueChange={v => set('medioTransporteMision', v as MedioTransporteMision)}>
                                            <SelectTrigger className="bg-white"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                            <SelectContent>
                                                {(['Vehículo Empresa', 'Vehículo Propio', 'Transporte Público', 'Moto Propia'] as MedioTransporteMision[]).map(m => (
                                                    <SelectItem key={m} value={m}>{m}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── STEP 3: Vehículo Propio (conditional) ── */}
                    {step === 3 && showVehicleStep && (
                        <div className="space-y-5">
                            <div>
                                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Vehículo Propio</h2>
                                <p className="text-sm text-gray-500 mt-1">Información del vehículo que utilizas.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <FieldLabel>Tipo de Vehículo</FieldLabel>
                                    <Select value={data.tipoVehiculoPropio} onValueChange={v => set('tipoVehiculoPropio', v as TipoVehiculoPropio)}>
                                        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                        <SelectContent>
                                            {(['Automóvil', 'Camioneta', 'Motocicleta', 'Bicicleta', 'Patineta Eléctrica'] as TipoVehiculoPropio[]).map(t => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <FieldLabel>Placa del Vehículo</FieldLabel>
                                    <Input value={data.placaVehiculo} onChange={e => set('placaVehiculo', e.target.value.toUpperCase())} placeholder="Ej: ABC123" maxLength={6} />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <FieldLabel>Modelo (Año)</FieldLabel>
                                <Input type="number" min={1980} max={new Date().getFullYear() + 1} value={data.modeloVehiculo} onChange={e => set('modeloVehiculo', Number(e.target.value))} placeholder={String(new Date().getFullYear())} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <FieldLabel>Vencimiento SOAT</FieldLabel>
                                    <Input type="date" value={data.fechaVencimientoSoat} onChange={e => set('fechaVencimientoSoat', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <FieldLabel>Vencimiento RTM / Tecno-mecánica</FieldLabel>
                                    <Input type="date" value={data.fechaVencimientoRtm} onChange={e => set('fechaVencimientoRtm', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 4: Licencia e Historial ── */}
                    {step === 4 && (
                        <div className="space-y-5">
                            <div>
                                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Licencia e Historial Vial</h2>
                                <p className="text-sm text-gray-500 mt-1">Información sobre tu licencia y antecedentes.</p>
                            </div>

                            <div className="space-y-2">
                                <FieldLabel>¿Posees licencia de conducción vigente?</FieldLabel>
                                <YesNoRadio
                                    value={data.poseeVigente}
                                    onChange={v => set('poseeVigente', v)}
                                    name="poseeVigente"
                                />
                            </div>

                            {data.poseeVigente === true && (
                                <div className="space-y-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                    <div className="space-y-2">
                                        <FieldLabel>Categorías de Licencia</FieldLabel>
                                        <div className="flex flex-wrap gap-2">
                                            {LICENCIAS.map(cat => (
                                                <label
                                                    key={cat}
                                                    className={`px-3 py-1.5 rounded-lg border cursor-pointer text-sm font-bold transition-all ${data.categoriaLicencia.includes(cat)
                                                        ? 'bg-blue-600 border-blue-600 text-white'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only"
                                                        checked={data.categoriaLicencia.includes(cat)}
                                                        onChange={() => toggleArrayItem('categoriaLicencia', cat, data.categoriaLicencia)}
                                                    />
                                                    {cat}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <FieldLabel>Fecha de Vencimiento de la Licencia</FieldLabel>
                                        <Input type="date" className="bg-white" value={data.fechaVencimientoLicencia} onChange={e => set('fechaVencimientoLicencia', e.target.value)} />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <FieldLabel>¿Tuvo infracciones de tránsito en el último año?</FieldLabel>
                                <YesNoRadio
                                    value={data.infraccionesUltimoAnio}
                                    onChange={v => set('infraccionesUltimoAnio', v)}
                                    name="infracciones"
                                />
                                {data.infraccionesUltimoAnio === true && (
                                    <div className="space-y-1 mt-2">
                                        <FieldLabel>Cantidad de Infracciones</FieldLabel>
                                        <Input type="number" min={1} value={data.cantidadInfracciones} onChange={e => set('cantidadInfracciones', Number(e.target.value))} placeholder="Ej: 1" />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <FieldLabel>¿Estuvo involucrado en algún siniestro vial el último año?</FieldLabel>
                                <YesNoRadio
                                    value={data.siniestrosUltimoAnio}
                                    onChange={v => set('siniestrosUltimoAnio', v)}
                                    name="siniestros"
                                />
                                {data.siniestrosUltimoAnio === true && (
                                    <div className="space-y-1 mt-2">
                                        <FieldLabel>Gravedad del Siniestro</FieldLabel>
                                        <Select value={data.gravedadSiniestro} onValueChange={v => set('gravedadSiniestro', v as GravedadSiniestro)}>
                                            <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                            <SelectContent>
                                                {(['Solo daños', 'Con heridos leves', 'Con heridos graves', 'Fatalidad'] as GravedadSiniestro[]).map(g => (
                                                    <SelectItem key={g} value={g}>{g}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── STEP 5: Percepción del Riesgo ── */}
                    {step === 5 && (
                        <div className="space-y-5">
                            <div>
                                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Percepción del Riesgo</h2>
                                <p className="text-sm text-gray-500 mt-1">¿Qué factores de riesgo identificas en tus rutas?</p>
                            </div>

                            <div className="space-y-3">
                                <FieldLabel>Riesgos en ruta Casa–Trabajo (In Itinere)</FieldLabel>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {RIESGOS_OPCIONES.map(r => (
                                        <label
                                            key={r}
                                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all text-sm ${data.riesgosRutaInItinere.includes(r)
                                                ? 'bg-blue-50 border-blue-400 text-blue-800'
                                                : 'bg-white border-gray-200 text-gray-600 hover:border-blue-200'
                                                }`}
                                        >
                                            <Checkbox
                                                checked={data.riesgosRutaInItinere.includes(r)}
                                                onCheckedChange={() => toggleArrayItem('riesgosRutaInItinere', r, data.riesgosRutaInItinere)}
                                                className="border-blue-400 data-[state=checked]:bg-blue-600"
                                            />
                                            {r}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {data.desplazamientosMision === true && (
                                <div className="space-y-3">
                                    <FieldLabel>Riesgos en Ruta en Misión Laboral</FieldLabel>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {RIESGOS_OPCIONES.map(r => (
                                            <label
                                                key={r}
                                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all text-sm ${data.riesgosRutaMision.includes(r)
                                                    ? 'bg-indigo-50 border-indigo-400 text-indigo-800'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-200'
                                                    }`}
                                            >
                                                <Checkbox
                                                    checked={data.riesgosRutaMision.includes(r)}
                                                    onCheckedChange={() => toggleArrayItem('riesgosRutaMision', r, data.riesgosRutaMision)}
                                                    className="border-indigo-400 data-[state=checked]:bg-indigo-600"
                                                />
                                                {r}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1">
                                <FieldLabel>Observaciones Adicionales de Seguridad Vial</FieldLabel>
                                <Textarea
                                    value={data.observacionesSeguridad}
                                    onChange={e => set('observacionesSeguridad', e.target.value)}
                                    placeholder="Describe cualquier situación de riesgo adicional que hayas identificado..."
                                    className="min-h-[100px]"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Navigation */}
            <footer className="bg-white border-t border-gray-200 px-4 py-4 sticky bottom-0">
                <div className="max-w-2xl mx-auto flex justify-between items-center gap-4">
                    <Button
                        variant="outline"
                        onClick={goPrev}
                        disabled={step === 1}
                        className="gap-2 font-bold"
                    >
                        <ChevronLeft className="size-4" /> Anterior
                    </Button>

                    <span className="text-xs text-gray-400 font-bold">
                        {currentStepIndex + 1} / {totalSteps}
                    </span>

                    {step < 5 ? (
                        <Button
                            onClick={goNext}
                            disabled={
                                (step === 1 && (!data.nombresCompletos.trim() || !data.numeroDocumento.trim())) ||
                                (step === 2 && !data.rolVialPrincipal)
                            }
                            className="gap-2 bg-blue-600 hover:bg-blue-700 font-bold"
                        >
                            Siguiente <ChevronRight className="size-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="gap-2 bg-emerald-600 hover:bg-emerald-700 font-black uppercase px-6"
                        >
                            <Send className="size-4" />
                            {submitting ? 'Enviando...' : 'Enviar Encuesta'}
                        </Button>
                    )}
                </div>
            </footer>
        </div>
    );
}
