'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser } from '@/firebase';
import {
    doc,
    collection,
    setDoc,
    addDoc,
    deleteDoc,
    updateDoc,
    query,
    orderBy,
    serverTimestamp,
} from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import {
    Building2,
    Users,
    Truck,
    MapPin,
    ShieldAlert,
    BarChart3,
    CheckCircle2,
    AlertCircle,
    Trash2,
    Save,
    Copy,
    Link,
    Plus,
    Info,
    Eye,
    TrendingUp,
    UserCheck,
    FileText,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SedeDoc {
    nombreSede: string;
    ciudadOperacion: string;
    misionalidad: 'TRANSPORTE' | 'DIFERENTE_A_TRANSPORTE';
    servicios: string;
    createdAt?: unknown;
}

interface ActoresDoc {
    peatones: number;
    pasajeros: number;
    ciclistas: number;
    motociclistas: number;
    conductores_directos: number;
}

interface TipoVehiculo {
    tipo: string;
    cantidad: number;
}

interface FlotaDoc {
    vehiculosPropios: number;
    vehiculosTerminos: number;
    vehiculosColaboradores: number;
    desglose: TipoVehiculo[];
}

interface RutaDoc {
    origen: string;
    destino: string;
    kmAproximados: number;
    frecuencia: string;
    conductoresExpuestos: number;
    createdAt?: unknown;
}

interface EmergenciasDoc {
    botiquin: boolean;
    extintor: boolean;
    equipoCarretera: boolean;
    camilla: boolean;
    kitDerrames: boolean;
    colaboradoresCapacitados: number;
    simulacroRealizado: boolean;
    fechaUltimoSimulacro: string;
}

interface LineaBaseDoc {
    anioPeriodo: string;
    siniestrosDanosMateriales: number;
    siniestrosLesionados: number;
    siniestrosFatales: number;
    periodoConsolidado: boolean;
    nivelPesv?: string;
}

interface SurveyResponse {
    id: string;
    nombresCompletos?: string;
    genero?: string;
    cargo?: string;
    areaDependencia?: string;
    rolVialPrincipal?: string;
    municipioResidencia?: string;
    desplazamientosMision?: boolean;
    poseeVigente?: boolean;
    infraccionesUltimoAnio?: boolean;
    cantidadInfracciones?: number;
    siniestrosUltimoAnio?: boolean;
    gravedadSiniestro?: string;
    riesgosRutaInItinere?: string[];
    riesgosRutaMision?: string[];
    observacionesSeguridad?: string;
    submittedAt?: { seconds: number };
}

// ─── Tab Completeness Helper ─────────────────────────────────────────────────

function TabCheck({ complete }: { complete: boolean }) {
    return complete
        ? <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
        : <AlertCircle className="size-3.5 text-amber-400/60 shrink-0" />;
}

const NIVEL_INFO: Record<string, { color: string; label: string; desc: string; modulos: string[] }> = {
    'Básico': {
        color: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
        label: 'Nivel BÁSICO',
        desc: 'Organizaciones con menor exposición al riesgo vial. Requerimientos simplificados y enfocados en competencias esenciales.',
        modulos: ['Liderazgo y política', 'Diagnóstico inicial', 'Plan de acción básico', 'Indicadores mínimos'],
    },
    'Estándar': {
        color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        label: 'Nivel ESTÁNDAR',
        desc: 'Organizaciones con exposición moderada. Requieren comité de seguridad vial, procedimientos documentados y seguimiento periódico.',
        modulos: ['Todo lo del nivel Básico', 'Comité de Seguridad Vial', 'Gestión de flota documentada', 'Programa de formación', 'Auditorías internas'],
    },
    'Avanzado': {
        color: 'bg-primary/20 text-primary border-primary/30',
        label: 'Nivel AVANZADO',
        desc: 'Organizaciones de transporte o con alta exposición. Máxima rigurosidad en todos los estándares del PESV.',
        modulos: ['Todo lo del nivel Estándar', 'Sistema de gestión integral', 'Indicadores de alto desempeño', 'Auditorías externas', 'Reportes a autoridades'],
    },
};

const TIPO_VEHICULOS = [
    'Automóvil Liviano',
    'Camioneta',
    'Bus/Buseta',
    'Camión/Volqueta',
    'Motocicleta',
    'Bicicleta',
];

const EQUIPOS_EMERGENCIA = [
    { key: 'botiquin', label: 'Botiquín' },
    { key: 'extintor', label: 'Extintor' },
    { key: 'equipoCarretera', label: 'Equipo de Carretera' },
    { key: 'camilla', label: 'Camilla' },
    { key: 'kitDerrames', label: 'Kit de Derrames' },
] as const;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DiagnosticoPage() {
    const firestore = useFirestore();
    const { profile } = useUser();
    const empresaId = profile?.empresaId ?? '';

    const [activeTab, setActiveTab] = useState('sedes');
    const [loadingSedes, setLoadingSedes] = useState(false);
    const [loadingActores, setLoadingActores] = useState(false);
    const [loadingFlota, setLoadingFlota] = useState(false);
    const [loadingRutas, setLoadingRutas] = useState(false);
    const [loadingEmergencias, setLoadingEmergencias] = useState(false);
    const [loadingConsolidar, setLoadingConsolidar] = useState(false);
    const [nivelDialogOpen, setNivelDialogOpen] = useState(false);
    const [nivelCalculado, setNivelCalculado] = useState('');
    const [surveyLink, setSurveyLink] = useState('');

    // ── Sede form state ──
    const [sedeForm, setSedeForm] = useState({
        nombreSede: '',
        ciudadOperacion: '',
        misionalidad: 'DIFERENTE_A_TRANSPORTE' as 'TRANSPORTE' | 'DIFERENTE_A_TRANSPORTE',
        servicios: '',
    });

    // ── Actores form state ──
    const [actoresForm, setActoresForm] = useState({
        peatones: 0,
        pasajeros: 0,
        ciclistas: 0,
        motociclistas: 0,
        conductores_directos: 0,
    });

    // ── Flota form state ──
    const [flotaForm, setFlotaForm] = useState({
        vehiculosPropios: 0,
        vehiculosTerminos: 0,
        vehiculosColaboradores: 0,
        desglose: TIPO_VEHICULOS.map(t => ({ tipo: t, cantidad: 0 })),
    });

    // ── Ruta form state ──
    const [rutaForm, setRutaForm] = useState({
        origen: '',
        destino: '',
        kmAproximados: 0,
        frecuencia: 'Diaria',
        conductoresExpuestos: 0,
    });

    // ── Emergencias form state ──
    const [emergForm, setEmergForm] = useState<EmergenciasDoc>({
        botiquin: false,
        extintor: false,
        equipoCarretera: false,
        camilla: false,
        kitDerrames: false,
        colaboradoresCapacitados: 0,
        simulacroRealizado: false,
        fechaUltimoSimulacro: '',
    });

    // ── Linea base form state ──
    const [lineaBaseForm, setLineaBaseForm] = useState({
        anioPeriodo: String(new Date().getFullYear()),
        siniestrosDanosMateriales: 0,
        siniestrosLesionados: 0,
        siniestrosFatales: 0,
    });

    // ─── Firestore refs ──────────────────────────────────────────────────────

    const sedesColRef = useMemoFirebase(() => {
        if (!firestore || !empresaId) return null;
        return collection(firestore, 'empresas', empresaId, 'pesv_diagnostico_sedes');
    }, [firestore, empresaId]);

    const sedesQuery = useMemoFirebase(() => {
        if (!sedesColRef) return null;
        return query(sedesColRef, orderBy('createdAt', 'desc'));
    }, [sedesColRef]);

    const { data: sedes } = useCollection<SedeDoc>(sedesQuery);

    const actoresRef = useMemoFirebase(() => {
        if (!firestore || !empresaId) return null;
        return doc(firestore, 'empresas', empresaId, 'pesv_diagnostico', 'actores');
    }, [firestore, empresaId]);
    const { data: actoresData } = useDoc<ActoresDoc>(actoresRef);

    const flotaRef = useMemoFirebase(() => {
        if (!firestore || !empresaId) return null;
        return doc(firestore, 'empresas', empresaId, 'pesv_diagnostico', 'flota');
    }, [firestore, empresaId]);
    const { data: flotaData } = useDoc<FlotaDoc>(flotaRef);

    const rutasColRef = useMemoFirebase(() => {
        if (!firestore || !empresaId) return null;
        return collection(firestore, 'empresas', empresaId, 'pesv_rutas_diagnostico');
    }, [firestore, empresaId]);
    const rutasQuery = useMemoFirebase(() => {
        if (!rutasColRef) return null;
        return query(rutasColRef, orderBy('createdAt', 'desc'));
    }, [rutasColRef]);
    const { data: rutas } = useCollection<RutaDoc>(rutasQuery);

    const emergenciasRef = useMemoFirebase(() => {
        if (!firestore || !empresaId) return null;
        return doc(firestore, 'empresas', empresaId, 'pesv_diagnostico', 'emergencias');
    }, [firestore, empresaId]);
    const { data: emergenciasData } = useDoc<EmergenciasDoc>(emergenciasRef);

    const lineaBaseRef = useMemoFirebase(() => {
        if (!firestore || !empresaId) return null;
        return doc(firestore, 'empresas', empresaId, 'pesv_diagnostico', 'linea_base');
    }, [firestore, empresaId]);
    const { data: lineaBaseData } = useDoc<LineaBaseDoc>(lineaBaseRef);

    const configRef = useMemoFirebase(() => {
        if (!firestore || !empresaId) return null;
        return doc(firestore, 'empresas', empresaId, 'pesv_diagnostico', 'config');
    }, [firestore, empresaId]);

    const encuestasColRef = useMemoFirebase(() => {
        if (!firestore || !empresaId) return null;
        return collection(firestore, 'empresas', empresaId, 'encuestas_pesv');
    }, [firestore, empresaId]);
    const encuestasQuery = useMemoFirebase(() => {
        if (!encuestasColRef) return null;
        return query(encuestasColRef, orderBy('submittedAt', 'desc'));
    }, [encuestasColRef]);
    const { data: encuestas } = useCollection<SurveyResponse>(encuestasQuery);

    // ─── Auto-calculations ────────────────────────────────────────────────────

    const totalColaboradores = useMemo(() => {
        return (
            actoresForm.peatones +
            actoresForm.pasajeros +
            actoresForm.ciclistas +
            actoresForm.motociclistas +
            actoresForm.conductores_directos
        );
    }, [actoresForm]);

    const totalFlota = useMemo(() => {
        return flotaForm.vehiculosPropios + flotaForm.vehiculosTerminos + flotaForm.vehiculosColaboradores;
    }, [flotaForm]);

    const encuestaPct = useMemo(() => {
        if (!totalColaboradores || !encuestas) return 0;
        return Math.min(100, Math.round((encuestas.length / totalColaboradores) * 100));
    }, [encuestas, totalColaboradores]);

    const surveyStats = useMemo(() => {
        if (!encuestas || encuestas.length === 0) return null;
        const total = encuestas.length;

        // Distribution by rol vial
        const byRol: Record<string, number> = {};
        encuestas.forEach(e => {
            const r = e.rolVialPrincipal ?? 'No especificado';
            byRol[r] = (byRol[r] ?? 0) + 1;
        });
        const rolSorted = Object.entries(byRol).sort((a, b) => b[1] - a[1]);

        // Distribution by gender
        const byGenero: Record<string, number> = {};
        encuestas.forEach(e => {
            const g = e.genero ?? 'No especificado';
            byGenero[g] = (byGenero[g] ?? 0) + 1;
        });

        // Top riesgos (InItinere + Mision combined)
        const riesgoCount: Record<string, number> = {};
        encuestas.forEach(e => {
            [...(e.riesgosRutaInItinere ?? []), ...(e.riesgosRutaMision ?? [])].forEach(r => {
                riesgoCount[r] = (riesgoCount[r] ?? 0) + 1;
            });
        });
        const riesgosSorted = Object.entries(riesgoCount).sort((a, b) => b[1] - a[1]);

        // KPIs
        const conSiniestros = encuestas.filter(e => e.siniestrosUltimoAnio === true).length;
        const conInfracciones = encuestas.filter(e => e.infraccionesUltimoAnio === true).length;
        const conMision = encuestas.filter(e => e.desplazamientosMision === true).length;

        return { total, byRol, rolSorted, byGenero, riesgosSorted, conSiniestros, conInfracciones, conMision };
    }, [encuestas]);

    // ─── Sync loaded data into form state ────────────────────────────────────

    useMemo(() => {
        if (actoresData) {
            setActoresForm({
                peatones: actoresData.peatones ?? 0,
                pasajeros: actoresData.pasajeros ?? 0,
                ciclistas: actoresData.ciclistas ?? 0,
                motociclistas: actoresData.motociclistas ?? 0,
                conductores_directos: actoresData.conductores_directos ?? 0,
            });
        }
    }, [actoresData]);

    useMemo(() => {
        if (flotaData) {
            setFlotaForm({
                vehiculosPropios: flotaData.vehiculosPropios ?? 0,
                vehiculosTerminos: flotaData.vehiculosTerminos ?? 0,
                vehiculosColaboradores: flotaData.vehiculosColaboradores ?? 0,
                desglose: TIPO_VEHICULOS.map(t => {
                    const found = flotaData.desglose?.find(d => d.tipo === t);
                    return { tipo: t, cantidad: found?.cantidad ?? 0 };
                }),
            });
        }
    }, [flotaData]);

    useMemo(() => {
        if (emergenciasData) {
            setEmergForm({
                botiquin: emergenciasData.botiquin ?? false,
                extintor: emergenciasData.extintor ?? false,
                equipoCarretera: emergenciasData.equipoCarretera ?? false,
                camilla: emergenciasData.camilla ?? false,
                kitDerrames: emergenciasData.kitDerrames ?? false,
                colaboradoresCapacitados: emergenciasData.colaboradoresCapacitados ?? 0,
                simulacroRealizado: emergenciasData.simulacroRealizado ?? false,
                fechaUltimoSimulacro: emergenciasData.fechaUltimoSimulacro ?? '',
            });
        }
    }, [emergenciasData]);

    useMemo(() => {
        if (lineaBaseData) {
            setLineaBaseForm({
                anioPeriodo: lineaBaseData.anioPeriodo ?? String(new Date().getFullYear()),
                siniestrosDanosMateriales: lineaBaseData.siniestrosDanosMateriales ?? 0,
                siniestrosLesionados: lineaBaseData.siniestrosLesionados ?? 0,
                siniestrosFatales: lineaBaseData.siniestrosFatales ?? 0,
            });
        }
    }, [lineaBaseData]);

    // ─── Tab completeness ─────────────────────────────────────────────────────

    const tabComplete = useMemo(() => ({
        sedes: !!(sedes && sedes.length > 0),
        actores: !!(actoresData?.conductores_directos),
        flota: !!(flotaData?.vehiculosPropios !== undefined),
        rutas: !!(rutas && rutas.length > 0),
        linea: !!(lineaBaseData?.periodoConsolidado),
        encuestas: !!(encuestas && encuestas.length > 0),
    }), [sedes, actoresData, flotaData, rutas, lineaBaseData, encuestas]);

    // ─── Handlers ────────────────────────────────────────────────────────────

    const handleSaveSede = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !empresaId || !sedesColRef) return;
        if (!sedeForm.nombreSede.trim()) {
            toast({ title: 'Error', description: 'El nombre de la sede es obligatorio.', variant: 'destructive' });
            return;
        }
        setLoadingSedes(true);
        try {
            await addDoc(sedesColRef, { ...sedeForm, createdAt: serverTimestamp() });
            // Also save misionalidad to config
            await setDoc(configRef!, { misionalidad: sedeForm.misionalidad }, { merge: true });
            setSedeForm({ nombreSede: '', ciudadOperacion: '', misionalidad: 'DIFERENTE_A_TRANSPORTE', servicios: '' });
            toast({ title: 'Sede guardada', description: 'La sede ha sido registrada correctamente.' });
        } catch {
            toast({ title: 'Error', description: 'No se pudo guardar la sede.', variant: 'destructive' });
        } finally {
            setLoadingSedes(false);
        }
    };

    const handleDeleteSede = async (id: string) => {
        if (!firestore || !empresaId) return;
        await deleteDoc(doc(firestore, 'empresas', empresaId, 'pesv_diagnostico_sedes', id));
        toast({ title: 'Sede eliminada' });
    };

    const handleSaveActores = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !actoresRef) return;
        setLoadingActores(true);
        try {
            await setDoc(actoresRef, { ...actoresForm, actualizadoEn: serverTimestamp() }, { merge: true });
            toast({ title: 'Actores viales guardados' });
        } catch {
            toast({ title: 'Error', description: 'No se pudo guardar.', variant: 'destructive' });
        } finally {
            setLoadingActores(false);
        }
    };

    const handleSaveFlota = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !flotaRef) return;
        setLoadingFlota(true);
        try {
            await setDoc(flotaRef, { ...flotaForm, totalFlota, actualizadoEn: serverTimestamp() }, { merge: true });
            toast({ title: 'Flota vehicular guardada' });
        } catch {
            toast({ title: 'Error', description: 'No se pudo guardar.', variant: 'destructive' });
        } finally {
            setLoadingFlota(false);
        }
    };

    const handleSaveRuta = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !rutasColRef) return;
        if (!rutaForm.origen.trim() || !rutaForm.destino.trim()) {
            toast({ title: 'Error', description: 'Origen y destino son obligatorios.', variant: 'destructive' });
            return;
        }
        setLoadingRutas(true);
        try {
            await addDoc(rutasColRef, { ...rutaForm, createdAt: serverTimestamp() });
            setRutaForm({ origen: '', destino: '', kmAproximados: 0, frecuencia: 'Diaria', conductoresExpuestos: 0 });
            toast({ title: 'Ruta guardada' });
        } catch {
            toast({ title: 'Error', description: 'No se pudo guardar la ruta.', variant: 'destructive' });
        } finally {
            setLoadingRutas(false);
        }
    };

    const handleDeleteRuta = async (id: string) => {
        if (!firestore || !empresaId) return;
        await deleteDoc(doc(firestore, 'empresas', empresaId, 'pesv_rutas_diagnostico', id));
        toast({ title: 'Ruta eliminada' });
    };

    const handleSaveEmergencias = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !emergenciasRef) return;
        setLoadingEmergencias(true);
        try {
            await setDoc(emergenciasRef, { ...emergForm, actualizadoEn: serverTimestamp() }, { merge: true });
            toast({ title: 'Emergencias guardadas' });
        } catch {
            toast({ title: 'Error', description: 'No se pudo guardar.', variant: 'destructive' });
        } finally {
            setLoadingEmergencias(false);
        }
    };

    const handleConsolidar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !empresaId || !lineaBaseRef || !configRef) return;
        setLoadingConsolidar(true);
        try {
            // 1. Save linea_base
            await setDoc(lineaBaseRef, {
                ...lineaBaseForm,
                periodoConsolidado: true,
                consolidadoEn: serverTimestamp(),
            }, { merge: true });

            // 2. Read config for misionalidad
            const { getDoc } = await import('firebase/firestore');
            const configSnap = await getDoc(configRef);
            const misionalidad: string = configSnap.data()?.misionalidad ?? 'DIFERENTE_A_TRANSPORTE';
            const conductores = actoresData?.conductores_directos ?? actoresForm.conductores_directos ?? 0;
            const flota = totalFlota ?? 0;

            // 3. Calculate PESV level
            let nivel = 'Básico';
            if (misionalidad === 'TRANSPORTE') {
                nivel = 'Avanzado';
            } else if (conductores > 50 || flota > 10) {
                nivel = 'Avanzado';
            } else if (conductores >= 10 || flota >= 5) {
                nivel = 'Estándar';
            }

            // 4. Save nivelPesv to empresa doc
            const empresaDocRef = doc(firestore, 'empresas', empresaId);
            await updateDoc(empresaDocRef, { nivelPesv: nivel });

            // 5. Save nivel in config too
            await setDoc(configRef, { nivelPesv: nivel }, { merge: true });

            setNivelCalculado(nivel);
            setNivelDialogOpen(true);
            toast({ title: 'Diagnóstico consolidado', description: `Nivel PESV: ${nivel}` });
        } catch (err) {
            console.error(err);
            toast({ title: 'Error', description: 'No se pudo consolidar el diagnóstico.', variant: 'destructive' });
        } finally {
            setLoadingConsolidar(false);
        }
    };

    const generateSurveyLink = () => {
        if (!empresaId) return;
        const link = `${window.location.origin}/survey/${empresaId}`;
        setSurveyLink(link);
        toast({ title: 'Link generado', description: 'Comparte el enlace con tus colaboradores.' });
    };

    const copyLink = () => {
        navigator.clipboard.writeText(surveyLink);
        toast({ title: 'Copiado', description: 'Enlace copiado al portapapeles.' });
    };

    const currentYear = new Date().getFullYear();

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight uppercase italic">
                        Diagnóstico Integral PESV
                    </h1>
                    <p className="text-text-secondary mt-1">
                        Línea base y categorización organizacional — Resolución 40595/2022, Paso 5
                    </p>
                </div>
                <div className="flex gap-2">
                    <Badge className="bg-primary/20 text-primary border-primary/30 px-3 py-1 font-bold">
                        {[tabComplete.sedes, tabComplete.actores, tabComplete.flota, tabComplete.rutas, tabComplete.linea, tabComplete.encuestas].filter(Boolean).length} / 6 completados
                    </Badge>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-surface-dark border-border-dark p-1 h-auto flex flex-wrap gap-1">
                    <TabsTrigger value="sedes" className="font-bold gap-1.5 py-2">
                        <Building2 className="size-4" />
                        <span>Sedes y Contexto</span>
                        <TabCheck complete={tabComplete.sedes} />
                    </TabsTrigger>
                    <TabsTrigger value="actores" className="font-bold gap-1.5 py-2">
                        <Users className="size-4" />
                        <span>Actores Viales</span>
                        <TabCheck complete={tabComplete.actores} />
                    </TabsTrigger>
                    <TabsTrigger value="flota" className="font-bold gap-1.5 py-2">
                        <Truck className="size-4" />
                        <span>Flota Vehicular</span>
                        <TabCheck complete={tabComplete.flota} />
                    </TabsTrigger>
                    <TabsTrigger value="rutas" className="font-bold gap-1.5 py-2">
                        <MapPin className="size-4" />
                        <span>Rutas y Emergencias</span>
                        <TabCheck complete={tabComplete.rutas} />
                    </TabsTrigger>
                    <TabsTrigger value="linea" className="font-bold gap-1.5 py-2">
                        <BarChart3 className="size-4" />
                        <span>Línea Base</span>
                        <TabCheck complete={tabComplete.linea} />
                    </TabsTrigger>
                    <TabsTrigger value="encuestas" className="font-bold gap-1.5 py-2">
                        <Eye className="size-4" />
                        <span>Resultados Encuesta</span>
                        <TabCheck complete={tabComplete.encuestas} />
                    </TabsTrigger>
                </TabsList>

                {/* ─── TAB 1: SEDES Y CONTEXTO ─────────────────────────────── */}
                <TabsContent value="sedes" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="bg-surface-dark border-border-dark shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-lg font-black uppercase text-foreground tracking-tighter flex items-center gap-2">
                                    <Building2 className="text-primary size-5" /> Nueva Sede
                                </CardTitle>
                                <CardDescription>Registra cada sede o lugar de operación.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSaveSede} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">
                                            Nombre de la Sede *
                                        </Label>
                                        <Input
                                            value={sedeForm.nombreSede}
                                            onChange={e => setSedeForm(p => ({ ...p, nombreSede: e.target.value }))}
                                            className="bg-background-dark border-border-dark"
                                            placeholder="Ej: Sede Principal Bogotá"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">
                                            Ciudad de Operación *
                                        </Label>
                                        <Input
                                            value={sedeForm.ciudadOperacion}
                                            onChange={e => setSedeForm(p => ({ ...p, ciudadOperacion: e.target.value }))}
                                            className="bg-background-dark border-border-dark"
                                            placeholder="Ej: Bogotá D.C."
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">
                                            Misionalidad *
                                        </Label>
                                        <Select
                                            value={sedeForm.misionalidad}
                                            onValueChange={v => setSedeForm(p => ({ ...p, misionalidad: v as 'TRANSPORTE' | 'DIFERENTE_A_TRANSPORTE' }))}
                                        >
                                            <SelectTrigger className="bg-background-dark border-border-dark">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="TRANSPORTE">Empresa de Transporte</SelectItem>
                                                <SelectItem value="DIFERENTE_A_TRANSPORTE">Diferente a Transporte</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">
                                            Servicios que Presta
                                        </Label>
                                        <Textarea
                                            value={sedeForm.servicios}
                                            onChange={e => setSedeForm(p => ({ ...p, servicios: e.target.value }))}
                                            className="bg-background-dark border-border-dark min-h-[80px]"
                                            placeholder="Describa brevemente la actividad económica..."
                                        />
                                    </div>
                                    <Button type="submit" disabled={loadingSedes} className="w-full bg-primary font-black uppercase h-11 gap-2">
                                        <Plus className="size-4" /> Agregar Sede
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        <Card className="bg-surface-dark border-border-dark shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-lg font-black uppercase text-foreground tracking-tighter">
                                    Sedes Registradas
                                </CardTitle>
                                <CardDescription>
                                    {sedes?.length ?? 0} sede(s) en total
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {(!sedes || sedes.length === 0) ? (
                                    <div className="text-center py-12 text-text-secondary text-sm">
                                        <Building2 className="size-10 mx-auto mb-3 opacity-20" />
                                        <p>Aún no hay sedes registradas.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                                        {sedes.map(s => (
                                            <div key={s.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:border-primary/20 transition-all">
                                                <div>
                                                    <p className="text-sm font-bold text-foreground uppercase">{s.nombreSede}</p>
                                                    <p className="text-[10px] text-text-secondary uppercase">{s.ciudadOperacion}</p>
                                                    <Badge className={`text-[8px] mt-1 ${s.misionalidad === 'TRANSPORTE' ? 'bg-primary/20 text-primary border-primary/30' : 'bg-white/10 text-text-secondary border-white/10'}`}>
                                                        {s.misionalidad === 'TRANSPORTE' ? 'Transporte' : 'No Transporte'}
                                                    </Badge>
                                                </div>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="size-8 text-red-500/40 hover:text-red-500"
                                                    onClick={() => handleDeleteSede(s.id)}
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ─── TAB 2: ACTORES VIALES ────────────────────────────────── */}
                <TabsContent value="actores" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <Card className="lg:col-span-7 bg-surface-dark border-border-dark shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-lg font-black uppercase text-foreground tracking-tighter flex items-center gap-2">
                                    <Users className="text-primary size-5" /> Censo de Actores Viales
                                </CardTitle>
                                <CardDescription>Número de colaboradores por rol de movilidad.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSaveActores} className="space-y-4">
                                    {(
                                        [
                                            { key: 'peatones', label: 'Peatones' },
                                            { key: 'pasajeros', label: 'Pasajeros (transporte público/empresarial)' },
                                            { key: 'ciclistas', label: 'Ciclistas' },
                                            { key: 'motociclistas', label: 'Motociclistas' },
                                            { key: 'conductores_directos', label: 'Conductores Directos' },
                                        ] as const
                                    ).map(({ key, label }) => (
                                        <div key={key} className="grid grid-cols-2 items-center gap-4">
                                            <Label className="text-xs font-bold text-text-secondary">{label}</Label>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={actoresForm[key]}
                                                onChange={e => setActoresForm(p => ({ ...p, [key]: Number(e.target.value) }))}
                                                className="bg-background-dark border-border-dark"
                                            />
                                        </div>
                                    ))}
                                    <div className="grid grid-cols-2 items-center gap-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                                        <Label className="text-xs font-black text-primary uppercase">Total Colaboradores</Label>
                                        <Input
                                            readOnly
                                            value={totalColaboradores}
                                            className="bg-transparent border-none text-primary font-black text-right text-lg"
                                        />
                                    </div>
                                    <Button type="submit" disabled={loadingActores} className="w-full bg-primary font-black uppercase h-11 gap-2">
                                        <Save className="size-4" /> Guardar Actores
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        <div className="lg:col-span-5 space-y-4">
                            <Card className="bg-surface-dark border-border-dark shadow-xl">
                                <CardHeader>
                                    <CardTitle className="text-base font-black uppercase text-foreground tracking-tighter flex items-center gap-2">
                                        <Link className="text-primary size-4" /> Encuesta de Actores
                                    </CardTitle>
                                    <CardDescription>Comparte el link para recolección de datos.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button onClick={generateSurveyLink} variant="outline" className="w-full border-primary/30 text-primary font-bold gap-2">
                                        <Link className="size-4" /> Generar Link de Encuesta
                                    </Button>
                                    {surveyLink && (
                                        <div className="flex gap-2">
                                            <Input value={surveyLink} readOnly className="bg-black/20 border-border-dark text-xs font-mono" />
                                            <Button size="icon" variant="outline" className="shrink-0 border-border-dark" onClick={copyLink}>
                                                <Copy className="size-4" />
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="bg-surface-dark border-border-dark border-l-4 border-l-emerald-500 shadow-xl">
                                <CardHeader className="pb-2">
                                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Participación Encuesta</p>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="text-3xl font-black text-foreground">
                                        {encuestas?.length ?? 0} <span className="text-text-secondary text-lg">/ {totalColaboradores}</span>
                                    </div>
                                    <Progress value={encuestaPct} className="h-2 bg-white/5" />
                                    <p className="text-xs text-text-secondary">{encuestaPct}% de participación</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* ─── TAB 3: FLOTA VEHICULAR ───────────────────────────────── */}
                <TabsContent value="flota" className="mt-6 space-y-6">
                    <form onSubmit={handleSaveFlota} className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="bg-surface-dark border-border-dark shadow-xl">
                                <CardHeader>
                                    <CardTitle className="text-lg font-black uppercase text-foreground tracking-tighter flex items-center gap-2">
                                        <Truck className="text-primary size-5" /> Resumen de Flota
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {(
                                        [
                                            { key: 'vehiculosPropios', label: 'Vehículos Propios' },
                                            { key: 'vehiculosTerminos', label: 'Vehículos en Términos (Leasing/Renting)' },
                                            { key: 'vehiculosColaboradores', label: 'Vehículos de Colaboradores' },
                                        ] as const
                                    ).map(({ key, label }) => (
                                        <div key={key} className="grid grid-cols-2 items-center gap-4">
                                            <Label className="text-xs font-bold text-text-secondary">{label}</Label>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={flotaForm[key]}
                                                onChange={e => setFlotaForm(p => ({ ...p, [key]: Number(e.target.value) }))}
                                                className="bg-background-dark border-border-dark"
                                            />
                                        </div>
                                    ))}
                                    <div className="grid grid-cols-2 items-center gap-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                                        <Label className="text-xs font-black text-primary uppercase">Total Flota</Label>
                                        <Input
                                            readOnly
                                            value={totalFlota}
                                            className="bg-transparent border-none text-primary font-black text-right text-lg"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-surface-dark border-border-dark shadow-xl">
                                <CardHeader>
                                    <CardTitle className="text-base font-black uppercase text-foreground tracking-tighter">
                                        Desglose por Tipo
                                    </CardTitle>
                                    <CardDescription>Cantidad por categoría de vehículo.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {flotaForm.desglose.map((row, idx) => (
                                            <div key={row.tipo} className="grid grid-cols-2 items-center gap-4">
                                                <Label className="text-xs font-bold text-text-secondary">{row.tipo}</Label>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    value={row.cantidad}
                                                    onChange={e => {
                                                        const updated = [...flotaForm.desglose];
                                                        updated[idx] = { ...updated[idx], cantidad: Number(e.target.value) };
                                                        setFlotaForm(p => ({ ...p, desglose: updated }));
                                                    }}
                                                    className="bg-background-dark border-border-dark"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={loadingFlota} className="bg-primary font-black uppercase h-11 px-8 gap-2">
                                <Save className="size-4" /> Guardar Flota
                            </Button>
                        </div>
                    </form>
                </TabsContent>

                {/* ─── TAB 4: RUTAS Y EMERGENCIAS ──────────────────────────── */}
                <TabsContent value="rutas" className="mt-6 space-y-6">
                    {/* Rutas */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="bg-surface-dark border-border-dark shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-lg font-black uppercase text-foreground tracking-tighter flex items-center gap-2">
                                    <MapPin className="text-primary size-5" /> Agregar Ruta
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSaveRuta} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Origen *</Label>
                                            <Input
                                                value={rutaForm.origen}
                                                onChange={e => setRutaForm(p => ({ ...p, origen: e.target.value }))}
                                                className="bg-background-dark border-border-dark"
                                                placeholder="Ej: Bogotá Sede Norte"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Destino *</Label>
                                            <Input
                                                value={rutaForm.destino}
                                                onChange={e => setRutaForm(p => ({ ...p, destino: e.target.value }))}
                                                className="bg-background-dark border-border-dark"
                                                placeholder="Ej: Medellín Planta"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Km Aprox.</Label>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={rutaForm.kmAproximados}
                                                onChange={e => setRutaForm(p => ({ ...p, kmAproximados: Number(e.target.value) }))}
                                                className="bg-background-dark border-border-dark"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Frecuencia</Label>
                                            <Select value={rutaForm.frecuencia} onValueChange={v => setRutaForm(p => ({ ...p, frecuencia: v }))}>
                                                <SelectTrigger className="bg-background-dark border-border-dark">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Diaria">Diaria</SelectItem>
                                                    <SelectItem value="Semanal">Semanal</SelectItem>
                                                    <SelectItem value="Mensual">Mensual</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Conductores</Label>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={rutaForm.conductoresExpuestos}
                                                onChange={e => setRutaForm(p => ({ ...p, conductoresExpuestos: Number(e.target.value) }))}
                                                className="bg-background-dark border-border-dark"
                                            />
                                        </div>
                                    </div>
                                    <Button type="submit" disabled={loadingRutas} className="w-full bg-primary font-black uppercase h-11 gap-2">
                                        <Plus className="size-4" /> Agregar Ruta
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        <Card className="bg-surface-dark border-border-dark shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-base font-black uppercase text-foreground tracking-tighter">
                                    Rutas Registradas ({rutas?.length ?? 0})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {(!rutas || rutas.length === 0) ? (
                                    <div className="text-center py-10 text-text-secondary text-sm">
                                        <MapPin className="size-10 mx-auto mb-3 opacity-20" />
                                        <p>Aún no hay rutas registradas.</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-border-dark">
                                                <TableHead className="text-[10px] uppercase">Ruta</TableHead>
                                                <TableHead className="text-[10px] uppercase">Km</TableHead>
                                                <TableHead className="text-[10px] uppercase">Frec.</TableHead>
                                                <TableHead></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {rutas.map(r => (
                                                <TableRow key={r.id} className="border-border-dark text-xs">
                                                    <TableCell className="font-bold text-foreground">
                                                        {r.origen} → {r.destino}
                                                    </TableCell>
                                                    <TableCell className="text-text-secondary">{r.kmAproximados}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-[9px] border-primary/30 text-primary">{r.frecuencia}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="size-7 text-red-500/40 hover:text-red-500"
                                                            onClick={() => handleDeleteRuta(r.id)}
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Emergencias */}
                    <Card className="bg-surface-dark border-border-dark shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-lg font-black uppercase text-foreground tracking-tighter flex items-center gap-2">
                                <ShieldAlert className="text-primary size-5" /> Capacidades para Emergencias
                            </CardTitle>
                            <CardDescription>Evaluación de preparación ante siniestros viales.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSaveEmergencias} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Equipos Disponibles</Label>
                                            <div className="space-y-2">
                                                {EQUIPOS_EMERGENCIA.map(({ key, label }) => (
                                                    <div key={key} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                                        <Checkbox
                                                            id={key}
                                                            checked={emergForm[key]}
                                                            onCheckedChange={v => setEmergForm(p => ({ ...p, [key]: !!v }))}
                                                            className="border-primary data-[state=checked]:bg-primary"
                                                        />
                                                        <Label htmlFor={key} className="text-sm text-foreground cursor-pointer">{label}</Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">
                                                Colaboradores Capacitados en Primeros Auxilios
                                            </Label>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={emergForm.colaboradoresCapacitados}
                                                onChange={e => setEmergForm(p => ({ ...p, colaboradoresCapacitados: Number(e.target.value) }))}
                                                className="bg-background-dark border-border-dark"
                                            />
                                        </div>

                                        <div className="p-4 bg-background-dark rounded-xl border border-border-dark space-y-4">
                                            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Simulacros</p>
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    id="simulacro"
                                                    checked={emergForm.simulacroRealizado}
                                                    onCheckedChange={v => setEmergForm(p => ({ ...p, simulacroRealizado: !!v }))}
                                                    className="border-primary data-[state=checked]:bg-primary"
                                                />
                                                <Label htmlFor="simulacro" className="text-sm text-foreground cursor-pointer">
                                                    ¿Simulacro realizado el último año?
                                                </Label>
                                            </div>
                                            {emergForm.simulacroRealizado && (
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">
                                                        Fecha del Último Simulacro
                                                    </Label>
                                                    <Input
                                                        type="date"
                                                        value={emergForm.fechaUltimoSimulacro}
                                                        onChange={e => setEmergForm(p => ({ ...p, fechaUltimoSimulacro: e.target.value }))}
                                                        className="bg-surface-dark border-border-dark"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2 border-t border-border-dark">
                                    <Button type="submit" disabled={loadingEmergencias} className="bg-primary font-black uppercase h-11 px-8 gap-2">
                                        <Save className="size-4" /> Guardar Emergencias
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ─── TAB 5: LÍNEA BASE Y CATEGORIZACIÓN ──────────────────── */}
                <TabsContent value="linea" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="bg-surface-dark border-border-dark shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-lg font-black uppercase text-foreground tracking-tighter flex items-center gap-2">
                                    <BarChart3 className="text-primary size-5" /> Indicadores de Siniestralidad
                                </CardTitle>
                                <CardDescription>Línea base para el período de referencia.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {lineaBaseData?.periodoConsolidado ? (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                                            <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                                            <div>
                                                <p className="text-sm font-black text-emerald-500 uppercase">Período Consolidado</p>
                                                <p className="text-[10px] text-text-secondary">Año {lineaBaseData.anioPeriodo}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="text-center p-4 bg-white/5 rounded-xl">
                                                <p className="text-2xl font-black text-foreground">{lineaBaseData.siniestrosDanosMateriales}</p>
                                                <p className="text-[10px] text-text-secondary uppercase mt-1">Daños Materiales</p>
                                            </div>
                                            <div className="text-center p-4 bg-amber-500/10 rounded-xl">
                                                <p className="text-2xl font-black text-amber-400">{lineaBaseData.siniestrosLesionados}</p>
                                                <p className="text-[10px] text-text-secondary uppercase mt-1">Lesionados</p>
                                            </div>
                                            <div className="text-center p-4 bg-red-500/10 rounded-xl">
                                                <p className="text-2xl font-black text-red-400">{lineaBaseData.siniestrosFatales}</p>
                                                <p className="text-[10px] text-text-secondary uppercase mt-1">Fatales</p>
                                            </div>
                                        </div>
                                        {lineaBaseData.nivelPesv && (
                                            <div className={`p-4 rounded-xl border text-center ${NIVEL_INFO[lineaBaseData.nivelPesv]?.color ?? 'bg-primary/20 text-primary border-primary/30'}`}>
                                                <p className="text-xs font-black uppercase tracking-widest">Nivel PESV Asignado</p>
                                                <p className="text-3xl font-black mt-1">{lineaBaseData.nivelPesv}</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <form onSubmit={handleConsolidar} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Año de Referencia</Label>
                                            <Select
                                                value={lineaBaseForm.anioPeriodo}
                                                onValueChange={v => setLineaBaseForm(p => ({ ...p, anioPeriodo: v }))}
                                            >
                                                <SelectTrigger className="bg-background-dark border-border-dark">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value={String(currentYear - 1)}>{currentYear - 1}</SelectItem>
                                                    <SelectItem value={String(currentYear)}>{currentYear}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">
                                                Siniestros — Solo Daños Materiales
                                            </Label>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={lineaBaseForm.siniestrosDanosMateriales}
                                                onChange={e => setLineaBaseForm(p => ({ ...p, siniestrosDanosMateriales: Number(e.target.value) }))}
                                                className="bg-background-dark border-border-dark"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">
                                                Siniestros — Con Lesionados
                                            </Label>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={lineaBaseForm.siniestrosLesionados}
                                                onChange={e => setLineaBaseForm(p => ({ ...p, siniestrosLesionados: Number(e.target.value) }))}
                                                className="bg-background-dark border-border-dark"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">
                                                Siniestros — Fatales
                                            </Label>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={lineaBaseForm.siniestrosFatales}
                                                onChange={e => setLineaBaseForm(p => ({ ...p, siniestrosFatales: Number(e.target.value) }))}
                                                className="bg-background-dark border-border-dark"
                                            />
                                        </div>

                                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
                                            <Info className="size-4 text-amber-400 mt-0.5 shrink-0" />
                                            <p className="text-[10px] text-amber-300 leading-relaxed">
                                                Al consolidar, se calculará el Nivel PESV (Básico / Estándar / Avanzado) y quedará guardado en la empresa. Esta acción no se puede deshacer.
                                            </p>
                                        </div>

                                        <Button type="submit" disabled={loadingConsolidar} className="w-full bg-emerald-600 hover:bg-emerald-500 font-black uppercase h-12 gap-2 shadow-lg shadow-emerald-500/20">
                                            <BarChart3 className="size-5" /> Consolidar y Clasificar PESV
                                        </Button>
                                    </form>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="bg-surface-dark border-border-dark shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-base font-black uppercase text-foreground tracking-tighter">
                                    Criterios de Clasificación
                                </CardTitle>
                                <CardDescription>Según Resolución 40595/2022</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {Object.entries(NIVEL_INFO).map(([nivel, info]) => (
                                    <div key={nivel} className={`p-4 rounded-xl border ${info.color}`}>
                                        <p className="text-xs font-black uppercase tracking-widest">{info.label}</p>
                                        <p className="text-[11px] mt-1 opacity-80">{info.desc}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ─── TAB 6: RESULTADOS ENCUESTA ──────────────────────────── */}
                <TabsContent value="encuestas" className="mt-6 space-y-6">
                    {!encuestas || encuestas.length === 0 ? (
                        <Card className="bg-surface-dark border-border-dark shadow-xl">
                            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                                <Eye className="size-14 mx-auto mb-4 opacity-10" />
                                <p className="text-lg font-black text-text-secondary uppercase">Sin respuestas aún</p>
                                <p className="text-sm text-text-secondary mt-2 max-w-sm">
                                    Genera el link de encuesta en el tab "Actores Viales" y compártelo con tus colaboradores.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* ── KPIs ── */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <Card className="bg-surface-dark border-border-dark border-l-4 border-l-primary shadow-xl">
                                    <CardContent className="pt-5 pb-4">
                                        <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Respuestas</p>
                                        <p className="text-3xl font-black text-foreground mt-1">{surveyStats!.total}</p>
                                        <p className="text-[11px] text-text-secondary mt-1">{encuestaPct}% de participación</p>
                                        <Progress value={encuestaPct} className="h-1 mt-2 bg-white/5" />
                                    </CardContent>
                                </Card>
                                <Card className="bg-surface-dark border-border-dark border-l-4 border-l-amber-400 shadow-xl">
                                    <CardContent className="pt-5 pb-4">
                                        <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">En Misión Laboral</p>
                                        <p className="text-3xl font-black text-amber-400 mt-1">{surveyStats!.conMision}</p>
                                        <p className="text-[11px] text-text-secondary mt-1">realizan desplaz. en misión</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-surface-dark border-border-dark border-l-4 border-l-orange-400 shadow-xl">
                                    <CardContent className="pt-5 pb-4">
                                        <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Con Infracciones</p>
                                        <p className="text-3xl font-black text-orange-400 mt-1">{surveyStats!.conInfracciones}</p>
                                        <p className="text-[11px] text-text-secondary mt-1">infracción en el último año</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-surface-dark border-border-dark border-l-4 border-l-red-400 shadow-xl">
                                    <CardContent className="pt-5 pb-4">
                                        <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Con Siniestros</p>
                                        <p className="text-3xl font-black text-red-400 mt-1">{surveyStats!.conSiniestros}</p>
                                        <p className="text-[11px] text-text-secondary mt-1">siniestro en el último año</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* ── Distribución por Rol Vial ── */}
                                <Card className="lg:col-span-2 bg-surface-dark border-border-dark shadow-xl">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base font-black uppercase text-foreground tracking-tighter flex items-center gap-2">
                                            <TrendingUp className="text-primary size-4" /> Distribución por Rol Vial
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {surveyStats!.rolSorted.map(([rol, count]) => {
                                            const pct = Math.round((count / surveyStats!.total) * 100);
                                            return (
                                                <div key={rol} className="space-y-1">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-bold text-foreground truncate pr-2">{rol}</span>
                                                        <span className="text-xs text-text-secondary shrink-0">{count} ({pct}%)</span>
                                                    </div>
                                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary rounded-full transition-all"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </CardContent>
                                </Card>

                                {/* ── Distribución por Género ── */}
                                <Card className="bg-surface-dark border-border-dark shadow-xl">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base font-black uppercase text-foreground tracking-tighter flex items-center gap-2">
                                            <UserCheck className="text-primary size-4" /> Por Género
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {Object.entries(surveyStats!.byGenero)
                                            .sort((a, b) => b[1] - a[1])
                                            .map(([genero, count]) => {
                                                const pct = Math.round((count / surveyStats!.total) * 100);
                                                const color = genero === 'Masculino' ? 'bg-blue-500' : genero === 'Femenino' ? 'bg-pink-400' : 'bg-purple-400';
                                                return (
                                                    <div key={genero} className="space-y-1">
                                                        <div className="flex justify-between">
                                                            <span className="text-xs font-bold text-foreground">{genero}</span>
                                                            <span className="text-xs text-text-secondary">{count} ({pct}%)</span>
                                                        </div>
                                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                            <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* ── Top Riesgos Percibidos ── */}
                            {surveyStats!.riesgosSorted.length > 0 && (
                                <Card className="bg-surface-dark border-border-dark shadow-xl">
                                    <CardHeader>
                                        <CardTitle className="text-base font-black uppercase text-foreground tracking-tighter flex items-center gap-2">
                                            <ShieldAlert className="text-primary size-4" /> Top Riesgos Percibidos
                                        </CardTitle>
                                        <CardDescription>Riesgos identificados en rutas Casa–Trabajo y en Misión.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                                            {surveyStats!.riesgosSorted.map(([riesgo, count], idx) => {
                                                const maxCount = surveyStats!.riesgosSorted[0][1];
                                                const pct = Math.round((count / maxCount) * 100);
                                                return (
                                                    <div key={riesgo} className="space-y-1">
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-[10px] font-black w-4 ${idx === 0 ? 'text-red-400' : idx === 1 ? 'text-orange-400' : 'text-text-secondary'}`}>#{idx + 1}</span>
                                                                <span className="text-xs font-bold text-foreground">{riesgo}</span>
                                                            </div>
                                                            <span className="text-xs text-text-secondary shrink-0 ml-2">{count}</span>
                                                        </div>
                                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${idx === 0 ? 'bg-red-400' : idx === 1 ? 'bg-orange-400' : 'bg-primary/60'}`}
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* ── Tabla de Respuestas ── */}
                            <Card className="bg-surface-dark border-border-dark shadow-xl">
                                <CardHeader>
                                    <CardTitle className="text-base font-black uppercase text-foreground tracking-tighter flex items-center gap-2">
                                        <FileText className="text-primary size-4" /> Respuestas Individuales
                                    </CardTitle>
                                    <CardDescription>{encuestas.length} respuesta(s) recibidas</CardDescription>
                                </CardHeader>
                                <CardContent className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-border-dark">
                                                <TableHead className="text-[10px] uppercase">Colaborador</TableHead>
                                                <TableHead className="text-[10px] uppercase">Área</TableHead>
                                                <TableHead className="text-[10px] uppercase">Rol Vial</TableHead>
                                                <TableHead className="text-[10px] uppercase">Municipio</TableHead>
                                                <TableHead className="text-[10px] uppercase text-center">Misión</TableHead>
                                                <TableHead className="text-[10px] uppercase text-center">Infrac.</TableHead>
                                                <TableHead className="text-[10px] uppercase text-center">Siniestro</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {encuestas.map(r => (
                                                <TableRow key={r.id} className="border-border-dark text-xs hover:bg-white/[0.02]">
                                                    <TableCell className="font-bold text-foreground max-w-[140px] truncate">
                                                        {r.nombresCompletos ?? '—'}
                                                    </TableCell>
                                                    <TableCell className="text-text-secondary max-w-[100px] truncate">
                                                        {r.areaDependencia ?? '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-[9px] border-primary/30 text-primary whitespace-nowrap">
                                                            {r.rolVialPrincipal ?? '—'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-text-secondary">{r.municipioResidencia ?? '—'}</TableCell>
                                                    <TableCell className="text-center">
                                                        {r.desplazamientosMision === true
                                                            ? <CheckCircle2 className="size-3.5 text-emerald-500 mx-auto" />
                                                            : <span className="text-text-secondary/40">—</span>}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {r.infraccionesUltimoAnio === true
                                                            ? <Badge className="text-[9px] bg-orange-500/20 text-orange-400 border-orange-500/30">{r.cantidadInfracciones ?? '+'}</Badge>
                                                            : <span className="text-text-secondary/40">—</span>}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {r.siniestrosUltimoAnio === true
                                                            ? <Badge className="text-[9px] bg-red-500/20 text-red-400 border-red-500/30">{r.gravedadSiniestro ?? 'Sí'}</Badge>
                                                            : <span className="text-text-secondary/40">—</span>}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </TabsContent>
            </Tabs>

            {/* ─── NIVEL PESV DIALOG ────────────────────────────────────────── */}
            <Dialog open={nivelDialogOpen} onOpenChange={setNivelDialogOpen}>
                <DialogContent className="max-w-lg bg-surface-dark border-border-dark text-foreground p-0 overflow-hidden">
                    <DialogHeader className="p-6 bg-primary/10 border-b border-border-dark">
                        <DialogTitle className="text-xl font-black uppercase italic text-center">
                            Diagnóstico Consolidado
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-6 space-y-6">
                        {nivelCalculado && NIVEL_INFO[nivelCalculado] && (
                            <>
                                <div className={`p-6 rounded-2xl border text-center ${NIVEL_INFO[nivelCalculado].color}`}>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Nivel PESV Asignado</p>
                                    <p className="text-5xl font-black mt-2">{nivelCalculado}</p>
                                    <p className="text-xs mt-3 opacity-70 italic">{NIVEL_INFO[nivelCalculado].label}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-text-secondary leading-relaxed">
                                        {NIVEL_INFO[nivelCalculado].desc}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase text-text-secondary tracking-widest">
                                        Módulos Aplicables
                                    </p>
                                    {NIVEL_INFO[nivelCalculado].modulos.map(m => (
                                        <div key={m} className="flex items-center gap-2 text-sm text-foreground">
                                            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                                            {m}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                    <DialogFooter className="p-6 pt-0">
                        <Button onClick={() => setNivelDialogOpen(false)} className="w-full bg-primary font-black uppercase h-11">
                            Entendido — Ir al Panel Principal
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
