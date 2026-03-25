
'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, setDoc, query, serverTimestamp, addDoc, orderBy, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Users,
    UserCheck,
    DollarSign,
    Plus,
    Save,
    ShieldCheck,
    Upload,
    Trash2,
    CheckCircle2,
    AlertCircle,
    FileSignature,
    Info,
    FileText,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

export default function LiderazgoPage() {
    const firestore = useFirestore();
    const { profile } = useUser();
    const [isActaOpen, setIsActaOpen] = useState(false);
    const [isPresupuestoOpen, setIsPresupuestoOpen] = useState(false);
    const [isComiteOpen, setIsComiteOpen] = useState(false);
    const [loadingActa, setLoadingActa] = useState(false);
    const [loadingPresupuesto, setLoadingPresupuesto] = useState(false);

    // --- DATOS EMPRESA (NIVEL PESV desde Firestore) ---
    const empresaRef = useMemoFirebase(() => {
        if (!firestore || !profile?.empresaId) return null;
        return doc(firestore, 'empresas', profile.empresaId);
    }, [firestore, profile?.empresaId]);
    const { data: empresaData } = useDoc(empresaRef);

    const nivelPESV: string = empresaData?.nivelPesv ?? empresaData?.nivelPESV ?? 'Básico';

    // --- 1. LIDER PESV (Paso 1) ---
    const liderRef = useMemoFirebase(() => {
        if (!firestore || !profile?.empresaId) return null;
        return doc(firestore, 'empresas', profile.empresaId, 'pesv_liderazgo', 'lider');
    }, [firestore, profile?.empresaId]);
    const { data: liderData } = useDoc(liderRef);

    const handleSaveLider = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!firestore || !liderRef) return;
        const formData = new FormData(e.currentTarget);
        await setDoc(liderRef, {
            nombre: formData.get('nombre') as string,
            cargo: formData.get('cargo') as string,
            fechaAsignacion: formData.get('fecha') as string,
            competenciaValidada: true,
            actualizadoEn: serverTimestamp()
        }, { merge: true });
        toast({ title: "Líder Actualizado", description: "Designación guardada correctamente." });
    };

    // --- 2. COMITÉ (Paso 2 - Solo Estándar/Avanzado) ---
    const comiteRef = useMemoFirebase(() => {
        if (!firestore || !profile?.empresaId) return null;
        return collection(firestore, 'empresas', profile.empresaId, 'pesv_comite_miembros');
    }, [firestore, profile?.empresaId]);
    const { data: comiteMembers } = useCollection(comiteRef);

    const handleAddMember = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!firestore || !comiteRef) return;
        const formData = new FormData(e.currentTarget);
        await addDoc(comiteRef, {
            nombre: formData.get('nombre') as string,
            cargo: formData.get('cargo') as string,
            rolComite: formData.get('rol') as string,
            fechaIngreso: new Date().toISOString()
        });
        e.currentTarget.reset();
        toast({ title: "Miembro del Comité agregado" });
    };

    const handleDeleteMember = async (memberId: string) => {
        if (!firestore || !profile?.empresaId) return;
        await deleteDoc(doc(firestore, 'empresas', profile.empresaId, 'pesv_comite_miembros', memberId));
        toast({ title: "Miembro eliminado del Comité" });
    };

    // --- 3. ACTAS SMART (Paso 2) ---
    const actasRef = useMemoFirebase(() => {
        if (!firestore || !profile?.empresaId) return null;
        return query(collection(firestore, 'empresas', profile.empresaId, 'pesv_actas'), orderBy('fecha', 'desc'));
    }, [firestore, profile?.empresaId]);
    const { data: actas } = useCollection(actasRef);

    const handleCreateActa = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!firestore || !profile?.empresaId) return;
        setLoadingActa(true);
        try {
            const formData = new FormData(e.currentTarget);
            await addDoc(collection(firestore, 'empresas', profile.empresaId, 'pesv_actas'), {
                fecha: formData.get('fecha'),
                tipo: formData.get('tipo'),
                descripcion: formData.get('descripcion'),
                temas: ["Cumplimiento Meta", "Siniestralidad Vial", "Presupuesto", "Auditoría Interna"],
                estado: "Firmada Digitalmente",
                creadoPor: profile.nombreCompleto,
                createdAt: serverTimestamp()
            });
            setIsActaOpen(false);
            toast({ title: "Acta Generada", description: "El acta ha sido archivada digitalmente." });
        } finally {
            setLoadingActa(false);
        }
    };

    // --- 4. PRESUPUESTO (Paso 4) ---
    const presupuestoRef = useMemoFirebase(() => {
        if (!firestore || !profile?.empresaId) return null;
        return doc(firestore, 'empresas', profile.empresaId, 'pesv_recursos', 'anual');
    }, [firestore, profile?.empresaId]);
    const { data: presupuesto } = useDoc(presupuestoRef);

    const ejePct = useMemo(() => {
        if (!presupuesto?.montoAsignado) return 0;
        return Math.min(100, Math.round(((presupuesto.montoEjecutado || 0) / presupuesto.montoAsignado) * 100));
    }, [presupuesto]);

    const handleSavePresupuesto = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!firestore || !presupuestoRef) return;
        setLoadingPresupuesto(true);
        try {
            const formData = new FormData(e.currentTarget);
            await setDoc(presupuestoRef, {
                montoAsignado: Number(formData.get('montoAsignado')),
                montoEjecutado: Number(formData.get('montoEjecutado')),
                anio: new Date().getFullYear(),
                actualizadoEn: serverTimestamp()
            }, { merge: true });
            setIsPresupuestoOpen(false);
            toast({ title: "Presupuesto actualizado", description: "Los valores han sido guardados." });
        } finally {
            setLoadingPresupuesto(false);
        }
    };

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight uppercase italic">Liderazgo y Recursos</h1>
                    <p className="text-text-secondary mt-1">Gabinete de Seguridad Vial y Gestión de Recursos (Pasos 1, 2 y 4)</p>
                </div>
                <div className="flex gap-2">
                    <Badge className="bg-primary/20 text-primary border-primary/30 px-3 py-1 font-bold">Nivel: {nivelPESV}</Badge>
                </div>
            </div>

            <Tabs defaultValue="liderazgo" className="w-full">
                <TabsList className="bg-surface-dark border-border-dark p-1">
                    <TabsTrigger value="liderazgo" className="font-bold gap-2"><UserCheck className="size-4" /> Líder y Comité</TabsTrigger>
                    <TabsTrigger value="reuniones" className="font-bold gap-2"><FileSignature className="size-4" /> Actas Smart</TabsTrigger>
                    <TabsTrigger value="recursos" className="font-bold gap-2"><DollarSign className="size-4" /> Presupuesto y Gerencia</TabsTrigger>
                </TabsList>

                {/* --- PASO 1 Y 2: LIDERAZGO --- */}
                <TabsContent value="liderazgo" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <Card className="lg:col-span-5 bg-surface-dark border-border-dark shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-lg font-black uppercase text-foreground tracking-tighter flex items-center gap-2">
                                    <ShieldCheck className="text-primary size-5" /> Designación del Líder (Paso 1)
                                </CardTitle>
                                <CardDescription>Persona con idoneidad y autoridad para la toma de decisiones.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSaveLider} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Nombre del Líder</Label>
                                        <Input name="nombre" defaultValue={liderData?.nombre} className="bg-background-dark border-border-dark" placeholder="Ej: Juan Carlos Pérez" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Cargo en Organigrama</Label>
                                        <Input name="cargo" defaultValue={liderData?.cargo} className="bg-background-dark border-border-dark" placeholder="Ej: Jefe de Seguridad Vial" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Fecha Asignación</Label>
                                            <Input type="date" name="fecha" defaultValue={liderData?.fechaAsignacion} className="bg-background-dark border-border-dark" />
                                        </div>
                                        <div className="space-y-2 flex flex-col justify-end">
                                            <Button type="button" variant="outline" className="border-border-dark text-[10px] font-bold uppercase h-10 gap-2">
                                                <Upload className="size-4" /> Subir Resolución
                                            </Button>
                                        </div>
                                    </div>

                                    {liderData?.nombre && (
                                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase">
                                                <CheckCircle2 className="size-4" /> Líder Designado
                                            </div>
                                            <Info className="size-4 text-emerald-500 cursor-help" />
                                        </div>
                                    )}

                                    <Button type="submit" className="w-full bg-primary font-black uppercase h-12 shadow-lg shadow-primary/20">
                                        <Save className="size-4 mr-2" /> Guardar Liderazgo
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        <div className="lg:col-span-7 space-y-6">
                            {nivelPESV === 'Básico' ? (
                                <Card className="bg-primary/5 border-primary/20 border-dashed p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                                    <Info className="size-12 text-primary/40 mb-4" />
                                    <h3 className="text-foreground font-bold uppercase">No requiere Comité (Nivel Básico)</h3>
                                    <p className="text-sm text-text-secondary mt-2 max-w-sm">Para el nivel Básico, el Líder del PESV asume directamente todas las responsabilidades del gabinete.</p>
                                </Card>
                            ) : (
                                <Card className="bg-surface-dark border-border-dark shadow-xl">
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg font-black uppercase text-foreground tracking-tighter">Comité de Seguridad Vial (Paso 2)</CardTitle>
                                            <CardDescription>Equipo interdisciplinario para el seguimiento del sistema.</CardDescription>
                                        </div>
                                        <Button size="sm" className="bg-white/5 border border-border-dark font-bold text-xs" onClick={() => setIsComiteOpen(true)}>
                                            <Plus className="size-4 mr-1" /> Miembro
                                        </Button>
                                    </CardHeader>
                                    <CardContent>
                                        {(!comiteMembers || comiteMembers.length === 0) ? (
                                            <div className="text-center py-10 text-text-secondary text-sm">
                                                <Users className="size-10 mx-auto mb-3 opacity-20" />
                                                <p>Aún no hay miembros en el Comité.<br/>Agrega el equipo interdisciplinario.</p>
                                            </div>
                                        ) : (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="border-border-dark">
                                                        <TableHead>Nombre</TableHead>
                                                        <TableHead>Cargo/Rol</TableHead>
                                                        <TableHead className="text-right">Ingreso</TableHead>
                                                        <TableHead></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {comiteMembers.map(m => (
                                                        <TableRow key={m.id} className="border-border-dark text-xs">
                                                            <TableCell className="font-bold text-foreground uppercase">{m.nombre}</TableCell>
                                                            <TableCell><Badge variant="outline" className="text-[9px] border-primary/30 text-primary">{m.rolComite}</Badge></TableCell>
                                                            <TableCell className="text-right text-text-secondary">{new Date(m.fechaIngreso).toLocaleDateString()}</TableCell>
                                                            <TableCell>
                                                                <Button size="icon" variant="ghost" className="size-7 text-red-500/50 hover:text-red-500" onClick={() => handleDeleteMember(m.id)}>
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
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* --- ACTAS SMART (Paso 2) --- */}
                <TabsContent value="reuniones" className="mt-6 space-y-6">
                    <Card className="bg-surface-dark border-border-dark overflow-hidden">
                        <CardHeader className="bg-white/5 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-black uppercase text-foreground italic">Gestor de Actas Dinámicas</CardTitle>
                                <CardDescription>Evidencia legal de reuniones trimestrales obligatorias.</CardDescription>
                            </div>
                            <Button onClick={() => setIsActaOpen(true)} className="bg-primary font-black uppercase h-12 px-6"><Plus className="size-5 mr-1" /> Generar Acta Smart</Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {(!actas || actas.length === 0) ? (
                                <div className="text-center py-16 text-text-secondary">
                                    <FileText className="size-12 mx-auto mb-3 opacity-20" />
                                    <p className="text-sm">Aún no hay actas registradas.<br />Genera la primera acta de reunión.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border-dark bg-white/5">
                                            <TableHead className="text-[10px] font-black uppercase">Fecha / Tipo</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase">Temas Principales</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase">Firma Digital</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {actas.map(acta => (
                                            <TableRow key={acta.id} className="border-border-dark hover:bg-white/5 transition-colors">
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black text-foreground">{acta.fecha}</span>
                                                        <span className="text-[10px] text-text-secondary uppercase">{acta.tipo}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1 flex-wrap">
                                                        {acta.temas?.map((t: string) => (
                                                            <Badge key={t} variant="secondary" className="text-[8px] uppercase">{t}</Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[9px] gap-1 uppercase">
                                                        <CheckCircle2 className="size-3" /> {acta.estado}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button size="sm" variant="ghost" className="text-text-secondary italic">Ver PDF</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- RECURSOS Y GERENCIA (Paso 4) --- */}
                <TabsContent value="recursos" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="bg-surface-dark border-border-dark">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg font-black uppercase text-foreground italic">Presupuesto PESV (Paso 4)</CardTitle>
                                <Button size="sm" variant="outline" className="border-border-dark font-bold text-xs gap-2" onClick={() => setIsPresupuestoOpen(true)}>
                                    <DollarSign className="size-3.5" /> Ajustar
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {!presupuesto?.montoAsignado ? (
                                    <div className="text-center py-10 text-text-secondary text-sm border border-dashed border-border-dark rounded-xl">
                                        <DollarSign className="size-10 mx-auto mb-3 opacity-20" />
                                        <p>Aún no se ha asignado presupuesto.<br />Haz clic en "Ajustar" para configurarlo.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-center bg-black/20 p-6 rounded-2xl border border-white/5">
                                            <div>
                                                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Ejecución Presupuestal</p>
                                                <p className="text-3xl font-black text-emerald-500">${presupuesto.montoEjecutado?.toLocaleString() || '0'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Monto Asignado</p>
                                                <p className="text-xl font-bold text-foreground/50">${presupuesto.montoAsignado?.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs font-black uppercase text-foreground">
                                                <span className="text-text-secondary">Progreso Meta Anual</span>
                                                <span>{ejePct}% realizado</span>
                                            </div>
                                            <Progress value={ejePct} className="h-2 bg-white/5" indicatorClassName="bg-emerald-500" />
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="bg-surface-dark border-border-dark">
                            <CardHeader><CardTitle className="text-lg font-black uppercase text-foreground italic">Dashboard de Corresponsabilidad</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {[
                                    { label: "Designación del Líder PESV", val: !!liderData?.nombre },
                                    { label: "Comité Conformado (Estándar/Avanzado)", val: nivelPESV === 'Básico' || (comiteMembers && comiteMembers.length > 0) },
                                    { label: "Actas de Reunión Registradas", val: !!(actas && actas.length > 0) },
                                    { label: "Presupuesto Asignado", val: !!presupuesto?.montoAsignado }
                                ].map(check => (
                                    <div key={check.label} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/5 transition-all">
                                        <span className="text-sm font-bold text-text-secondary">{check.label}</span>
                                        {check.val
                                            ? <CheckCircle2 className="text-emerald-500 size-5" />
                                            : <AlertCircle className="text-amber-500 size-5" />}
                                    </div>
                                ))}
                                <div className="pt-4 border-t border-white/5">
                                    <div className="bg-primary/10 p-4 rounded-xl flex gap-3">
                                        <Info className="size-5 text-primary shrink-0 mt-0.5" />
                                        <p className="text-xs text-foreground">Complete los 4 ítems de corresponsabilidad para cumplir con el estándar de Liderazgo Directivo del PESV.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Comité Dialog */}
            <Dialog open={isComiteOpen} onOpenChange={setIsComiteOpen}>
                <DialogContent className="bg-surface-dark border-border-dark text-foreground">
                    <DialogHeader><DialogTitle className="font-black uppercase">Nuevo Miembro de Comité</DialogTitle></DialogHeader>
                    <form onSubmit={async (e) => { await handleAddMember(e); setIsComiteOpen(false); }} className="space-y-4 py-4">
                        <Input name="nombre" placeholder="Nombre completo" className="bg-background-dark border-border-dark" required />
                        <Input name="cargo" placeholder="Cargo organizacional" className="bg-background-dark border-border-dark" required />
                        <Select name="rol" required>
                            <SelectTrigger className="bg-background-dark border-border-dark"><SelectValue placeholder="Rol en el comité" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Presidente">Presidente</SelectItem>
                                <SelectItem value="Secretario">Secretario</SelectItem>
                                <SelectItem value="Vocal">Vocal</SelectItem>
                            </SelectContent>
                        </Select>
                        <DialogFooter>
                            <Button type="button" variant="outline" className="border-border-dark" onClick={() => setIsComiteOpen(false)}>Cancelar</Button>
                            <Button type="submit" className="bg-primary font-bold">Agregar al Equipo</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Acta Dialog */}
            <Dialog open={isActaOpen} onOpenChange={setIsActaOpen}>
                <DialogContent className="max-w-2xl bg-surface-dark border-border-dark text-foreground p-0 overflow-hidden">
                    <DialogHeader className="p-6 bg-primary/10 border-b border-border-dark">
                        <DialogTitle className="text-xl font-black uppercase italic">Generador de Acta Inteligente</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateActa} className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Fecha de Reunión</Label>
                                <Input type="date" name="fecha" required className="bg-background-dark border-border-dark" />
                            </div>
                            <div className="space-y-2">
                                <Label>Tipo de Reunión</Label>
                                <Select name="tipo" required>
                                    <SelectTrigger className="bg-background-dark"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Ordinaria">Ordinaria</SelectItem>
                                        <SelectItem value="Extraordinaria">Extraordinaria</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Puntos Tratados (PESV Obligatorios)</Label>
                            <div className="grid grid-cols-2 gap-2 p-3 bg-black/20 rounded-lg border border-white/5">
                                {["Cumplimiento Meta", "Siniestralidad Vial", "Presupuesto", "Auditoría Interna", "Campañas"].map(t => (
                                    <div key={t} className="flex items-center gap-2">
                                        <Checkbox id={t} defaultChecked={true} className="border-primary" />
                                        <Label htmlFor={t} className="text-[10px] uppercase font-bold text-text-secondary">{t}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Observaciones y Acuerdos</Label>
                            <Textarea name="descripcion" className="bg-background-dark border-border-dark h-32" placeholder="Describe los compromisos y conclusiones de la reunión..." />
                        </div>
                        <Button type="submit" disabled={loadingActa} className="w-full bg-primary font-black uppercase h-12 gap-2 shadow-xl shadow-primary/20">
                            <FileSignature className="size-5" /> Firmar y Archivar Digitalmente
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Presupuesto Dialog */}
            <Dialog open={isPresupuestoOpen} onOpenChange={setIsPresupuestoOpen}>
                <DialogContent className="bg-surface-dark border-border-dark text-foreground">
                    <DialogHeader>
                        <DialogTitle className="font-black uppercase">Ajustar Presupuesto PESV</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSavePresupuesto} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Monto Asignado (COP)</Label>
                            <Input
                                name="montoAsignado"
                                type="number"
                                min="0"
                                step="1000"
                                defaultValue={presupuesto?.montoAsignado || ''}
                                placeholder="Ej: 50000000"
                                className="bg-background-dark border-border-dark"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Monto Ejecutado (COP)</Label>
                            <Input
                                name="montoEjecutado"
                                type="number"
                                min="0"
                                step="1000"
                                defaultValue={presupuesto?.montoEjecutado || ''}
                                placeholder="Ej: 12000000"
                                className="bg-background-dark border-border-dark"
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" className="border-border-dark" onClick={() => setIsPresupuestoOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={loadingPresupuesto} className="bg-primary font-black uppercase">
                                <Save className="size-4 mr-2" /> Guardar
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
