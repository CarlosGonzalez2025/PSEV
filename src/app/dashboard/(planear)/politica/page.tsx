'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import {
    FileText, Target, Send, Save, Plus, Trash2, Edit2,
    ShieldCheck, CheckCircle2, AlertTriangle, Clock, Users,
    TrendingUp, CheckCheck, Calendar, Flag, Link2, Copy, Check,
    ImagePlus, Upload, Award,
} from 'lucide-react';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser } from '@/firebase';
import {
    doc, setDoc, collection, query, serverTimestamp,
    addDoc, updateDoc, deleteDoc, orderBy,
} from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Types

type EstadoMeta = 'Pendiente' | 'En_Progreso' | 'Cumplida' | 'Vencida';
type TipoMeta =
    | 'Reduccion_Siniestros'
    | 'Cobertura_Formacion'
    | 'Mantenimiento_Preventivo'
    | 'Inspeccion_Vehicular'
    | 'Gestion_Riesgos'
    | 'Otro';
type MetodoFirma = 'Email' | 'WhatsApp' | 'Presencial';

interface MetaDoc {
    id: string;
    nombre: string;
    descripcion: string;
    tipo: TipoMeta;
    indicador: string;
    meta_valor: number;
    actual_valor: number;
    unidad: string;
    fecha_inicio: string;
    fecha_limite: string;
    estado: EstadoMeta;
    responsable: string;
    createdAt: unknown;
}

interface DifusionDoc {
    id: string;
    nombre: string;
    cargo: string;
    email?: string;
    aceptado: boolean;
    fechaAceptacion?: string;
    metodo: MetodoFirma;
    createdAt: unknown;
}

// Constants

const TIPO_META_LABEL: Record<TipoMeta, string> = {
    Reduccion_Siniestros: 'Reducción Siniestros',
    Cobertura_Formacion: 'Cobertura Formación',
    Mantenimiento_Preventivo: 'Mantenimiento Preventivo',
    Inspeccion_Vehicular: 'Inspección Vehicular',
    Gestion_Riesgos: 'Gestión de Riesgos',
    Otro: 'Otro',
};

const TIPO_META_COLOR: Record<TipoMeta, string> = {
    Reduccion_Siniestros: 'bg-red-500/10 text-red-400 border border-red-500/20',
    Cobertura_Formacion: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    Mantenimiento_Preventivo: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    Inspeccion_Vehicular: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
    Gestion_Riesgos: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
    Otro: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
};

const ESTADO_META_COLOR: Record<EstadoMeta, string> = {
    Pendiente: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
    En_Progreso: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    Cumplida: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    Vencida: 'bg-red-500/10 text-red-400 border border-red-500/20',
};

const ESTADO_META_LABEL: Record<EstadoMeta, string> = {
    Pendiente: 'Pendiente',
    En_Progreso: 'En Progreso',
    Cumplida: 'Cumplida',
    Vencida: 'Vencida',
};

const LEGAL_CHECKLIST = [
    { label: 'Idoneidad y compromiso de la Alta Dirección', key: 'idoneidad' },
    { label: 'Asignación presupuestal expresa', key: 'presupuesto' },
    { label: 'Difusión a todos los niveles de la organización', key: 'difusion' },
    { label: 'Inclusión de hábitos y comportamientos seguros', key: 'habitos' },
    { label: 'Revisión y actualización periódica documentada', key: 'revision' },
    { label: 'Firma del representante legal', key: 'firma' },
];

const EMPTY_META: Omit<MetaDoc, 'id' | 'createdAt'> = {
    nombre: '',
    descripcion: '',
    tipo: 'Reduccion_Siniestros',
    indicador: '',
    meta_valor: 0,
    actual_valor: 0,
    unidad: '%',
    fecha_inicio: '',
    fecha_limite: '',
    estado: 'Pendiente',
    responsable: '',
};

const EMPTY_DIFUSION: Omit<DifusionDoc, 'id' | 'createdAt'> = {
    nombre: '',
    cargo: '',
    email: '',
    aceptado: false,
    metodo: 'Email',
};

// Helpers

function calcPct(actual: number, meta: number) {
    if (!meta) return 0;
    return Math.min(100, Math.round((actual / meta) * 100));
}

function progressColor(pct: number) {
    if (pct >= 100) return 'bg-emerald-500';
    if (pct >= 60) return 'bg-blue-500';
    if (pct >= 30) return 'bg-amber-500';
    return 'bg-red-500';
}

function progressTextColor(pct: number) {
    if (pct >= 100) return 'text-emerald-400';
    if (pct >= 60) return 'text-blue-400';
    if (pct >= 30) return 'text-amber-400';
    return 'text-red-400';
}

// Component

export default function PoliticaMetasPage() {
    const firestore = useFirestore();
    const { profile } = useUser();

    const [content, setContent] = useState('');
    const [legalChecks, setLegalChecks] = useState<Record<string, boolean>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [urlCopied, setUrlCopied] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const [metaDialog, setMetaDialog] = useState(false);
    const [editingMeta, setEditingMeta] = useState<MetaDoc | null>(null);
    const [metaForm, setMetaForm] = useState<Omit<MetaDoc, 'id' | 'createdAt'>>(EMPTY_META);

    const [difDialog, setDifDialog] = useState(false);
    const [difForm, setDifForm] = useState<Omit<DifusionDoc, 'id' | 'createdAt'>>(EMPTY_DIFUSION);

    // Refs

    const politicaRef = useMemoFirebase(() => {
        if (!firestore || !profile?.empresaId) return null;
        return doc(firestore, 'empresas', profile.empresaId, 'politicasSeguridadVial', 'actual');
    }, [firestore, profile?.empresaId]);

    const metasColRef = useMemoFirebase(() => {
        if (!firestore || !profile?.empresaId) return null;
        return collection(firestore, 'empresas', profile.empresaId, 'metas_pesv');
    }, [firestore, profile?.empresaId]);

    const metasQuery = useMemoFirebase(
        () => metasColRef ? query(metasColRef, orderBy('createdAt', 'desc')) : null,
        [metasColRef],
    );

    const difColRef = useMemoFirebase(() => {
        if (!firestore || !profile?.empresaId) return null;
        return collection(firestore, 'empresas', profile.empresaId, 'difusiones_politica');
    }, [firestore, profile?.empresaId]);

    const difQuery = useMemoFirebase(
        () => difColRef ? query(difColRef, orderBy('createdAt', 'desc')) : null,
        [difColRef],
    );

    // Data

    const { data: politica } = useDoc(politicaRef);
    const { data: metas } = useCollection<MetaDoc>(metasQuery);
    const { data: difusiones } = useCollection<DifusionDoc>(difQuery);

    useEffect(() => {
        if (!politica) return;
        if (politica.contenidoHtml) setContent(politica.contenidoHtml);
        if (politica.legalChecks) setLegalChecks(politica.legalChecks);
    }, [politica]);

    // Computed

    const metaStats = useMemo(() => {
        const list = metas ?? [];
        const total = list.length;
        const cumplidas = list.filter(m => m.estado === 'Cumplida').length;
        const enProgreso = list.filter(m => m.estado === 'En_Progreso').length;
        const vencidas = list.filter(m => m.estado === 'Vencida').length;
        const pendientes = list.filter(m => m.estado === 'Pendiente').length;
        const avgProgress = total
            ? Math.round(list.reduce((acc, m) => acc + calcPct(m.actual_valor, m.meta_valor), 0) / total)
            : 0;
        return { total, cumplidas, enProgreso, vencidas, pendientes, avgProgress };
    }, [metas]);

    const difStats = useMemo(() => {
        const list = difusiones ?? [];
        const total = list.length;
        const firmado = list.filter(d => d.aceptado).length;
        const pendiente = total - firmado;
        const pct = total ? Math.round((firmado / total) * 100) : 0;
        return { total, firmado, pendiente, pct };
    }, [difusiones]);

    const legalScore = useMemo(() => {
        const filled = LEGAL_CHECKLIST.filter(c => legalChecks[c.key]).length;
        return Math.round((filled / LEGAL_CHECKLIST.length) * 100);
    }, [legalChecks]);

    const publicUrl = typeof window !== 'undefined' && profile?.empresaId
        ? `${window.location.origin}/politica/${profile.empresaId}`
        : '';

    // Actions

    const handleSavePolicy = async () => {
        if (!politicaRef) return;
        setIsSaving(true);
        try {
            const prevVersion = politica?.version ? parseFloat(politica.version) : 1.0;
            const nextVersion = (Math.round((prevVersion + 0.1) * 10) / 10).toFixed(1);
            const vencimiento = new Date();
            vencimiento.setFullYear(vencimiento.getFullYear() + 3);
            await setDoc(politicaRef, {
                titulo: 'Política de Seguridad Vial',
                contenidoHtml: content,
                version: nextVersion,
                fechaAprobacion: new Date().toISOString(),
                fechaVencimiento: vencimiento.toISOString(),
                estado: 'Publicada',
                legalChecks,
                actualizadoPor: profile?.email,
                empresaId: profile?.empresaId,
                updatedAt: serverTimestamp(),
            }, { merge: true });
            toast({ title: 'Política publicada', description: `Versión ${nextVersion} guardada. Vigencia 3 años.` });
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la política.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = async (file: File) => {
        if (!politicaRef || !profile?.empresaId) return;
        setIsUploadingImage(true);
        try {
            const storage = getStorage();
            const path = `empresas/${profile.empresaId}/politica-imagen/${Date.now()}_${file.name}`;
            const sRef = storageRef(storage, path);
            const snap = await uploadBytes(sRef, file);
            const url = await getDownloadURL(snap.ref);
            await setDoc(politicaRef, { imagenUrl: url }, { merge: true });
            toast({ title: 'Imagen guardada', description: 'La imagen de la política fue subida exitosamente.' });
        } catch {
            toast({ variant: 'destructive', title: 'Error al subir la imagen.' });
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleCopyUrl = () => {
        if (!publicUrl) return;
        navigator.clipboard.writeText(publicUrl).then(() => {
            setUrlCopied(true);
            setTimeout(() => setUrlCopied(false), 2500);
        });
    };

    const openNewMeta = () => {
        setEditingMeta(null);
        setMetaForm(EMPTY_META);
        setMetaDialog(true);
    };

    const openEditMeta = (m: MetaDoc) => {
        setEditingMeta(m);
        setMetaForm({
            nombre: m.nombre, descripcion: m.descripcion, tipo: m.tipo,
            indicador: m.indicador, meta_valor: m.meta_valor, actual_valor: m.actual_valor,
            unidad: m.unidad, fecha_inicio: m.fecha_inicio, fecha_limite: m.fecha_limite,
            estado: m.estado, responsable: m.responsable,
        });
        setMetaDialog(true);
    };

    const handleSaveMeta = async () => {
        if (!metasColRef || !firestore || !profile?.empresaId) return;
        if (!metaForm.nombre || !metaForm.indicador || !metaForm.fecha_limite) {
            toast({ variant: 'destructive', title: 'Campos requeridos', description: 'Complete nombre, indicador y fecha límite.' });
            return;
        }
        try {
            if (editingMeta) {
                await updateDoc(doc(firestore, 'empresas', profile.empresaId, 'metas_pesv', editingMeta.id), {
                    ...metaForm, updatedAt: serverTimestamp(),
                });
                toast({ title: 'Meta actualizada' });
            } else {
                await addDoc(metasColRef, { ...metaForm, createdAt: serverTimestamp() });
                toast({ title: 'Meta creada' });
            }
            setMetaDialog(false);
        } catch {
            toast({ variant: 'destructive', title: 'Error al guardar la meta.' });
        }
    };

    const handleDeleteMeta = async (id: string) => {
        if (!firestore || !profile?.empresaId) return;
        await deleteDoc(doc(firestore, 'empresas', profile.empresaId, 'metas_pesv', id));
        toast({ title: 'Meta eliminada' });
    };

    const handleAddDifusion = async () => {
        if (!difColRef) return;
        if (!difForm.nombre || !difForm.cargo) {
            toast({ variant: 'destructive', title: 'Nombre y cargo son requeridos.' });
            return;
        }
        try {
            await addDoc(difColRef, { ...difForm, createdAt: serverTimestamp() });
            toast({ title: 'Colaborador registrado' });
            setDifDialog(false);
            setDifForm(EMPTY_DIFUSION);
        } catch {
            toast({ variant: 'destructive', title: 'Error al registrar.' });
        }
    };

    const toggleFirma = async (d: DifusionDoc) => {
        if (!firestore || !profile?.empresaId) return;
        await updateDoc(doc(firestore, 'empresas', profile.empresaId, 'difusiones_politica', d.id), {
            aceptado: !d.aceptado,
            fechaAceptacion: !d.aceptado ? new Date().toISOString() : null,
        });
    };

    const deleteDifusion = async (id: string) => {
        if (!firestore || !profile?.empresaId) return;
        await deleteDoc(doc(firestore, 'empresas', profile.empresaId, 'difusiones_politica', id));
    };

    // Render

    return (
        <div className="space-y-6 pb-12">

            {/* ── Page Header ─────────────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-2xl border border-border-dark bg-card p-6 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent" />
                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-primary/10 text-primary border-primary/20 font-black text-[10px] uppercase tracking-widest px-3 py-1">
                                Paso 7 &middot; Planear
                            </Badge>
                            {politica?.version && (
                                <Badge className="bg-white/5 text-muted-foreground border-white/10 font-bold text-[10px] px-2">
                                    v{politica.version}
                                </Badge>
                            )}
                            {politica?.estado === 'Publicada' && (
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-black text-[10px] uppercase">
                                    <CheckCircle2 className="size-2.5 mr-1" /> Vigente
                                </Badge>
                            )}
                        </div>
                        <h1 className="text-3xl font-black uppercase italic tracking-tight text-foreground">
                            Política y Metas
                        </h1>
                        <p className="text-sm text-muted-foreground max-w-xl">
                            Gestiona el compromiso organizacional, los objetivos PESV y la trazabilidad de divulgación con todos los colaboradores.
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        {politica?.fechaVencimiento && (
                            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                                <Clock className="size-3.5" />
                                Vence el {new Date(politica.fechaVencimiento).toLocaleDateString('es-CO')}
                            </div>
                        )}
                        <Button
                            onClick={handleSavePolicy}
                            disabled={isSaving || !content.trim()}
                            className="bg-primary font-black uppercase text-xs h-10 px-6 gap-2 shadow-lg shadow-primary/20"
                        >
                            <Save className="size-4" />
                            {isSaving ? 'Publicando...' : 'Publicar Política'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── KPI Strip ───────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: 'Metas Totales', value: metaStats.total, sub: `${metaStats.avgProgress}% progreso`, color: 'text-foreground', accent: 'bg-primary/10', Icon: Flag },
                    { label: 'Cumplidas', value: metaStats.cumplidas, sub: `${metaStats.vencidas} vencidas`, color: 'text-emerald-400', accent: 'bg-emerald-500/10', Icon: CheckCheck },
                    { label: 'En Progreso', value: metaStats.enProgreso, sub: `${metaStats.pendientes} pendientes`, color: 'text-blue-400', accent: 'bg-blue-500/10', Icon: TrendingUp },
                    { label: 'Difusión Firmada', value: `${difStats.pct}%`, sub: `${difStats.firmado} de ${difStats.total}`, color: difStats.pct >= 80 ? 'text-emerald-400' : 'text-primary', accent: 'bg-primary/10', Icon: Users },
                ].map(({ label, value, sub, color, accent, Icon }) => (
                    <Card key={label} className="bg-card border-border-dark overflow-hidden">
                        <CardContent className="p-4 flex items-center gap-3.5">
                            <div className={cn('size-11 rounded-xl flex items-center justify-center shrink-0', accent)}>
                                <Icon className={cn('size-5', color)} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-tight truncate">{label}</p>
                                <p className={cn('text-2xl font-black mt-0.5 leading-none', color)}>{value}</p>
                                <p className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* ── Tabs ────────────────────────────────────────────────────── */}
            <Tabs defaultValue="politica">
                <TabsList className="bg-card border border-border-dark h-11 p-1 gap-0.5">
                    <TabsTrigger
                        value="politica"
                        className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm font-bold uppercase text-xs tracking-wide h-full px-4 rounded"
                    >
                        <FileText className="size-3.5" />
                        Política
                    </TabsTrigger>
                    <TabsTrigger
                        value="metas"
                        className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm font-bold uppercase text-xs tracking-wide h-full px-4 rounded"
                    >
                        <Target className="size-3.5" />
                        Metas y Objetivos
                        {metaStats.total > 0 && (
                            <span className="ml-1 flex size-4 items-center justify-center rounded-full bg-white/15 text-[9px] font-black">
                                {metaStats.total}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger
                        value="difusion"
                        className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm font-bold uppercase text-xs tracking-wide h-full px-4 rounded"
                    >
                        <Send className="size-3.5" />
                        Difusión y Firmas
                        {difStats.total > 0 && (
                            <span className={cn(
                                'ml-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-[9px] font-black',
                                difStats.pct === 100 ? 'bg-emerald-500/30 text-emerald-300' : 'bg-white/15'
                            )}>
                                {difStats.firmado}/{difStats.total}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* ====================================================== TAB: POLITICA */}
                <TabsContent value="politica" className="mt-5">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                        {/* Left: Editor */}
                        <div className="lg:col-span-8 space-y-4">
                            <Card className="bg-card border-border-dark shadow-xl overflow-hidden">
                                {/* Card header */}
                                <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.015] px-6 py-4">
                                    <div>
                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">
                                            Documento oficial &mdash; Res. 40595/2022 Art. 8
                                        </p>
                                        <h2 className="text-base font-black uppercase tracking-tight text-foreground mt-0.5">
                                            Cuerpo de la Política
                                        </h2>
                                    </div>
                                    <div className="text-right space-y-0.5">
                                        {politica?.fechaAprobacion && (
                                            <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
                                                <Calendar className="size-3" />
                                                Aprobada: {new Date(politica.fechaAprobacion).toLocaleDateString('es-CO')}
                                            </div>
                                        )}
                                        {politica?.actualizadoPor && (
                                            <p className="text-[10px] text-muted-foreground/50">
                                                por {politica.actualizadoPor}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {/* Textarea */}
                                <CardContent className="p-0">
                                    <Textarea
                                        className="w-full min-h-[480px] bg-transparent border-none px-8 py-6 text-foreground resize-none leading-7 text-[15px] focus-visible:ring-0 custom-scrollbar placeholder:text-muted-foreground/30"
                                        placeholder={
                                            'POLÍTICA DE SEGURIDAD VIAL\n\n' +
                                            '[Nombre de la empresa], comprometida con la seguridad vial como valor fundamental, declara:\n\n' +
                                            '1. La prevención de accidentes de tránsito es una responsabilidad compartida de toda la organización.\n\n' +
                                            '2. Se asignarán los recursos humanos, técnicos y financieros necesarios para implementar y mantener el Plan Estratégico de Seguridad Vial.\n\n' +
                                            '3. Se promoverá una cultura de comportamiento vial responsable en todos los niveles de la organización.\n\n' +
                                            '4. Se cumplirán todas las disposiciones legales vigentes en materia de seguridad vial.\n\n' +
                                            '_________________________________\nRepresentante Legal\nFecha:'
                                        }
                                        value={content}
                                        onChange={e => setContent(e.target.value)}
                                    />
                                </CardContent>
                                {/* Footer bar */}
                                <div className="border-t border-white/5 bg-white/[0.01] px-6 py-2.5 flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60">
                                        {content.trim() ? (
                                            <>
                                                <span>{content.trim().split(/\s+/).length} palabras</span>
                                                <span className="text-white/10">/</span>
                                                <span>{content.length} caracteres</span>
                                            </>
                                        ) : (
                                            <span>Sin contenido aún</span>
                                        )}
                                    </div>
                                    <Button
                                        onClick={handleSavePolicy}
                                        disabled={isSaving || !content.trim()}
                                        size="sm"
                                        className="bg-primary font-black uppercase text-xs h-8 px-5 gap-1.5 shadow-md shadow-primary/20"
                                    >
                                        <Save className="size-3.5" />
                                        {isSaving ? 'Publicando...' : 'Publicar'}
                                    </Button>
                                </div>
                            </Card>
                        </div>

                        {/* Right: Sidebar */}
                        <aside className="lg:col-span-4 space-y-4">

                            {/* Legal Checklist */}
                            <Card className="bg-card border-border-dark border-l-4 border-l-primary shadow-xl sticky top-20">
                                <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <ShieldCheck className="size-4 text-primary" />
                                        </div>
                                        <p className="text-sm font-black uppercase tracking-tight">Checklist Legal</p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className={cn(
                                            'text-lg font-black leading-none',
                                            legalScore === 100 ? 'text-emerald-400' :
                                            legalScore >= 60 ? 'text-amber-400' : 'text-red-400'
                                        )}>
                                            {legalScore}%
                                        </span>
                                        <span className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">
                                            {LEGAL_CHECKLIST.filter(c => legalChecks[c.key]).length}/{LEGAL_CHECKLIST.length}
                                        </span>
                                    </div>
                                </div>
                                <div className="px-5 pt-3 pb-1">
                                    <Progress
                                        value={legalScore}
                                        className="h-1 bg-white/5"
                                        indicatorClassName={
                                            legalScore === 100 ? 'bg-emerald-500' :
                                            legalScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
                                        }
                                    />
                                </div>
                                <CardContent className="px-4 pb-4 pt-2 space-y-1.5">
                                    {LEGAL_CHECKLIST.map((item, idx) => (
                                        <button
                                            key={item.key}
                                            onClick={() => setLegalChecks(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                                            className={cn(
                                                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left border',
                                                legalChecks[item.key]
                                                    ? 'bg-emerald-500/10 border-emerald-500/20'
                                                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                                            )}
                                        >
                                            <div className={cn(
                                                'size-5 rounded-full flex items-center justify-center shrink-0 border-2 transition-all',
                                                legalChecks[item.key]
                                                    ? 'bg-emerald-500 border-emerald-500'
                                                    : 'border-white/20'
                                            )}>
                                                {legalChecks[item.key] && <Check className="size-2.5 text-white" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={cn(
                                                    'text-[11px] font-semibold leading-tight',
                                                    legalChecks[item.key] ? 'text-emerald-300' : 'text-muted-foreground'
                                                )}>
                                                    {item.label}
                                                </p>
                                            </div>
                                            <span className="text-[9px] text-muted-foreground/40 shrink-0">{idx + 1}</span>
                                        </button>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Estado de la politica */}
                            <Card className={cn(
                                'border overflow-hidden',
                                politica?.estado === 'Publicada'
                                    ? 'bg-emerald-500/[0.04] border-emerald-500/20'
                                    : 'bg-amber-500/[0.04] border-amber-500/20'
                            )}>
                                <CardContent className="p-4 flex gap-3 items-start">
                                    <div className={cn(
                                        'size-8 rounded-lg flex items-center justify-center shrink-0',
                                        politica?.estado === 'Publicada' ? 'bg-emerald-500/15' : 'bg-amber-500/15'
                                    )}>
                                        {politica?.estado === 'Publicada'
                                            ? <CheckCircle2 className="size-4 text-emerald-400" />
                                            : <AlertTriangle className="size-4 text-amber-400" />
                                        }
                                    </div>
                                    <div>
                                        <p className={cn(
                                            'text-xs font-black uppercase tracking-wide',
                                            politica?.estado === 'Publicada' ? 'text-emerald-400' : 'text-amber-400'
                                        )}>
                                            {politica?.estado === 'Publicada' ? 'Política Vigente' : 'Sin Publicar'}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                                            {politica?.estado === 'Publicada'
                                                ? 'La política está activa. Revísela anualmente o ante cambios organizacionales.'
                                                : 'Redacte el texto y presione "Publicar Política" para activarla en el sistema.'
                                            }
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Image upload */}
                            <Card className="bg-card border-border-dark">
                                <div className="flex items-center gap-2 border-b border-white/5 px-5 py-3.5">
                                    <ImagePlus className="size-4 text-primary" />
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-tight">Imagen de la Política</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">Sube el documento físico firmado</p>
                                    </div>
                                </div>
                                <CardContent className="p-4 space-y-3">
                                    {typeof (politica as Record<string, unknown>)?.imagenUrl === 'string' && (
                                        <div className="rounded-lg overflow-hidden border border-white/10">
                                            <img
                                                src={(politica as Record<string, string>).imagenUrl}
                                                alt="Imagen política"
                                                className="w-full object-cover max-h-36"
                                            />
                                        </div>
                                    )}
                                    <input
                                        ref={imageInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={e => {
                                            const f = e.target.files?.[0];
                                            if (f) handleImageUpload(f);
                                        }}
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={isUploadingImage || !politicaRef}
                                        onClick={() => imageInputRef.current?.click()}
                                        className="w-full gap-2 font-bold uppercase text-xs border-white/10 hover:bg-white/5"
                                    >
                                        <Upload className="size-3.5" />
                                        {isUploadingImage
                                            ? 'Subiendo...'
                                            : (typeof (politica as Record<string, unknown>)?.imagenUrl === 'string' ? 'Cambiar imagen' : 'Subir imagen')
                                        }
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Public URL */}
                            <Card className="bg-card border-border-dark border-l-4 border-l-blue-500">
                                <div className="flex items-center gap-2 border-b border-white/5 px-5 py-3.5">
                                    <Link2 className="size-4 text-blue-400" />
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-tight">URL de Divulgación</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                            Comparte este enlace con los colaboradores
                                        </p>
                                    </div>
                                </div>
                                <CardContent className="p-4 space-y-3">
                                    {politica?.estado === 'Publicada' && publicUrl ? (
                                        <>
                                            <div className="bg-blue-500/5 border border-blue-500/15 rounded-lg p-3">
                                                <p className="text-[10px] text-blue-300 font-mono leading-relaxed break-all">
                                                    {publicUrl}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={handleCopyUrl}
                                                    className={cn(
                                                        'flex-1 gap-2 font-bold uppercase text-xs h-8 transition-all',
                                                        urlCopied
                                                            ? 'bg-emerald-600 hover:bg-emerald-600'
                                                            : 'bg-blue-600 hover:bg-blue-700'
                                                    )}
                                                >
                                                    {urlCopied ? <Check className="size-3" /> : <Copy className="size-3" />}
                                                    {urlCopied ? '¡Copiado!' : 'Copiar URL'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="gap-2 font-bold uppercase text-xs h-8 border-white/10 hover:bg-white/5"
                                                    onClick={() => window.open(publicUrl, '_blank')}
                                                >
                                                    <FileText className="size-3" /> Ver
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                                            <AlertTriangle className="size-4 text-amber-400 shrink-0 mt-0.5" />
                                            <p className="text-[10px] text-amber-300/80 leading-relaxed">
                                                Publica la política primero para habilitar el enlace de divulgación.
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </aside>
                    </div>
                </TabsContent>

                {/* ====================================================== TAB: METAS */}
                <TabsContent value="metas" className="mt-5 space-y-5">
                    {/* Sub-header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-5">
                            <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Progreso promedio del plan</p>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className={cn('text-3xl font-black', progressTextColor(metaStats.avgProgress))}>
                                        {metaStats.avgProgress}%
                                    </span>
                                    <Progress
                                        value={metaStats.avgProgress}
                                        className="h-2 w-32 bg-white/5"
                                        indicatorClassName={progressColor(metaStats.avgProgress)}
                                    />
                                </div>
                            </div>
                            <div className="hidden sm:flex flex-wrap gap-1.5">
                                {[
                                    { label: 'Pendientes', count: metaStats.pendientes, cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
                                    { label: 'En Progreso', count: metaStats.enProgreso, cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
                                    { label: 'Cumplidas', count: metaStats.cumplidas, cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                                    { label: 'Vencidas', count: metaStats.vencidas, cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
                                ].map(({ label, count, cls }) => count > 0 && (
                                    <Badge key={label} className={cn('text-[9px] font-bold border px-2 py-1', cls)}>
                                        {count} {label}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <Button
                            onClick={openNewMeta}
                            className="bg-primary font-black uppercase text-xs h-10 px-5 gap-2 shrink-0 shadow-lg shadow-primary/20"
                        >
                            <Plus className="size-4" /> Nueva Meta
                        </Button>
                    </div>

                    {/* Pills mobile */}
                    <div className="flex sm:hidden flex-wrap gap-1.5">
                        {[
                            { label: 'Pendientes', count: metaStats.pendientes, cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
                            { label: 'En Progreso', count: metaStats.enProgreso, cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
                            { label: 'Cumplidas', count: metaStats.cumplidas, cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                            { label: 'Vencidas', count: metaStats.vencidas, cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
                        ].map(({ label, count, cls }) => (
                            <Badge key={label} className={cn('text-[9px] font-bold border px-2 py-1', cls)}>
                                {count} {label}
                            </Badge>
                        ))}
                    </div>

                    {/* Empty state */}
                    {!metas?.length ? (
                        <Card className="bg-card border-border-dark border-dashed">
                            <CardContent className="py-20 flex flex-col items-center gap-3 text-center">
                                <div className="size-16 rounded-2xl bg-white/5 flex items-center justify-center">
                                    <Target className="size-8 text-muted-foreground/30" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-muted-foreground">Sin metas registradas</p>
                                    <p className="text-xs text-muted-foreground/60 mt-1">
                                        Defina los objetivos PESV cuantificables para el período vigente
                                    </p>
                                </div>
                                <Button onClick={openNewMeta} className="mt-1 bg-primary font-black uppercase text-xs h-9 px-5 gap-2">
                                    <Plus className="size-4" /> Crear primera meta
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {metas.map(meta => {
                                const pct = calcPct(meta.actual_valor, meta.meta_valor);
                                return (
                                    <Card key={meta.id} className={cn(
                                        'bg-card border-border-dark hover:shadow-lg transition-all group relative overflow-hidden border-l-[3px]',
                                        meta.estado === 'Vencida' ? 'border-l-red-500' :
                                        meta.estado === 'Cumplida' ? 'border-l-emerald-500' :
                                        meta.estado === 'En_Progreso' ? 'border-l-blue-500' :
                                        'border-l-slate-600'
                                    )}>
                                        {meta.estado === 'Cumplida' && (
                                            <div className="absolute top-0 right-0 p-2">
                                                <Award className="size-4 text-emerald-400/40" />
                                            </div>
                                        )}
                                        <CardContent className="p-5 space-y-3.5">
                                            {/* Top row */}
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0 space-y-1.5">
                                                    <Badge className={cn('text-[9px] font-black px-2 py-0.5', TIPO_META_COLOR[meta.tipo])}>
                                                        {TIPO_META_LABEL[meta.tipo]}
                                                    </Badge>
                                                    <h3 className="font-black text-sm text-foreground leading-tight line-clamp-2">
                                                        {meta.nombre}
                                                    </h3>
                                                </div>
                                                <Badge className={cn('text-[9px] font-black px-2 py-1 shrink-0', ESTADO_META_COLOR[meta.estado])}>
                                                    {ESTADO_META_LABEL[meta.estado]}
                                                </Badge>
                                            </div>

                                            {meta.descripcion && (
                                                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                                                    {meta.descripcion}
                                                </p>
                                            )}

                                            {/* Progress */}
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-semibold text-muted-foreground truncate pr-2 max-w-[70%]">
                                                        {meta.indicador}
                                                    </span>
                                                    <span className={cn('text-sm font-black shrink-0', progressTextColor(pct))}>
                                                        {pct}%
                                                    </span>
                                                </div>
                                                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                                                    <div
                                                        className={cn('h-full rounded-full transition-all duration-500', progressColor(pct))}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between text-[10px] text-muted-foreground/60">
                                                    <span>Actual: <strong className="text-foreground/80">{meta.actual_valor} {meta.unidad}</strong></span>
                                                    <span>Meta: <strong className="text-foreground/80">{meta.meta_valor} {meta.unidad}</strong></span>
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div className="flex items-center justify-between pt-1 border-t border-white/5">
                                                <div>
                                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                        <Calendar className="size-3 shrink-0" />
                                                        {meta.fecha_limite
                                                            ? new Date(meta.fecha_limite + 'T12:00:00').toLocaleDateString('es-CO')
                                                            : '—'}
                                                    </div>
                                                    {meta.responsable && (
                                                        <p className="text-[10px] text-muted-foreground/50 truncate max-w-[130px] mt-0.5">
                                                            {meta.responsable}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button size="icon" variant="ghost" className="size-7 hover:text-foreground"
                                                        onClick={() => openEditMeta(meta)}>
                                                        <Edit2 className="size-3.5" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="size-7 hover:text-red-400"
                                                        onClick={() => handleDeleteMeta(meta.id)}>
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* ====================================================== TAB: DIFUSION */}
                <TabsContent value="difusion" className="mt-5 space-y-4">
                    {/* Stats row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                            { label: 'Registrados', value: difStats.total, color: 'text-foreground' },
                            { label: 'Han Firmado', value: difStats.firmado, color: 'text-emerald-400' },
                            { label: 'Pendientes', value: difStats.pendiente, color: 'text-amber-400' },
                            { label: 'Cobertura', value: `${difStats.pct}%`, color: progressTextColor(difStats.pct) },
                        ].map(({ label, value, color }) => (
                            <Card key={label} className="bg-card border-border-dark">
                                <CardContent className="p-4 text-center">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
                                    <p className={cn('text-2xl font-black mt-1', color)}>{value}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Progress bar */}
                    <Card className="bg-card border-border-dark">
                        <CardContent className="p-5">
                            <div className="flex justify-between text-xs font-bold mb-2.5">
                                <span className="text-muted-foreground">Cobertura de firma de la política</span>
                                <span className={progressTextColor(difStats.pct)}>{difStats.pct}% firmado</span>
                            </div>
                            <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                                <div
                                    className={cn('h-full rounded-full transition-all duration-700', progressColor(difStats.pct))}
                                    style={{ width: `${difStats.pct}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground/60 mt-1.5">
                                <span>{difStats.firmado} colaboradores firmaron</span>
                                <span>{difStats.pendiente} pendientes</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Table card */}
                    <Card className="bg-card border-border-dark">
                        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
                            <div>
                                <h3 className="text-sm font-black uppercase">Registro de Colaboradores</h3>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                    Haz clic en el estado para marcar como firmado
                                </p>
                            </div>
                            <Button
                                onClick={() => setDifDialog(true)}
                                className="bg-primary font-black uppercase text-xs h-9 px-4 gap-2"
                            >
                                <Plus className="size-4" /> Agregar
                            </Button>
                        </div>
                        <CardContent className="p-0">
                            {!difusiones?.length ? (
                                <div className="py-16 flex flex-col items-center gap-3 text-center">
                                    <div className="size-14 rounded-2xl bg-white/5 flex items-center justify-center">
                                        <Users className="size-7 text-muted-foreground/25" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-muted-foreground">Sin registros de difusión</p>
                                        <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
                                            Agrega colaboradores para hacer seguimiento de quién ha recibido y firmado la política
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-white/5 hover:bg-transparent">
                                                {['Nombre', 'Cargo', 'Método', 'Estado', 'Fecha Firma', ''].map(h => (
                                                    <TableHead key={h} className={cn(
                                                        'text-[10px] font-black text-muted-foreground uppercase tracking-widest',
                                                        h === 'Método' && 'hidden sm:table-cell',
                                                        h === 'Fecha Firma' && 'hidden md:table-cell',
                                                    )}>
                                                        {h}
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {difusiones.map(dif => (
                                                <TableRow key={dif.id} className="border-white/5 hover:bg-white/[0.02]">
                                                    <TableCell className="font-semibold text-sm">{dif.nombre}</TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">{dif.cargo}</TableCell>
                                                    <TableCell className="hidden sm:table-cell">
                                                        <Badge className="text-[9px] font-bold border bg-white/5 text-muted-foreground border-white/10">
                                                            {dif.metodo}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <button onClick={() => toggleFirma(dif)}>
                                                            <Badge className={cn(
                                                                'text-[9px] font-black border cursor-pointer transition-colors gap-1',
                                                                dif.aceptado
                                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                                                            )}>
                                                                {dif.aceptado
                                                                    ? <><CheckCheck className="size-3" /> Firmado</>
                                                                    : <><Clock className="size-3" /> Pendiente</>
                                                                }
                                                            </Badge>
                                                        </button>
                                                    </TableCell>
                                                    <TableCell className="text-[11px] text-muted-foreground hidden md:table-cell">
                                                        {dif.fechaAceptacion
                                                            ? new Date(dif.fechaAceptacion).toLocaleDateString('es-CO')
                                                            : '—'
                                                        }
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            size="icon" variant="ghost"
                                                            className="size-7 text-muted-foreground hover:text-red-400"
                                                            onClick={() => deleteDifusion(dif.id)}
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ── Dialog: Meta ────────────────────────────────────────────── */}
            <Dialog open={metaDialog} onOpenChange={setMetaDialog}>
                <DialogContent className="max-w-2xl bg-card border-border-dark text-foreground">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black uppercase italic">
                            {editingMeta ? 'Editar Meta PESV' : 'Nueva Meta PESV'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2 max-h-[68vh] overflow-y-auto pr-1 custom-scrollbar">
                        <div className="sm:col-span-2 space-y-1.5">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Nombre de la Meta *</Label>
                            <Input
                                className="bg-background border-border-dark"
                                placeholder="Ej: Reducir siniestros en un 20%"
                                value={metaForm.nombre}
                                onChange={e => setMetaForm(p => ({ ...p, nombre: e.target.value }))}
                            />
                        </div>
                        <div className="sm:col-span-2 space-y-1.5">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Descripción</Label>
                            <Textarea
                                className="bg-background border-border-dark resize-none h-20"
                                placeholder="Contexto y justificación de la meta..."
                                value={metaForm.descripcion}
                                onChange={e => setMetaForm(p => ({ ...p, descripcion: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Tipo</Label>
                            <Select value={metaForm.tipo} onValueChange={v => setMetaForm(p => ({ ...p, tipo: v as TipoMeta }))}>
                                <SelectTrigger className="bg-background border-border-dark">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border-dark">
                                    {(Object.entries(TIPO_META_LABEL) as [TipoMeta, string][]).map(([v, l]) => (
                                        <SelectItem key={v} value={v}>{l}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Estado</Label>
                            <Select value={metaForm.estado} onValueChange={v => setMetaForm(p => ({ ...p, estado: v as EstadoMeta }))}>
                                <SelectTrigger className="bg-background border-border-dark">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border-dark">
                                    {(Object.entries(ESTADO_META_LABEL) as [EstadoMeta, string][]).map(([v, l]) => (
                                        <SelectItem key={v} value={v}>{l}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="sm:col-span-2 space-y-1.5">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Indicador de Medición *</Label>
                            <Input
                                className="bg-background border-border-dark"
                                placeholder="Ej: Número de accidentes por cada 100 vehículos"
                                value={metaForm.indicador}
                                onChange={e => setMetaForm(p => ({ ...p, indicador: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Valor Meta</Label>
                            <Input
                                type="number" min="0"
                                className="bg-background border-border-dark"
                                value={metaForm.meta_valor}
                                onChange={e => setMetaForm(p => ({ ...p, meta_valor: Number(e.target.value) }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Valor Actual</Label>
                            <Input
                                type="number" min="0"
                                className="bg-background border-border-dark"
                                value={metaForm.actual_valor}
                                onChange={e => setMetaForm(p => ({ ...p, actual_valor: Number(e.target.value) }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Unidad</Label>
                            <Input
                                className="bg-background border-border-dark"
                                placeholder="%, personas, vehículos..."
                                value={metaForm.unidad}
                                onChange={e => setMetaForm(p => ({ ...p, unidad: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Responsable</Label>
                            <Input
                                className="bg-background border-border-dark"
                                placeholder="Nombre del responsable"
                                value={metaForm.responsable}
                                onChange={e => setMetaForm(p => ({ ...p, responsable: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Fecha Inicio</Label>
                            <Input
                                type="date"
                                className="bg-background border-border-dark"
                                value={metaForm.fecha_inicio}
                                onChange={e => setMetaForm(p => ({ ...p, fecha_inicio: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Fecha Límite *</Label>
                            <Input
                                type="date"
                                className="bg-background border-border-dark"
                                value={metaForm.fecha_limite}
                                onChange={e => setMetaForm(p => ({ ...p, fecha_limite: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 pt-2 border-t border-white/5">
                        <Button variant="outline" className="border-border-dark" onClick={() => setMetaDialog(false)}>
                            Cancelar
                        </Button>
                        <Button className="bg-primary font-black uppercase text-xs gap-2" onClick={handleSaveMeta}>
                            <Save className="size-4" />
                            {editingMeta ? 'Actualizar Meta' : 'Crear Meta'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Dialog: Difusion ────────────────────────────────────────── */}
            <Dialog open={difDialog} onOpenChange={setDifDialog}>
                <DialogContent className="max-w-md bg-card border-border-dark text-foreground">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black uppercase italic">Registrar Colaborador</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Nombre Completo *</Label>
                            <Input
                                className="bg-background border-border-dark"
                                placeholder="Nombre y apellidos"
                                value={difForm.nombre}
                                onChange={e => setDifForm(p => ({ ...p, nombre: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Cargo *</Label>
                            <Input
                                className="bg-background border-border-dark"
                                placeholder="Cargo en la organización"
                                value={difForm.cargo}
                                onChange={e => setDifForm(p => ({ ...p, cargo: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Email</Label>
                            <Input
                                type="email"
                                className="bg-background border-border-dark"
                                placeholder="correo@empresa.com"
                                value={difForm.email}
                                onChange={e => setDifForm(p => ({ ...p, email: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Método de Difusión</Label>
                            <Select value={difForm.metodo} onValueChange={v => setDifForm(p => ({ ...p, metodo: v as MetodoFirma }))}>
                                <SelectTrigger className="bg-background border-border-dark">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border-dark">
                                    <SelectItem value="Email">Email</SelectItem>
                                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                                    <SelectItem value="Presencial">Presencial</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <button
                            onClick={() => setDifForm(p => ({ ...p, aceptado: !p.aceptado }))}
                            className={cn(
                                'w-full flex items-center gap-3 p-3 rounded-lg border transition-all',
                                difForm.aceptado
                                    ? 'bg-emerald-500/10 border-emerald-500/20'
                                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
                            )}
                        >
                            <div className={cn(
                                'size-5 rounded border-2 flex items-center justify-center transition-all',
                                difForm.aceptado ? 'bg-emerald-500 border-emerald-500' : 'border-white/25'
                            )}>
                                {difForm.aceptado && <Check className="size-3 text-white" />}
                            </div>
                            <span className={cn(
                                'text-xs font-semibold',
                                difForm.aceptado ? 'text-emerald-300' : 'text-muted-foreground'
                            )}>
                                Ya tiene firma registrada
                            </span>
                        </button>
                    </div>
                    <DialogFooter className="gap-2 pt-2 border-t border-white/5">
                        <Button variant="outline" className="border-border-dark" onClick={() => setDifDialog(false)}>
                            Cancelar
                        </Button>
                        <Button className="bg-primary font-black uppercase text-xs gap-2" onClick={handleAddDifusion}>
                            <Plus className="size-4" /> Registrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
