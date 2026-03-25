
'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Gauge,
    Zap,
    UserMinus,
    Users,
    EyeOff,
    ChevronRight,
    ShieldCheck,
    AlertTriangle,
    FileText,
    Save,
    Plus,
    Trash2,
    Calendar,
    CheckCircle2,
    Clock,
    CircleDollarSign,
    TrendingDown,
    Activity,
    UserCheck,
    Check
} from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, serverTimestamp, addDoc, updateDoc, doc, deleteDoc, where, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";

// --- Esquemas de Validación ---

const actividadSchema = z.object({
    nombre: z.string().min(1, "Requerido"),
    fecha: z.string(),
    estado: z.enum(["Pendiente", "En Proceso", "Ejecutada"]),
    impactaPlanAnual: z.boolean().default(false)
});

const factorDesempenoSchema = z.object({
    descripcion: z.string().min(1, "Requerido"),
    indicadorId: z.string(),
    meta: z.coerce.number().min(0).max(100)
});

const programaSchema = z.object({
    lineamientoAlcance: z.string().min(10, "Alcance muy corto"),
    fechaInicio: z.string(),
    duracionMeses: z.coerce.number().min(1),
    objetivoGeneral: z.string().min(10, "Objetivo muy corto"),
    presupuestoAsignado: z.coerce.number().min(0),
    responsableId: z.string().min(1, "Responsable requerido"),
    factoresDesempeno: z.array(factorDesempenoSchema).default([]),
    actividades: z.array(actividadSchema).default([])
});

const alcoholemiaSchema = z.object({
    conductorId: z.string().min(1, "Requerido"),
    tipoPrueba: z.enum(["Aleatoria", "Post-Accidente", "Sospecha"]),
    resultadoGrado: z.coerce.number().min(0),
    resultadoDrogas: z.enum(["Negativo", "Positivo"]),
    observaciones: z.string().optional()
});

const PROGRAMAS_UI = [
    { id: "velocidad", titulo: "Gestión de la Velocidad Segura", icon: Gauge, color: "text-blue-500", bg: "bg-blue-500/10", paso: "8.1" },
    { id: "fatiga", titulo: "Prevención de la Fatiga", icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10", paso: "8.2" },
    { id: "distraccion", titulo: "Prevención de la Distracción", icon: EyeOff, color: "text-purple-500", bg: "bg-purple-500/10", paso: "8.3" },
    { id: "sustancias", titulo: "Cero Tolerancia Alcohol/Drogas", icon: UserMinus, color: "text-red-500", bg: "bg-red-500/10", paso: "8.4" },
    { id: "vulnerables", titulo: "Protección Actores Vulnerables", icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10", paso: "8.5" }
];

export default function ProgramasRiesgoPage() {
    const { profile } = useUser();
    const firestore = useFirestore();
    const [selectedProg, setSelectedProg] = useState<any>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isAlcoOpen, setIsAlcoOpen] = useState(false);

    // Queries
    const programasRef = useMemoFirebase(() => {
        if (!firestore || !profile?.empresaId) return null;
        return collection(firestore, 'empresas', profile.empresaId, 'programasPrevencion');
    }, [firestore, profile?.empresaId]);
    const { data: savedProgramas } = useCollection(programasRef);

    const viajesRef = useMemoFirebase(() => {
        if (!firestore || !profile?.empresaId) return null;
        return query(collection(firestore, 'empresas', profile.empresaId, 'viajes'), where('estado', '==', 'Finalizado'), orderBy('fechaRegistro', 'desc'), limit(100));
    }, [firestore, profile?.empresaId]);
    const { data: viajesData } = useCollection(viajesRef);

    const form = useForm<z.infer<typeof programaSchema>>({
        resolver: zodResolver(programaSchema),
        defaultValues: {
            lineamientoAlcance: "",
            duracionMeses: 12,
            objetivoGeneral: "",
            presupuestoAsignado: 0,
            factoresDesempeno: [],
            actividades: []
        }
    });

    const alcoForm = useForm<z.infer<typeof alcoholemiaSchema>>({
        resolver: zodResolver(alcoholemiaSchema),
        defaultValues: { tipoPrueba: "Aleatoria", resultadoGrado: 0, resultadoDrogas: "Negativo" }
    });

    const handleOpenDetail = (progDef: any) => {
        const saved = savedProgramas?.find(p => p.id === progDef.id);
        setSelectedProg(progDef);
        if (saved) {
            form.reset(saved);
        } else {
            form.reset({
                lineamientoAlcance: `Aplica para todo el personal que realice desplazamientos laborales de ${progDef.titulo}.`,
                fechaInicio: new Date().toISOString().split('T')[0],
                duracionMeses: 12,
                objetivoGeneral: `Reducir la siniestralidad vial mediante el control de ${progDef.titulo}.`,
                presupuestoAsignado: 0,
                factoresDesempeno: [{ descripcion: "Cumplimiento de metas del indicador", indicadorId: progDef.id === 'velocidad' ? 'Ind-8' : 'Ind-6', meta: 95 }],
                actividades: []
            });
        }
        setIsDetailOpen(true);
    };

    const onSubmit = async (values: z.infer<typeof programaSchema>) => {
        if (!profile?.empresaId || !selectedProg || !firestore) return;
        try {
            await updateDoc(doc(firestore, 'empresas', profile.empresaId, 'programasPrevencion', selectedProg.id), {
                ...values,
                id: selectedProg.id,
                titulo: selectedProg.titulo,
                actualizadoPor: profile.email,
                fechaActualizacion: serverTimestamp()
            });
            // Logic for also updating Paso 9 (Annual Plan) could go here via a Batch
            toast({ title: "Programa Guardado", description: "La parametrización y cronograma han sido actualizados." });
            setIsDetailOpen(false);
        } catch (e) {
            // In case doc doesn't exist, use setDoc or addDoc logic but here we assume it's an update/init
            await setDoc(doc(firestore, 'empresas', profile.empresaId, 'programasPrevencion', selectedProg.id), {
                ...values,
                id: selectedProg.id,
                titulo: selectedProg.titulo,
                empresaId: profile.empresaId,
                fechaRegistro: serverTimestamp()
            });
            toast({ title: "Programa Inicializado" });
            setIsDetailOpen(false);
        }
    };

    const onAlcoSubmit = async (values: z.infer<typeof alcoholemiaSchema>) => {
        if (!profile?.empresaId || !firestore) return;
        try {
            await addDoc(collection(firestore, 'empresas', profile.empresaId, 'pruebas_alcoholemia'), {
                ...values,
                fechaPrueba: serverTimestamp(),
                registradoPor: profile.email
            });
            toast({ title: "Prueba Registrada", description: values.resultadoGrado > 0 ? "ALERTA: Grado de alcohol detectado." : "Resultado Negativo." });
            setIsAlcoOpen(false);
            alcoForm.reset();
        } catch (e) {
            toast({ variant: "destructive", title: "Error al guardar prueba" });
        }
    };

    // Muestras de indicadores reales (Fake logic for demo component)
    const stats = useMemo(() => {
        const total = viajesData?.length || 0;
        const excesosVel = viajesData?.filter(v => v.hasExcesoVelocidad).length || 0;
        const excesosJor = viajesData?.filter(v => v.isExcesoJornada).length || 0;
        return {
            velocidad: total > 0 ? Math.round(((total - excesosVel) / total) * 100) : 0,
            fatiga: total > 0 ? Math.round(((total - excesosJor) / total) * 100) : 0
        };
    }, [viajesData]);

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">Programas Smart PESV</h1>
                    <p className="text-text-secondary mt-1">Gestión dinámica de riesgos críticos (Paso 8 - Resolución 40595)</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => setIsAlcoOpen(true)} className="bg-red-600 hover:bg-red-500 font-bold uppercase gap-2 h-12 shadow-lg shadow-red-900/20">
                        <UserMinus className="size-5" /> Test Alcoholemia
                    </Button>
                    <Button variant="outline" className="font-bold border-border-dark text-white h-12">
                        <TrendingDown className="size-5 mr-2" /> Reporte Gerencial
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {PROGRAMAS_UI.map((progDef) => {
                    const saved = savedProgramas?.find(p => p.id === progDef.id);
                    const realValue = progDef.id === 'velocidad' ? stats.velocidad : progDef.id === 'fatiga' ? stats.fatiga : 0;
                    const progress = saved ? 100 : 0;

                    return (
                        <Card key={progDef.id} className="bg-surface-dark border-border-dark flex flex-col group relative transition-all hover:bg-white/[0.03] shadow-xl overflow-hidden">
                            <div className={`h-1 w-full ${saved ? 'bg-emerald-500' : 'bg-primary/20'}`} />

                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className={`p-4 rounded-2xl ${progDef.bg} ${progDef.color} transition-transform group-hover:scale-110 duration-300`}>
                                        <progDef.icon className="size-7" />
                                    </div>
                                    <Badge variant="outline" className="text-[10px] font-black border-white/10 text-text-secondary uppercase tracking-widest">Paso {progDef.paso}</Badge>
                                </div>
                                <CardTitle className="text-xl font-black text-white mt-4 uppercase tracking-tight">{progDef.titulo}</CardTitle>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className={`size-2 rounded-full ${saved ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                                    <span className="text-[10px] font-bold text-text-secondary uppercase">{saved ? 'Programado y Activo' : 'Pendiente Parametrización'}</span>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-6 flex-1 pt-4">
                                {/* Real-time Indicator if available */}
                                {(progDef.id === 'velocidad' || progDef.id === 'fatiga') && (
                                    <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-text-secondary uppercase">Desempeño en Vivo</span>
                                            <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[10px]">{realValue}% Cumpl.</Badge>
                                        </div>
                                        <Progress value={realValue} className="h-1 bg-white/5" indicatorClassName="bg-emerald-500" />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-text-secondary uppercase">Actividades</p>
                                        <p className="text-sm font-black text-white">{saved?.actividades?.length || 0} Reg.</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-text-secondary uppercase">Presupuesto</p>
                                        <p className="text-sm font-black text-emerald-500">${saved?.presupuestoAsignado?.toLocaleString() || '0'}</p>
                                    </div>
                                </div>
                            </CardContent>

                            <CardFooter className="pt-0 border-t border-border-dark">
                                <Button onClick={() => handleOpenDetail(progDef)} variant="ghost" className="w-full text-primary hover:bg-primary/10 font-black uppercase text-xs h-12 gap-2 tracking-widest">
                                    Configurar Programa <ChevronRight className="size-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            {/* DETALLE DEL PROGRAMA */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-5xl bg-surface-dark border-border-dark text-white p-0 overflow-hidden max-h-[90vh]">
                    <DialogHeader className="p-6 bg-white/5 border-b border-border-dark">
                        <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-2xl ${selectedProg?.bg} ${selectedProg?.color}`}>
                                {selectedProg && <selectedProg.icon className="size-6" />}
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black uppercase text-white">{selectedProg?.titulo}</DialogTitle>
                                <p className="text-sm text-text-secondary">Estructuración técnica del programa de prevención.</p>
                            </div>
                        </div>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <Tabs defaultValue="planeacion" className="w-full">
                                <TabsList className="bg-transparent border-b border-border-dark w-full justify-start rounded-none h-auto p-0 gap-0">
                                    <TabsTrigger value="planeacion" className="data-[state=active]:border-b-primary font-bold py-4 px-8 rounded-none border-b-2 border-transparent">Parametrización</TabsTrigger>
                                    <TabsTrigger value="indicadores" className="data-[state=active]:border-b-primary font-bold py-4 px-8 rounded-none border-b-2 border-transparent">Factores y Metas</TabsTrigger>
                                    <TabsTrigger value="cronograma" className="data-[state=active]:border-b-primary font-bold py-4 px-8 rounded-none border-b-2 border-transparent">Actividades (Paso 9)</TabsTrigger>
                                </TabsList>

                                <div className="p-8 space-y-6 overflow-y-auto max-h-[50vh] custom-scrollbar">
                                    <TabsContent value="planeacion" className="mt-0 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <FormField control={form.control} name="fechaInicio" render={({ field }) => (
                                                <FormItem><FormLabel className="text-xs font-black uppercase">Fecha Inicio</FormLabel><FormControl><Input type="date" {...field} className="bg-background-dark border-border-dark" /></FormControl></FormItem>
                                            )} />
                                            <FormField control={form.control} name="duracionMeses" render={({ field }) => (
                                                <FormItem><FormLabel className="text-xs font-black uppercase">Duración (Meses)</FormLabel><FormControl><Input type="number" {...field} className="bg-background-dark border-border-dark" /></FormControl></FormItem>
                                            )} />
                                            <FormField control={form.control} name="presupuestoAsignado" render={({ field }) => (
                                                <FormItem><FormLabel className="text-xs font-black uppercase">Presupuesto ($)</FormLabel><FormControl><Input type="number" {...field} className="bg-background-dark border-border-dark" /></FormControl></FormItem>
                                            )} />
                                        </div>
                                        <FormField control={form.control} name="objetivoGeneral" render={({ field }) => (
                                            <FormItem><FormLabel className="text-xs font-black uppercase">Objetivo General</FormLabel><FormControl><Textarea {...field} className="bg-background-dark border-border-dark h-20" placeholder="¿Qué se busca lograr con este programa?" /></FormControl></FormItem>
                                        )} />
                                        <FormField control={form.control} name="lineamientoAlcance" render={({ field }) => (
                                            <FormItem><FormLabel className="text-xs font-black uppercase">Alcance y Lineamiento</FormLabel><FormControl><Textarea {...field} className="bg-background-dark border-border-dark h-20" placeholder="¿A quiénes aplica?" /></FormControl></FormItem>
                                        )} />
                                        <FormField control={form.control} name="responsableId" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-black uppercase">Cargo Responsable</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger className="bg-background-dark border-border-dark"><SelectValue placeholder="Seleccione responsable..." /></SelectTrigger></FormControl>
                                                    <SelectContent className="bg-surface-dark border-border-dark text-white">
                                                        <SelectItem value="Lider PESV">Líder del PESV</SelectItem>
                                                        <SelectItem value="Coordinador HSEQ">Coordinador HSEQ</SelectItem>
                                                        <SelectItem value="Gerencia Operativa">Gerencia Operativa</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )} />
                                    </TabsContent>

                                    <TabsContent value="indicadores" className="mt-0 space-y-6">
                                        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-3 text-blue-200">
                                            <TrendingDown className="size-5 shrink-0" />
                                            <p className="text-xs">Los factores de desempeño vinculados medirán automáticamente el cumplimiento real contrastado con los viajes y eventos registrados en el sistema.</p>
                                        </div>
                                        {form.watch("factoresDesempeno")?.map((_, idx) => (
                                            <div key={idx} className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-4">
                                                <FormField control={form.control} name={`factoresDesempeno.${idx}.descripcion`} render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[10px] font-bold uppercase">Factor a Medir</FormLabel><FormControl><Input {...field} className="bg-background-dark border-border-dark" /></FormControl></FormItem>
                                                )} />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <FormField control={form.control} name={`factoresDesempeno.${idx}.indicadorId`} render={({ field }) => (
                                                        <FormItem><FormLabel className="text-[10px] font-bold uppercase">Indicador Asociado (Paso 20)</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl><SelectTrigger className="bg-background-dark border-border-dark"><SelectValue /></SelectTrigger></FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="Ind-8">Indicador 8: Excesos Velocidad</SelectItem>
                                                                    <SelectItem value="Ind-6">Indicador 6: Jornada de Trabajo</SelectItem>
                                                                    <SelectItem value="Ind-20">Indicador 20: Siniestralidad</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )} />
                                                    <FormField control={form.control} name={`factoresDesempeno.${idx}.meta`} render={({ field }) => (
                                                        <FormItem><FormLabel className="text-[10px] font-bold uppercase">Meta de Cumpl. (%)</FormLabel><FormControl><Input type="number" {...field} className="bg-background-dark border-border-dark" /></FormControl></FormItem>
                                                    )} />
                                                </div>
                                            </div>
                                        ))}
                                        <Button type="button" variant="outline" className="w-full border-dashed border-border-dark text-white font-bold" onClick={() => {
                                            const current = form.getValues("factoresDesempeno") || [];
                                            form.setValue("factoresDesempeno", [...current, { descripcion: "", indicadorId: "Ind-8", meta: 90 }]);
                                        }}>
                                            <Plus className="size-4 mr-2" /> Agregar Factor de Medición
                                        </Button>
                                    </TabsContent>

                                    <TabsContent value="cronograma" className="mt-0 space-y-4">
                                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex gap-3 text-emerald-200">
                                            <Calendar className="size-5 shrink-0" />
                                            <p className="text-xs">Estas actividades se sincronizan con su calendario PESV. Asegúrese de cargar evidencia para cada una.</p>
                                        </div>
                                        <div className="space-y-3">
                                            {form.watch("actividades")?.map((_, idx) => (
                                                <div key={idx} className="flex gap-2 items-end bg-black/20 p-4 rounded-xl border border-white/5">
                                                    <FormField control={form.control} name={`actividades.${idx}.nombre`} render={({ field }) => (
                                                        <FormItem className="flex-1"><FormLabel className="text-[10px] font-bold uppercase">Actividad</FormLabel><FormControl><Input {...field} className="bg-background-dark border-border-dark h-9" /></FormControl></FormItem>
                                                    )} />
                                                    <FormField control={form.control} name={`actividades.${idx}.fecha`} render={({ field }) => (
                                                        <FormItem className="w-40"><FormLabel className="text-[10px] font-bold uppercase">Fecha</FormLabel><FormControl><Input type="date" {...field} className="bg-background-dark border-border-dark h-9" /></FormControl></FormItem>
                                                    )} />
                                                    <FormField control={form.control} name={`actividades.${idx}.estado`} render={({ field }) => (
                                                        <FormItem className="w-32"><FormLabel className="text-[10px] font-bold uppercase">Estado</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl><SelectTrigger className="bg-background-dark border-border-dark h-9"><SelectValue /></SelectTrigger></FormControl>
                                                                <SelectContent><SelectItem value="Pendiente">Pendiente</SelectItem><SelectItem value="En Proceso">En Proceso</SelectItem><SelectItem value="Ejecutada">Ejecutada</SelectItem></SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )} />
                                                    <Button type="button" variant="ghost" size="icon" className="text-red-500 mb-1" onClick={() => {
                                                        const current = form.getValues("actividades");
                                                        form.setValue("actividades", current.filter((_, i) => i !== idx));
                                                    }}><Trash2 className="size-4" /></Button>
                                                </div>
                                            ))}
                                            <Button type="button" variant="outline" className="w-full border-dashed border-border-dark text-white font-bold" onClick={() => {
                                                const current = form.getValues("actividades") || [];
                                                form.setValue("actividades", [...current, { nombre: "", fecha: "", estado: "Pendiente", impactaPlanAnual: true }]);
                                            }}>
                                                <Plus className="size-4 mr-2" /> Programar Actividad
                                            </Button>
                                        </div>
                                    </TabsContent>
                                </div>
                            </Tabs>

                            <DialogFooter className="p-6 bg-white/5 border-t border-border-dark">
                                <Button type="submit" className="bg-primary hover:bg-primary/90 text-white font-black uppercase h-12 px-12 gap-2 shadow-xl shadow-primary/20">
                                    <Save className="size-5" /> Guardar Parametrización
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* DIALOG ALCOHOLEMIA */}
            <Dialog open={isAlcoOpen} onOpenChange={setIsAlcoOpen}>
                <DialogContent className="max-w-md bg-surface-dark border-border-dark text-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase text-red-500">Prueba de Alcohol y Drogas</DialogTitle>
                        <DialogDescription>Registro de control sorpresa o preventivo obligatorio (Paso 8.4).</DialogDescription>
                    </DialogHeader>
                    <Form {...alcoForm}>
                        <form onSubmit={alcoForm.handleSubmit(onAlcoSubmit)} className="space-y-5 py-4">
                            <FormField control={alcoForm.control} name="conductorId" render={({ field }) => (
                                <FormItem><FormLabel className="text-xs font-bold uppercase">Conductor Evaluado</FormLabel><FormControl><Input {...field} className="bg-background-dark border-border-dark" placeholder="Nombre o ID" /></FormControl></FormItem>
                            )} />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={alcoForm.control} name="tipoPrueba" render={({ field }) => (
                                    <FormItem><FormLabel className="text-xs font-bold uppercase">Motivo</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger className="bg-background-dark border-border-dark"><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent><SelectItem value="Aleatoria">Aleatoria</SelectItem><SelectItem value="Post-Accidente">Post-Accidente</SelectItem><SelectItem value="Sospecha">Sospecha</SelectItem></SelectContent>
                                        </Select>
                                    </FormItem>
                                )} />
                                <FormField control={alcoForm.control} name="resultadoGrado" render={({ field }) => (
                                    <FormItem><FormLabel className="text-xs font-bold uppercase">Grado Alcohol</FormLabel><FormControl><Input type="number" step="0.1" {...field} className="bg-background-dark border-border-dark" /></FormControl></FormItem>
                                )} />
                            </div>
                            <FormField control={alcoForm.control} name="resultadoDrogas" render={({ field }) => (
                                <FormItem><FormLabel className="text-xs font-bold uppercase">Sustancias Psicoactivas</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger className="bg-background-dark border-border-dark"><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent><SelectItem value="Negativo">Negativo (-) </SelectItem><SelectItem value="Positivo">Positivo (+)</SelectItem></SelectContent>
                                    </Select>
                                </FormItem>
                            )} />
                            <Button type="submit" className="w-full bg-red-600 font-black uppercase h-12">Registrar Resultado</Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
