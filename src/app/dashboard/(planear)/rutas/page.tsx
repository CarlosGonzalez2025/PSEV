'use client';

import { useState, useMemo } from 'react';
import {
    Map, MapPin, Navigation, AlertTriangle, Building2, ClipboardCheck,
    Plus, Trash2, Save, ChevronRight, ShieldAlert,
    CheckCircle2, Clock, Wrench, AlertCircle, ArrowRight,
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import {
    collection, query, serverTimestamp, addDoc, updateDoc, doc, deleteDoc, orderBy,
} from 'firebase/firestore';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

type FrecuenciaUso = 'Diaria' | 'Semanal' | 'Mensual' | 'Ocasional';
type TipoRuta = 'Vía Urbana' | 'Vía Nacional' | 'Vía Rural' | 'Vía Interna/Privada';
type TipoRiesgoVial = 'ALTA_ACCIDENTALIDAD' | 'ZONA_DERRUMBES' | 'FALTA_ILUMINACION' | 'INSEGURIDAD_PUBLICA' | 'CONGESTION_SEVERA';
type NivelRiesgo = 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';
type TipoZona = 'PARQUEADERO_MOTOS' | 'PARQUEADERO_BICICLETAS' | 'PARQUEADERO_VEHICULOS' | 'VIA_INTERNA' | 'ACCESO_PRINCIPAL';
type EstadoPiso = 'Bueno' | 'Regular' | 'Malo';
type Senalizacion = 'PARE' | 'CEDA_EL_PASO' | 'VELOCIDAD_MAXIMA' | 'ZONA_PEATONAL';
type EstadoInspeccion = 'ABIERTA' | 'EN_PROCESO' | 'CERRADA';

interface RutaDoc {
    id: string;
    nombre_ruta: string;
    tipo_ruta: TipoRuta;
    origen: string;
    destino: string;
    distancia_km: number;
    tiempo_estimado_min: number;
    frecuencia_uso: FrecuenciaUso;
    createdAt?: unknown;
}

interface PuntoCriticoDoc {
    id: string;
    nombre_punto: string;
    id_ruta_asociada: string;
    latitud: string;
    longitud: string;
    tipo_riesgo_vial: TipoRiesgoVial;
    nivel_riesgo: NivelRiesgo;
    medida_control: string;
    createdAt?: unknown;
}

interface InfraestructuraDoc {
    id: string;
    tipo_zona: TipoZona;
    nombre_zona: string;
    limite_velocidad: number;
    flujo_peatonal_separado: boolean;
    inventario_senalizacion: Senalizacion[];
    estado_acabado_piso: EstadoPiso;
    tope_llantas: boolean;
    createdAt?: unknown;
}

interface InspeccionDoc {
    id: string;
    id_infraestructura: string;
    nombre_infraestructura: string;
    hallazgos: string[];
    requiere_mantenimiento: boolean;
    estado_inspeccion: EstadoInspeccion;
    fecha_inspeccion: string;
    createdAt?: unknown;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIPO_ZONA_LABEL: Record<TipoZona, string> = {
    PARQUEADERO_MOTOS: 'Parqueadero Motos',
    PARQUEADERO_BICICLETAS: 'Parqueadero Bicicletas',
    PARQUEADERO_VEHICULOS: 'Parqueadero Vehículos',
    VIA_INTERNA: 'Vía Interna',
    ACCESO_PRINCIPAL: 'Acceso Principal',
};

const TIPO_ZONA_EMOJI: Record<TipoZona, string> = {
    PARQUEADERO_MOTOS: '🏍️',
    PARQUEADERO_BICICLETAS: '🚲',
    PARQUEADERO_VEHICULOS: '🚗',
    VIA_INTERNA: '🛣️',
    ACCESO_PRINCIPAL: '🚪',
};

const TIPO_RIESGO_LABEL: Record<TipoRiesgoVial, string> = {
    ALTA_ACCIDENTALIDAD: 'Alta Accidentalidad',
    ZONA_DERRUMBES: 'Zona de Derrumbes',
    FALTA_ILUMINACION: 'Falta de Iluminación',
    INSEGURIDAD_PUBLICA: 'Inseguridad Pública',
    CONGESTION_SEVERA: 'Congestión Severa',
};

const NIVEL_RIESGO_COLOR: Record<NivelRiesgo, string> = {
    BAJO: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    MEDIO: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    ALTO: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    CRITICO: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const SENALIZACION_LABEL: Record<Senalizacion, string> = {
    PARE: 'Señal PARE',
    CEDA_EL_PASO: 'Ceda el Paso',
    VELOCIDAD_MAXIMA: 'Velocidad Máxima',
    ZONA_PEATONAL: 'Zona Peatonal',
};

const ESTADO_COLOR: Record<EstadoInspeccion, string> = {
    ABIERTA: 'bg-red-500/20 text-red-400 border-red-500/30',
    EN_PROCESO: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    CERRADA: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

const ESTADO_NEXT: Record<EstadoInspeccion, EstadoInspeccion | null> = {
    ABIERTA: 'EN_PROCESO',
    EN_PROCESO: 'CERRADA',
    CERRADA: null,
};

const ESTADO_LABEL: Record<EstadoInspeccion, string> = {
    ABIERTA: 'Abierta',
    EN_PROCESO: 'En Proceso',
    CERRADA: 'Cerrada',
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RutasPuntosCriticosPage() {
    const firestore = useFirestore();
    const { profile } = useUser();
    const empresaId = profile?.empresaId ?? '';

    const [loadingRuta, setLoadingRuta] = useState(false);
    const [loadingPunto, setLoadingPunto] = useState(false);
    const [loadingInfra, setLoadingInfra] = useState(false);
    const [loadingInspeccion, setLoadingInspeccion] = useState(false);
    const [isRutaOpen, setIsRutaOpen] = useState(false);
    const [isPuntoOpen, setIsPuntoOpen] = useState(false);
    const [isInfraOpen, setIsInfraOpen] = useState(false);
    const [isInspeccionOpen, setIsInspeccionOpen] = useState(false);
    const [editingRutaId, setEditingRutaId] = useState<string | null>(null);

    const defaultRutaForm = {
        nombre_ruta: '', tipo_ruta: 'Vía Nacional' as TipoRuta,
        origen: '', destino: '', distancia_km: 0, tiempo_estimado_min: 0,
        frecuencia_uso: 'Diaria' as FrecuenciaUso,
    };
    const [rutaForm, setRutaForm] = useState(defaultRutaForm);

    const defaultPuntoForm = {
        nombre_punto: '', id_ruta_asociada: '', latitud: '', longitud: '',
        tipo_riesgo_vial: 'ALTA_ACCIDENTALIDAD' as TipoRiesgoVial,
        nivel_riesgo: 'MEDIO' as NivelRiesgo, medida_control: '',
    };
    const [puntoForm, setPuntoForm] = useState(defaultPuntoForm);

    const defaultInfraForm = {
        tipo_zona: 'PARQUEADERO_VEHICULOS' as TipoZona, nombre_zona: '',
        limite_velocidad: 10, flujo_peatonal_separado: false,
        inventario_senalizacion: [] as Senalizacion[],
        estado_acabado_piso: 'Bueno' as EstadoPiso, tope_llantas: false,
    };
    const [infraForm, setInfraForm] = useState(defaultInfraForm);

    const [inspeccionForm, setInspeccionForm] = useState({
        id_infraestructura: '', nombre_infraestructura: '',
        hallazgos: [''], requiere_mantenimiento: false,
        fecha_inspeccion: new Date().toISOString().slice(0, 10),
    });

    // ─── Firestore refs ───────────────────────────────────────────────────────

    const rutasColRef = useMemoFirebase(() => {
        if (!firestore || !empresaId) return null;
        return collection(firestore, 'empresas', empresaId, 'rutas_desplazamientos');
    }, [firestore, empresaId]);
    const rutasQuery = useMemoFirebase(() => rutasColRef ? query(rutasColRef, orderBy('createdAt', 'desc')) : null, [rutasColRef]);
    const { data: rutas } = useCollection<RutaDoc>(rutasQuery);

    const puntosColRef = useMemoFirebase(() => {
        if (!firestore || !empresaId) return null;
        return collection(firestore, 'empresas', empresaId, 'puntos_criticos');
    }, [firestore, empresaId]);
    const puntosQuery = useMemoFirebase(() => puntosColRef ? query(puntosColRef, orderBy('createdAt', 'desc')) : null, [puntosColRef]);
    const { data: puntos } = useCollection<PuntoCriticoDoc>(puntosQuery);

    const infraColRef = useMemoFirebase(() => {
        if (!firestore || !empresaId) return null;
        return collection(firestore, 'empresas', empresaId, 'infraestructura_interna');
    }, [firestore, empresaId]);
    const infraQuery = useMemoFirebase(() => infraColRef ? query(infraColRef, orderBy('createdAt', 'desc')) : null, [infraColRef]);
    const { data: infraestructura } = useCollection<InfraestructuraDoc>(infraQuery);

    const inspeccionesColRef = useMemoFirebase(() => {
        if (!firestore || !empresaId) return null;
        return collection(firestore, 'empresas', empresaId, 'inspecciones_viales');
    }, [firestore, empresaId]);
    const inspeccionesQuery = useMemoFirebase(() => inspeccionesColRef ? query(inspeccionesColRef, orderBy('createdAt', 'desc')) : null, [inspeccionesColRef]);
    const { data: inspecciones } = useCollection<InspeccionDoc>(inspeccionesQuery);

    // ─── Computed ─────────────────────────────────────────────────────────────

    const kanban = useMemo(() => ({
        ABIERTA: inspecciones?.filter(i => i.estado_inspeccion === 'ABIERTA') ?? [],
        EN_PROCESO: inspecciones?.filter(i => i.estado_inspeccion === 'EN_PROCESO') ?? [],
        CERRADA: inspecciones?.filter(i => i.estado_inspeccion === 'CERRADA') ?? [],
    }), [inspecciones]);

    const criticosCount = puntos?.filter(p => p.nivel_riesgo === 'CRITICO' || p.nivel_riesgo === 'ALTO').length ?? 0;

    // ─── Handlers: Rutas ─────────────────────────────────────────────────────

    const handleSaveRuta = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !rutasColRef || !empresaId) return;
        if (!rutaForm.nombre_ruta.trim() || !rutaForm.origen.trim() || !rutaForm.destino.trim()) {
            toast({ title: 'Error', description: 'Nombre, origen y destino son obligatorios.', variant: 'destructive' });
            return;
        }
        setLoadingRuta(true);
        try {
            if (editingRutaId) {
                await updateDoc(doc(firestore, 'empresas', empresaId, 'rutas_desplazamientos', editingRutaId), rutaForm);
                toast({ title: 'Ruta actualizada' });
            } else {
                await addDoc(rutasColRef, { ...rutaForm, createdAt: serverTimestamp() });
                toast({ title: 'Ruta registrada' });
            }
            setIsRutaOpen(false);
            setEditingRutaId(null);
            setRutaForm(defaultRutaForm);
        } catch {
            toast({ title: 'Error', description: 'No se pudo guardar.', variant: 'destructive' });
        } finally {
            setLoadingRuta(false);
        }
    };

    const handleEditRuta = (r: RutaDoc) => {
        setRutaForm({ nombre_ruta: r.nombre_ruta, tipo_ruta: r.tipo_ruta, origen: r.origen, destino: r.destino, distancia_km: r.distancia_km, tiempo_estimado_min: r.tiempo_estimado_min, frecuencia_uso: r.frecuencia_uso });
        setEditingRutaId(r.id);
        setIsRutaOpen(true);
    };

    const handleDeleteRuta = async (id: string) => {
        if (!firestore || !empresaId) return;
        await deleteDoc(doc(firestore, 'empresas', empresaId, 'rutas_desplazamientos', id));
        toast({ title: 'Ruta eliminada' });
    };

    // ─── Handlers: Puntos Críticos ────────────────────────────────────────────

    const handleSavePunto = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !puntosColRef) return;
        if (!puntoForm.nombre_punto.trim() || !puntoForm.medida_control.trim()) {
            toast({ title: 'Error', description: 'Nombre y medida de control son obligatorios.', variant: 'destructive' });
            return;
        }
        setLoadingPunto(true);
        try {
            await addDoc(puntosColRef, { ...puntoForm, createdAt: serverTimestamp() });
            toast({ title: 'Punto crítico registrado' });
            setIsPuntoOpen(false);
            setPuntoForm(defaultPuntoForm);
        } catch {
            toast({ title: 'Error', description: 'No se pudo guardar.', variant: 'destructive' });
        } finally {
            setLoadingPunto(false);
        }
    };

    const handleDeletePunto = async (id: string) => {
        if (!firestore || !empresaId) return;
        await deleteDoc(doc(firestore, 'empresas', empresaId, 'puntos_criticos', id));
        toast({ title: 'Punto crítico eliminado' });
    };

    // ─── Handlers: Infraestructura ────────────────────────────────────────────

    const handleSaveInfra = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !infraColRef) return;
        if (!infraForm.nombre_zona.trim()) {
            toast({ title: 'Error', description: 'El nombre de la zona es obligatorio.', variant: 'destructive' });
            return;
        }
        setLoadingInfra(true);
        try {
            await addDoc(infraColRef, { ...infraForm, createdAt: serverTimestamp() });
            toast({ title: 'Zona registrada' });
            setIsInfraOpen(false);
            setInfraForm(defaultInfraForm);
        } catch {
            toast({ title: 'Error', description: 'No se pudo guardar.', variant: 'destructive' });
        } finally {
            setLoadingInfra(false);
        }
    };

    const handleDeleteInfra = async (id: string) => {
        if (!firestore || !empresaId) return;
        await deleteDoc(doc(firestore, 'empresas', empresaId, 'infraestructura_interna', id));
        toast({ title: 'Zona eliminada' });
    };

    // ─── Handlers: Inspecciones ───────────────────────────────────────────────

    const handleSaveInspeccion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !inspeccionesColRef) return;
        const hallazgosLimpios = inspeccionForm.hallazgos.filter(h => h.trim() !== '');
        if (!inspeccionForm.nombre_infraestructura.trim() || hallazgosLimpios.length === 0) {
            toast({ title: 'Error', description: 'Zona inspeccionada y al menos un hallazgo son obligatorios.', variant: 'destructive' });
            return;
        }
        setLoadingInspeccion(true);
        try {
            await addDoc(inspeccionesColRef, {
                ...inspeccionForm,
                hallazgos: hallazgosLimpios,
                estado_inspeccion: 'ABIERTA',
                createdAt: serverTimestamp(),
            });
            toast({ title: 'Inspección registrada', description: 'Agregada a la columna Abierta.' });
            setIsInspeccionOpen(false);
            setInspeccionForm({ id_infraestructura: '', nombre_infraestructura: '', hallazgos: [''], requiere_mantenimiento: false, fecha_inspeccion: new Date().toISOString().slice(0, 10) });
        } catch {
            toast({ title: 'Error', description: 'No se pudo guardar.', variant: 'destructive' });
        } finally {
            setLoadingInspeccion(false);
        }
    };

    const handleMoveInspeccion = async (id: string, next: EstadoInspeccion) => {
        if (!firestore || !empresaId) return;
        await updateDoc(doc(firestore, 'empresas', empresaId, 'inspecciones_viales', id), { estado_inspeccion: next });
        toast({ title: `Movido a "${ESTADO_LABEL[next]}"` });
    };

    const handleDeleteInspeccion = async (id: string) => {
        if (!firestore || !empresaId) return;
        await deleteDoc(doc(firestore, 'empresas', empresaId, 'inspecciones_viales', id));
        toast({ title: 'Inspección eliminada' });
    };

    const toggleSenalizacion = (s: Senalizacion) => {
        const arr = infraForm.inventario_senalizacion;
        setInfraForm(p => ({ ...p, inventario_senalizacion: arr.includes(s) ? arr.filter(x => x !== s) : [...arr, s] }));
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight uppercase italic">
                        Rutas y Puntos Críticos
                    </h1>
                    <p className="text-text-secondary mt-1">
                        Inventario vial, geocodificación del riesgo e infraestructura administrada — Paso 14
                    </p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <Badge className="bg-primary/20 text-primary border-primary/30 px-3 py-1 font-bold text-xs">
                        <Navigation className="size-3 mr-1" /> {rutas?.length ?? 0} Rutas
                    </Badge>
                    <Badge className={`px-3 py-1 font-bold text-xs ${criticosCount > 0 ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-white/10 text-text-secondary border-white/10'}`}>
                        <AlertTriangle className="size-3 mr-1" /> {criticosCount} Críticos/Altos
                    </Badge>
                    <Badge className={`px-3 py-1 font-bold text-xs ${kanban.ABIERTA.length > 0 ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-white/10 text-text-secondary border-white/10'}`}>
                        <Clock className="size-3 mr-1" /> {kanban.ABIERTA.length} Inspecciones abiertas
                    </Badge>
                </div>
            </div>

            <Tabs defaultValue="rutas" className="w-full">
                <TabsList className="bg-surface-dark border-border-dark p-1 h-auto flex flex-wrap gap-1">
                    <TabsTrigger value="rutas" className="font-bold gap-1.5 py-2">
                        <Navigation className="size-4" /> Rutas
                    </TabsTrigger>
                    <TabsTrigger value="puntos" className="font-bold gap-1.5 py-2">
                        <ShieldAlert className="size-4" /> Puntos Críticos
                    </TabsTrigger>
                    <TabsTrigger value="infraestructura" className="font-bold gap-1.5 py-2">
                        <Building2 className="size-4" /> Infraestructura Interna
                    </TabsTrigger>
                    <TabsTrigger value="inspecciones" className="font-bold gap-1.5 py-2">
                        <ClipboardCheck className="size-4" /> Inspecciones Viales
                    </TabsTrigger>
                </TabsList>

                {/* ── TAB 1: RUTAS ─────────────────────────────────────────── */}
                <TabsContent value="rutas" className="mt-6 space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={() => { setEditingRutaId(null); setRutaForm(defaultRutaForm); setIsRutaOpen(true); }} className="bg-primary font-black uppercase h-11 px-6 gap-2">
                            <Plus className="size-4" /> Nueva Ruta
                        </Button>
                    </div>

                    {(!rutas || rutas.length === 0) ? (
                        <Card className="bg-surface-dark border-border-dark">
                            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                                <Map className="size-14 mx-auto mb-4 opacity-10" />
                                <p className="text-lg font-black text-text-secondary uppercase">Sin rutas registradas</p>
                                <p className="text-sm text-text-secondary mt-2">Mapea las rutas de desplazamiento de tu operación.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {rutas.map(r => {
                                const puntosRuta = puntos?.filter(p => p.id_ruta_asociada === r.id) ?? [];
                                const hasCritico = puntosRuta.some(p => p.nivel_riesgo === 'CRITICO');
                                return (
                                    <Card key={r.id} className={`bg-surface-dark border-border-dark hover:border-primary/50 transition-all group overflow-hidden flex flex-col ${hasCritico ? 'border-l-4 border-l-red-500' : ''}`}>
                                        <div className="bg-primary/5 p-4 border-b border-border-dark relative">
                                            <MapPin className="absolute right-3 bottom-3 size-10 text-primary/8" />
                                            <h3 className="text-sm font-black text-foreground uppercase line-clamp-2 pr-4">{r.nombre_ruta}</h3>
                                            <Badge variant="outline" className="mt-2 text-[9px] border-primary/30 text-primary">{r.tipo_ruta}</Badge>
                                        </div>
                                        <CardContent className="p-4 flex-1 space-y-3">
                                            <div className="flex items-center gap-2 text-xs text-text-secondary">
                                                <span>{r.origen}</span>
                                                <ChevronRight className="size-3 text-primary shrink-0" />
                                                <span>{r.destino}</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-center">
                                                <div className="bg-white/5 rounded-lg p-2">
                                                    <p className="text-base font-black text-foreground">{r.distancia_km}</p>
                                                    <p className="text-[9px] text-text-secondary uppercase">km</p>
                                                </div>
                                                <div className="bg-white/5 rounded-lg p-2">
                                                    <p className="text-base font-black text-foreground">{r.tiempo_estimado_min}</p>
                                                    <p className="text-[9px] text-text-secondary uppercase">min</p>
                                                </div>
                                                <div className={`rounded-lg p-2 ${puntosRuta.length > 0 ? 'bg-red-500/10' : 'bg-white/5'}`}>
                                                    <p className={`text-base font-black ${puntosRuta.length > 0 ? 'text-red-400' : 'text-foreground'}`}>{puntosRuta.length}</p>
                                                    <p className="text-[9px] text-text-secondary uppercase">críticos</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <Badge className="text-[9px] bg-white/10 text-text-secondary border-white/10">{r.frecuencia_uso}</Badge>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button size="icon" variant="ghost" className="size-7" onClick={() => handleEditRuta(r)}><Wrench className="size-3.5" /></Button>
                                                    <Button size="icon" variant="ghost" className="size-7 text-red-500/40 hover:text-red-500" onClick={() => handleDeleteRuta(r.id)}><Trash2 className="size-3.5" /></Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* ── TAB 2: PUNTOS CRÍTICOS ────────────────────────────────── */}
                <TabsContent value="puntos" className="mt-6 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex gap-2 flex-wrap">
                            {(['BAJO', 'MEDIO', 'ALTO', 'CRITICO'] as NivelRiesgo[]).map(n => (
                                <Badge key={n} className={`px-3 py-1 font-bold text-xs ${NIVEL_RIESGO_COLOR[n]}`}>
                                    {puntos?.filter(p => p.nivel_riesgo === n).length ?? 0} {n}
                                </Badge>
                            ))}
                        </div>
                        <Button onClick={() => setIsPuntoOpen(true)} className="bg-primary font-black uppercase h-11 px-6 gap-2">
                            <Plus className="size-4" /> Nuevo Punto
                        </Button>
                    </div>

                    {(!puntos || puntos.length === 0) ? (
                        <Card className="bg-surface-dark border-border-dark">
                            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                                <ShieldAlert className="size-14 mx-auto mb-4 opacity-10" />
                                <p className="text-lg font-black text-text-secondary uppercase">Sin puntos críticos</p>
                                <p className="text-sm text-text-secondary mt-2">Geocodifica los tramos de mayor riesgo vial.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="bg-surface-dark border-border-dark shadow-xl">
                            <CardContent className="p-0 overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border-dark">
                                            <TableHead className="text-[10px] uppercase">Punto / Ubicación</TableHead>
                                            <TableHead className="text-[10px] uppercase">Ruta Asociada</TableHead>
                                            <TableHead className="text-[10px] uppercase">Tipo de Riesgo</TableHead>
                                            <TableHead className="text-[10px] uppercase text-center">Nivel</TableHead>
                                            <TableHead className="text-[10px] uppercase">Medida de Control</TableHead>
                                            <TableHead className="text-[10px] uppercase">Coords.</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {puntos.map(p => {
                                            const ruta = rutas?.find(r => r.id === p.id_ruta_asociada);
                                            return (
                                                <TableRow key={p.id} className="border-border-dark text-xs hover:bg-white/[0.02]">
                                                    <TableCell className="font-bold text-foreground max-w-[160px]">{p.nombre_punto}</TableCell>
                                                    <TableCell className="text-text-secondary text-[11px]">{ruta?.nombre_ruta ?? '—'}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-[9px] border-border-dark text-text-secondary">
                                                            {TIPO_RIESGO_LABEL[p.tipo_riesgo_vial]}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge className={`text-[9px] font-black ${NIVEL_RIESGO_COLOR[p.nivel_riesgo]}`}>
                                                            {p.nivel_riesgo}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-text-secondary text-[11px] max-w-[200px]">{p.medida_control}</TableCell>
                                                    <TableCell className="text-text-secondary/50 font-mono text-[10px]">
                                                        {p.latitud && p.longitud ? `${p.latitud},${p.longitud}` : '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button size="icon" variant="ghost" className="size-7 text-red-500/40 hover:text-red-500" onClick={() => handleDeletePunto(p.id)}>
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* ── TAB 3: INFRAESTRUCTURA INTERNA ───────────────────────── */}
                <TabsContent value="infraestructura" className="mt-6 space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={() => setIsInfraOpen(true)} className="bg-primary font-black uppercase h-11 px-6 gap-2">
                            <Plus className="size-4" /> Nueva Zona
                        </Button>
                    </div>

                    {(!infraestructura || infraestructura.length === 0) ? (
                        <Card className="bg-surface-dark border-border-dark">
                            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                                <Building2 className="size-14 mx-auto mb-4 opacity-10" />
                                <p className="text-lg font-black text-text-secondary uppercase">Sin infraestructura registrada</p>
                                <p className="text-sm text-text-secondary mt-2">Registra parqueaderos, vías internas y accesos.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {infraestructura.map(z => {
                                const estadoColor = z.estado_acabado_piso === 'Bueno'
                                    ? 'text-emerald-400'
                                    : z.estado_acabado_piso === 'Regular'
                                        ? 'text-amber-400'
                                        : 'text-red-400';
                                return (
                                    <Card key={z.id} className="bg-surface-dark border-border-dark hover:border-primary/40 transition-all group">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">{TIPO_ZONA_EMOJI[z.tipo_zona]}</span>
                                                    <div>
                                                        <p className="text-xs font-black text-foreground uppercase">{z.nombre_zona}</p>
                                                        <p className="text-[10px] text-text-secondary">{TIPO_ZONA_LABEL[z.tipo_zona]}</p>
                                                    </div>
                                                </div>
                                                <Button size="icon" variant="ghost" className="size-7 text-red-500/20 hover:text-red-500 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteInfra(z.id)}>
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-2 pt-0">
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="p-2 bg-white/5 rounded-lg">
                                                    <p className="text-[9px] text-text-secondary uppercase">Límite vel.</p>
                                                    <p className="font-black text-foreground">{z.limite_velocidad} km/h</p>
                                                </div>
                                                <div className="p-2 bg-white/5 rounded-lg">
                                                    <p className="text-[9px] text-text-secondary uppercase">Piso</p>
                                                    <p className={`font-black ${estadoColor}`}>{z.estado_acabado_piso}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {z.flujo_peatonal_separado && (
                                                    <Badge className="text-[9px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Peat. segregado</Badge>
                                                )}
                                                {z.tope_llantas && (
                                                    <Badge className="text-[9px] bg-blue-500/20 text-blue-400 border-blue-500/30">Tope llantas</Badge>
                                                )}
                                                {(z.inventario_senalizacion ?? []).map(s => (
                                                    <Badge key={s} className="text-[9px] bg-white/10 text-text-secondary border-white/10">
                                                        {SENALIZACION_LABEL[s]}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* ── TAB 4: INSPECCIONES VIALES (KANBAN) ──────────────────── */}
                <TabsContent value="inspecciones" className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-text-secondary">
                            Bitácora de mantenimiento — avanza el estado de cada hallazgo.
                        </p>
                        <Button onClick={() => setIsInspeccionOpen(true)} className="bg-primary font-black uppercase h-11 px-6 gap-2">
                            <Plus className="size-4" /> Nueva Inspección
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(['ABIERTA', 'EN_PROCESO', 'CERRADA'] as EstadoInspeccion[]).map(estado => (
                            <div key={estado} className="space-y-3">
                                <div className={`p-3 rounded-xl border flex items-center gap-2 ${ESTADO_COLOR[estado]}`}>
                                    {estado === 'ABIERTA' && <AlertCircle className="size-4 shrink-0" />}
                                    {estado === 'EN_PROCESO' && <Clock className="size-4 shrink-0" />}
                                    {estado === 'CERRADA' && <CheckCircle2 className="size-4 shrink-0" />}
                                    <span className="text-xs font-black uppercase tracking-widest">{ESTADO_LABEL[estado]}</span>
                                    <span className="ml-auto text-xs font-black">{kanban[estado].length}</span>
                                </div>

                                <div className="space-y-3 min-h-[80px]">
                                    {kanban[estado].length === 0 ? (
                                        <div className="h-20 border border-dashed border-border-dark rounded-xl flex items-center justify-center opacity-30">
                                            <p className="text-xs text-text-secondary">Sin registros</p>
                                        </div>
                                    ) : (
                                        kanban[estado].map(insp => (
                                            <Card key={insp.id} className="bg-surface-dark border-border-dark hover:border-primary/30 transition-all group">
                                                <CardContent className="p-4 space-y-3">
                                                    <div>
                                                        <p className="text-xs font-black text-foreground uppercase">{insp.nombre_infraestructura}</p>
                                                        <p className="text-[10px] text-text-secondary">{insp.fecha_inspeccion}</p>
                                                    </div>
                                                    {insp.hallazgos.length > 0 && (
                                                        <ul className="space-y-1">
                                                            {insp.hallazgos.slice(0, 3).map((h, i) => (
                                                                <li key={i} className="text-[11px] text-text-secondary flex items-start gap-1.5">
                                                                    <span className="text-primary mt-0.5 shrink-0">•</span>
                                                                    <span className="line-clamp-1">{h}</span>
                                                                </li>
                                                            ))}
                                                            {insp.hallazgos.length > 3 && (
                                                                <li className="text-[10px] text-text-secondary/50 italic">+{insp.hallazgos.length - 3} más...</li>
                                                            )}
                                                        </ul>
                                                    )}
                                                    {insp.requiere_mantenimiento && (
                                                        <Badge className="text-[9px] bg-red-500/20 text-red-400 border-red-500/30">
                                                            <Wrench className="size-3 mr-1" /> Requiere mantenimiento
                                                        </Badge>
                                                    )}
                                                    <div className="flex gap-2">
                                                        {ESTADO_NEXT[estado] && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="flex-1 text-[10px] font-bold border-border-dark gap-1 h-8"
                                                                onClick={() => handleMoveInspeccion(insp.id, ESTADO_NEXT[estado]!)}
                                                            >
                                                                <ArrowRight className="size-3" />
                                                                {ESTADO_LABEL[ESTADO_NEXT[estado]!]}
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="size-8 text-red-500/30 hover:text-red-500 shrink-0"
                                                            onClick={() => handleDeleteInspeccion(insp.id)}
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            {/* ── DIALOG: NUEVA / EDITAR RUTA ──────────────────────────────── */}
            <Dialog open={isRutaOpen} onOpenChange={o => { setIsRutaOpen(o); if (!o) setEditingRutaId(null); }}>
                <DialogContent className="max-w-2xl bg-surface-dark border-border-dark text-foreground">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black uppercase flex items-center gap-2">
                            <Navigation className="size-5 text-primary" />
                            {editingRutaId ? 'Editar Ruta' : 'Nueva Ruta de Desplazamiento'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveRuta} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Nombre de la Ruta *</Label>
                                <Input value={rutaForm.nombre_ruta} onChange={e => setRutaForm(p => ({ ...p, nombre_ruta: e.target.value }))} className="bg-background-dark border-border-dark" placeholder="Ej: Ruta Distribución Norte — Sede Principal" required />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Tipo de Ruta</Label>
                                <Select value={rutaForm.tipo_ruta} onValueChange={v => setRutaForm(p => ({ ...p, tipo_ruta: v as TipoRuta }))}>
                                    <SelectTrigger className="bg-background-dark border-border-dark"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {(['Vía Urbana', 'Vía Nacional', 'Vía Rural', 'Vía Interna/Privada'] as TipoRuta[]).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Frecuencia de Uso</Label>
                                <Select value={rutaForm.frecuencia_uso} onValueChange={v => setRutaForm(p => ({ ...p, frecuencia_uso: v as FrecuenciaUso }))}>
                                    <SelectTrigger className="bg-background-dark border-border-dark"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {(['Diaria', 'Semanal', 'Mensual', 'Ocasional'] as FrecuenciaUso[]).map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Origen *</Label>
                                <Input value={rutaForm.origen} onChange={e => setRutaForm(p => ({ ...p, origen: e.target.value }))} className="bg-background-dark border-border-dark" placeholder="Ej: Bogotá Sede Norte" required />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Destino *</Label>
                                <Input value={rutaForm.destino} onChange={e => setRutaForm(p => ({ ...p, destino: e.target.value }))} className="bg-background-dark border-border-dark" placeholder="Ej: Medellín Planta" required />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Distancia (km)</Label>
                                <Input type="number" min={0} value={rutaForm.distancia_km} onChange={e => setRutaForm(p => ({ ...p, distancia_km: Number(e.target.value) }))} className="bg-background-dark border-border-dark" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Tiempo Estimado (min)</Label>
                                <Input type="number" min={0} value={rutaForm.tiempo_estimado_min} onChange={e => setRutaForm(p => ({ ...p, tiempo_estimado_min: Number(e.target.value) }))} className="bg-background-dark border-border-dark" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={loadingRuta} className="bg-primary font-black uppercase h-11 gap-2">
                                <Save className="size-4" /> {editingRutaId ? 'Actualizar' : 'Guardar Ruta'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── DIALOG: NUEVO PUNTO CRÍTICO ──────────────────────────────── */}
            <Dialog open={isPuntoOpen} onOpenChange={setIsPuntoOpen}>
                <DialogContent className="max-w-2xl bg-surface-dark border-border-dark text-foreground">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black uppercase flex items-center gap-2">
                            <ShieldAlert className="size-5 text-primary" /> Nuevo Punto Crítico
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSavePunto} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Nombre / Descripción *</Label>
                                <Input value={puntoForm.nombre_punto} onChange={e => setPuntoForm(p => ({ ...p, nombre_punto: e.target.value }))} className="bg-background-dark border-border-dark" placeholder="Ej: Curva del Km 42 — Vía Bogotá-Tunja" required />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Ruta Asociada</Label>
                                <Select value={puntoForm.id_ruta_asociada} onValueChange={v => setPuntoForm(p => ({ ...p, id_ruta_asociada: v }))}>
                                    <SelectTrigger className="bg-background-dark border-border-dark"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                    <SelectContent>
                                        {(rutas ?? []).map(r => <SelectItem key={r.id} value={r.id}>{r.nombre_ruta}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Tipo de Riesgo</Label>
                                <Select value={puntoForm.tipo_riesgo_vial} onValueChange={v => setPuntoForm(p => ({ ...p, tipo_riesgo_vial: v as TipoRiesgoVial }))}>
                                    <SelectTrigger className="bg-background-dark border-border-dark"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {(Object.entries(TIPO_RIESGO_LABEL) as [TipoRiesgoVial, string][]).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Nivel de Riesgo</Label>
                                <Select value={puntoForm.nivel_riesgo} onValueChange={v => setPuntoForm(p => ({ ...p, nivel_riesgo: v as NivelRiesgo }))}>
                                    <SelectTrigger className="bg-background-dark border-border-dark"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {(['BAJO', 'MEDIO', 'ALTO', 'CRITICO'] as NivelRiesgo[]).map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Latitud (opcional)</Label>
                                <Input value={puntoForm.latitud} onChange={e => setPuntoForm(p => ({ ...p, latitud: e.target.value }))} className="bg-background-dark border-border-dark font-mono" placeholder="Ej: 4.7109" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Longitud (opcional)</Label>
                                <Input value={puntoForm.longitud} onChange={e => setPuntoForm(p => ({ ...p, longitud: e.target.value }))} className="bg-background-dark border-border-dark font-mono" placeholder="Ej: -74.0721" />
                            </div>
                            <div className="col-span-2 space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Medida de Control *</Label>
                                <Textarea value={puntoForm.medida_control} onChange={e => setPuntoForm(p => ({ ...p, medida_control: e.target.value }))} className="bg-background-dark border-border-dark min-h-[80px]" placeholder="Ej: Reducir velocidad a 30 km/h y activar luces exploradoras." required />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={loadingPunto} className="bg-primary font-black uppercase h-11 gap-2">
                                <Save className="size-4" /> Guardar Punto
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── DIALOG: NUEVA INFRAESTRUCTURA ────────────────────────────── */}
            <Dialog open={isInfraOpen} onOpenChange={setIsInfraOpen}>
                <DialogContent className="max-w-2xl bg-surface-dark border-border-dark text-foreground">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black uppercase flex items-center gap-2">
                            <Building2 className="size-5 text-primary" /> Nueva Zona de Infraestructura
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveInfra} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Tipo de Zona</Label>
                                <Select value={infraForm.tipo_zona} onValueChange={v => setInfraForm(p => ({ ...p, tipo_zona: v as TipoZona }))}>
                                    <SelectTrigger className="bg-background-dark border-border-dark"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {(Object.entries(TIPO_ZONA_LABEL) as [TipoZona, string][]).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Nombre / Identificador *</Label>
                                <Input value={infraForm.nombre_zona} onChange={e => setInfraForm(p => ({ ...p, nombre_zona: e.target.value }))} className="bg-background-dark border-border-dark" placeholder="Ej: Parqueadero Bloque A" required />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Límite de Velocidad (km/h)</Label>
                                <Input type="number" min={5} max={80} value={infraForm.limite_velocidad} onChange={e => setInfraForm(p => ({ ...p, limite_velocidad: Number(e.target.value) }))} className="bg-background-dark border-border-dark" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Estado del Piso</Label>
                                <Select value={infraForm.estado_acabado_piso} onValueChange={v => setInfraForm(p => ({ ...p, estado_acabado_piso: v as EstadoPiso }))}>
                                    <SelectTrigger className="bg-background-dark border-border-dark"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {(['Bueno', 'Regular', 'Malo'] as EstadoPiso[]).map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2 space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Señalización Disponible</Label>
                                <div className="flex flex-wrap gap-3">
                                    {(['PARE', 'CEDA_EL_PASO', 'VELOCIDAD_MAXIMA', 'ZONA_PEATONAL'] as Senalizacion[]).map(s => (
                                        <div key={s} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-border-dark">
                                            <Checkbox id={`sen-${s}`} checked={infraForm.inventario_senalizacion.includes(s)} onCheckedChange={() => toggleSenalizacion(s)} className="border-primary data-[state=checked]:bg-primary" />
                                            <Label htmlFor={`sen-${s}`} className="text-xs text-foreground cursor-pointer">{SENALIZACION_LABEL[s]}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-border-dark">
                                <Checkbox id="peatonal" checked={infraForm.flujo_peatonal_separado} onCheckedChange={v => setInfraForm(p => ({ ...p, flujo_peatonal_separado: !!v }))} className="border-primary data-[state=checked]:bg-primary" />
                                <Label htmlFor="peatonal" className="text-sm text-foreground cursor-pointer">¿Flujo peatonal segregado?</Label>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-border-dark">
                                <Checkbox id="tope" checked={infraForm.tope_llantas} onCheckedChange={v => setInfraForm(p => ({ ...p, tope_llantas: !!v }))} className="border-primary data-[state=checked]:bg-primary" />
                                <Label htmlFor="tope" className="text-sm text-foreground cursor-pointer">¿Tiene topes para llantas?</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={loadingInfra} className="bg-primary font-black uppercase h-11 gap-2">
                                <Save className="size-4" /> Guardar Zona
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── DIALOG: NUEVA INSPECCIÓN ──────────────────────────────────── */}
            <Dialog open={isInspeccionOpen} onOpenChange={setIsInspeccionOpen}>
                <DialogContent className="max-w-2xl bg-surface-dark border-border-dark text-foreground">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black uppercase flex items-center gap-2">
                            <ClipboardCheck className="size-5 text-primary" /> Nueva Inspección Vial
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveInspeccion} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Zona Inspeccionada *</Label>
                                <Select value={inspeccionForm.id_infraestructura} onValueChange={v => {
                                    const z = infraestructura?.find(i => i.id === v);
                                    setInspeccionForm(p => ({ ...p, id_infraestructura: v, nombre_infraestructura: z?.nombre_zona ?? '' }));
                                }}>
                                    <SelectTrigger className="bg-background-dark border-border-dark"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                    <SelectContent>
                                        {(infraestructura ?? []).map(z => <SelectItem key={z.id} value={z.id}>{z.nombre_zona}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Input value={inspeccionForm.nombre_infraestructura} onChange={e => setInspeccionForm(p => ({ ...p, nombre_infraestructura: e.target.value }))} className="bg-background-dark border-border-dark text-xs" placeholder="O escribir nombre manualmente..." />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Fecha de Inspección</Label>
                                <Input type="date" value={inspeccionForm.fecha_inspeccion} onChange={e => setInspeccionForm(p => ({ ...p, fecha_inspeccion: e.target.value }))} className="bg-background-dark border-border-dark" />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Hallazgos *</Label>
                                {inspeccionForm.hallazgos.map((h, i) => (
                                    <div key={i} className="flex gap-2">
                                        <Input value={h} onChange={e => {
                                            const next = [...inspeccionForm.hallazgos];
                                            next[i] = e.target.value;
                                            setInspeccionForm(p => ({ ...p, hallazgos: next }));
                                        }} className="bg-background-dark border-border-dark" placeholder={`Hallazgo ${i + 1}...`} />
                                        {inspeccionForm.hallazgos.length > 1 && (
                                            <Button type="button" size="icon" variant="ghost" className="text-red-500/40 hover:text-red-500 shrink-0" onClick={() => setInspeccionForm(p => ({ ...p, hallazgos: p.hallazgos.filter((_, idx) => idx !== i) }))}>
                                                <Trash2 className="size-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button type="button" variant="outline" className="w-full border-border-dark text-xs font-bold gap-2 h-9" onClick={() => setInspeccionForm(p => ({ ...p, hallazgos: [...p.hallazgos, ''] }))}>
                                    <Plus className="size-3" /> Agregar hallazgo
                                </Button>
                            </div>
                            <div className="col-span-2 flex items-center gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                                <Checkbox id="mantto" checked={inspeccionForm.requiere_mantenimiento} onCheckedChange={v => setInspeccionForm(p => ({ ...p, requiere_mantenimiento: !!v }))} className="border-red-400 data-[state=checked]:bg-red-500" />
                                <Label htmlFor="mantto" className="text-sm text-foreground cursor-pointer">
                                    ¿Requiere mantenimiento urgente?
                                    <span className="text-[10px] text-text-secondary ml-1">(alerta al área de infraestructura)</span>
                                </Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={loadingInspeccion} className="bg-primary font-black uppercase h-11 gap-2">
                                <Save className="size-4" /> Registrar Inspección
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
