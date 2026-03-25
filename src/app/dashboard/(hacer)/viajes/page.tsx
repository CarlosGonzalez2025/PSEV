'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit, doc, updateDoc, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Activity, Plus, Clock, MapPin, Gauge, AlertTriangle, Route,
    PlayCircle, StopCircle, Coffee, CheckCircle2, ShieldCheck, Timer, Info, Save, Loader2
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { toast } from '@/hooks/use-toast';
import { isInspectionApproved, isInspectionForSameDay } from '@/lib/inspection-config';
import { validarContratistaParaDespacho } from '@/actions/contratistas';

// === ESQUEMA DE DATOS PESV (Planificación de Desplazamientos y Gestión de Fatiga - Pasos 15 y 8) ===
const tripSchema = z.object({
    vehiculoId: z.string().min(1, "Vehículo requerido"),
    conductorId: z.string().min(1, "Conductor requerido"),
    rutaId: z.string().min(1, "Ruta requerida"),
    tipoViaje: z.enum(["Laboral (Misión)", "In Itinere", "Salida Extramural"]),

    kmInicial: z.coerce.number().min(0),
    kmFinal: z.coerce.number().min(0).optional().default(0),

    fechaHoraInicio: z.string(),
    fechaHoraFin: z.string().optional().or(z.literal("")),

    // Control de Pausas (Dinámico)
    pausas: z.array(z.object({
        inicio: z.string(),
        fin: z.string().optional(),
        ubicacion: z.string().optional()
    })).default([]),

    tiempoPausasTotalesMinutos: z.coerce.number().min(0).default(0),

    // Telemetría (Paso 8 y 20)
    alertasExcesoVelocidad: z.coerce.number().min(0).default(0),
    alertasFrenadasBruscas: z.coerce.number().min(0).default(0),

    estado: z.string().default("En Ruta"),
    observaciones: z.string().optional().or(z.literal("")),
});

type TripFormValues = z.infer<typeof tripSchema>;

export default function ViajesTelemetriaPage() {
    const firestore = useFirestore();
    const { profile, user } = useUser();
    const [open, setOpen] = useState(false);
    const [isOpenCierre, setIsOpenCierre] = useState(false);
    const [selectedViaje, setSelectedViaje] = useState<any>(null);
    const [preopValid, setPreopValid] = useState<boolean | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isValidatingContratista, setIsValidatingContratista] = useState(false);

    // Queries
    const viajesRef = useMemoFirebase(() => {
        if (!firestore || !profile?.empresaId) return null;
        return query(
            collection(firestore, 'empresas', profile.empresaId, 'viajes'),
            orderBy('fechaHoraInicio', 'desc'),
            limit(50)
        );
    }, [firestore, profile?.empresaId]);
    const { data: viajes, isLoading } = useCollection(viajesRef);

    const vehiculosRef = useMemoFirebase(() => {
        if (!firestore || !profile?.empresaId) return null;
        return query(collection(firestore, 'empresas', profile.empresaId, 'vehiculos'));
    }, [firestore, profile?.empresaId]);
    const { data: vehiculos } = useCollection(vehiculosRef);

    const conductoresRef = useMemoFirebase(() => {
        if (!firestore || !profile?.empresaId) return null;
        return query(collection(firestore, 'empresas', profile.empresaId, 'conductores'));
    }, [firestore, profile?.empresaId]);
    const { data: conductores } = useCollection(conductoresRef);

    const rutasRef = useMemoFirebase(() => {
        if (!firestore || !profile?.empresaId) return null;
        return query(collection(firestore, 'empresas', profile.empresaId, 'rutasInventario'));
    }, [firestore, profile?.empresaId]);
    const { data: rutasDefinidas } = useCollection(rutasRef);

    const formApertura = useForm<TripFormValues>({
        resolver: zodResolver(tripSchema),
        defaultValues: {
            vehiculoId: "",
            conductorId: "",
            rutaId: "",
            tipoViaje: "Laboral (Misión)",
            kmInicial: 0,
            fechaHoraInicio: new Date().toISOString().slice(0, 16),
            pausas: [],
            estado: "En Ruta",
        },
    });

    const watchVehiculo = formApertura.watch("vehiculoId");
    const watchConductor = formApertura.watch("conductorId");

    // Validación de Preoperacional y Conductor (Pasos 16, 15, 11) + Hard Stop Contratista (Paso 18)
    useEffect(() => {
        async function checkCompliance() {
            if (!firestore || !profile?.empresaId) return;

            setPreopValid(true); // Default

            // 1. Validar Preoperacional si hay vehículo seleccionado
            if (watchVehiculo) {
                const v = vehiculos?.find(veh => veh.placa === watchVehiculo);
                const c = conductores?.find(cond => cond.nombreCompleto === watchConductor);
                if (v) {
                    formApertura.setValue("kmInicial", v.kilometrajeActual || 0);
                    // Aquí se debería validar si existe inspección para hoy
                    // setPreopValid(isInspectionApproved(v));
                }

                // VALIDACIÓN PASO 18: CONTRATISTAS (HARD STOP)
                if (v?.contratistaId) {
                    setIsValidatingContratista(true);
                    try {
                        const validation = await validarContratistaParaDespacho(v.contratistaId, v.id, c?.id);
                        if (validation.bloqueado) {
                            toast({
                                variant: "destructive",
                                title: "BLOQUEO PASO 18",
                                description: validation.motivo
                            });
                            setPreopValid(false);
                        }
                    } catch (error) {
                        console.error("Error validando contratista:", error);
                    } finally {
                        setIsValidatingContratista(false);
                    }
                }
            }

            // 2. Validar Conductor (Licencia Vencida)
            if (watchConductor && preopValid) {
                const c = conductores?.find(cond => cond.nombreCompleto === watchConductor);
                if (c?.fechaVencimientoLicencia) {
                    const expired = new Date(c.fechaVencimientoLicencia) < new Date();
                    if (expired) {
                        toast({
                            variant: "destructive",
                            title: "Licencia Vencida",
                            description: `El conductor ${c.nombreCompleto} no puede operar.`
                        });
                        setPreopValid(false);
                    }
                }
            }
        }
        checkCompliance();
    }, [watchVehiculo, watchConductor, firestore, profile?.empresaId, vehiculos, conductores, formApertura]);

    async function onAperturaSubmit(values: TripFormValues) {
        if (!firestore || !profile?.empresaId || !user) return;
        if (!preopValid) {
            toast({ variant: "destructive", title: "Bloqueo de Seguridad", description: "Verifique cumplimientos de seguridad antes de despachar." });
            return;
        }
        setIsSaving(true);
        try {
            const colRef = collection(firestore, 'empresas', profile.empresaId, 'viajes');
            await addDocumentNonBlocking(colRef, {
                ...values,
                horasConduccionTotales: 0,
                distanciaRecorrida: 0,
                creadoPor: user.email,
                fechaRegistro: new Date().toISOString(),
            });
            toast({ title: "🚗 Viaje Iniciado", description: "Hoja de ruta aperturada." });
            setOpen(false);
            formApertura.reset();
        } catch (e) {
            toast({ variant: "destructive", title: "Error al iniciar ruta" });
        } finally {
            setIsSaving(false);
        }
    }

    const handleActionPause = async (viaje: any, action: 'start' | 'stop') => {
        if (!firestore || !profile?.empresaId) return;
        const now = new Date().toISOString();
        const updatedPausas = [...(viaje.pausas || [])];

        if (action === 'start') {
            updatedPausas.push({ inicio: now, ubicacion: "Reportada por conductor" });
        } else {
            const lastIdx = updatedPausas.length - 1;
            if (lastIdx >= 0) updatedPausas[lastIdx].fin = now;
        }

        await updateDoc(doc(firestore, 'empresas', profile.empresaId, 'viajes', viaje.id), {
            pausas: updatedPausas
        });
        toast({ title: action === 'start' ? "☕ Pausa Iniciada" : "▶️ Viaje Reanudado" });
    };

    const formCierre = useForm<Partial<TripFormValues>>();

    const handleAbrirCierre = (viaje: any) => {
        setSelectedViaje(viaje);
        const totalPausasMin = (viaje.pausas || []).reduce((acc: number, p: any) => {
            if (p.inicio && p.fin) {
                return acc + (new Date(p.fin).getTime() - new Date(p.inicio).getTime()) / (1000 * 60);
            }
            return acc;
        }, 0);

        formCierre.reset({
            kmFinal: viaje.kmInicial,
            fechaHoraFin: new Date().toISOString().slice(0, 16),
            tiempoPausasTotalesMinutos: Math.round(totalPausasMin),
            alertasExcesoVelocidad: 0,
            alertasFrenadasBruscas: 0,
            observaciones: viaje.observaciones || "",
        });
        setIsOpenCierre(true);
    };

    async function onCierreSubmit(values: any) {
        if (!firestore || !profile?.empresaId || !selectedViaje) return;
        setIsSaving(true);
        try {
            const docRef = doc(firestore, 'empresas', profile.empresaId, 'viajes', selectedViaje.id);
            const inicio = new Date(selectedViaje.fechaHoraInicio);
            const fin = new Date(values.fechaHoraFin);
            const totalHrs = (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60);
            const pausasHrs = values.tiempoPausasTotalesMinutos / 60;
            const netHrs = Math.max(0, totalHrs - pausasHrs);
            const dist = Math.max(0, values.kmFinal - selectedViaje.kmInicial);

            const v = vehiculos?.find(veh => veh.placa === selectedViaje.vehiculoId);
            if (v && values.kmFinal > v.kilometrajeActual) {
                await updateDoc(doc(firestore, 'empresas', profile.empresaId, 'vehiculos', v.id), {
                    kilometrajeActual: values.kmFinal
                });
            }

            await updateDoc(docRef, {
                ...values,
                estado: "Finalizado",
                horasConduccionTotales: Number(netHrs.toFixed(2)),
                distanciaRecorrida: dist,
                isExcesoJornada: netHrs > 10,
                hasExcesoVelocidad: values.alertasExcesoVelocidad > 0
            });

            toast({ title: "🏁 Viaje Cerrado", description: `Distancia: ${dist}km.` });
            setIsOpenCierre(false);
        } catch (e) {
            toast({ variant: "destructive", title: "Error al cerrar viaje" });
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Control de Desplazamientos</h1>
                    <p className="text-text-secondary mt-1">Planificación y seguimiento en ruta (Pasos 14 y 15)</p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90 text-white font-black uppercase h-12 px-8 shadow-lg">
                            <Plus className="w-5 h-5 mr-2" /> Programar Despacho
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl bg-surface-dark border-border-dark text-foreground p-0 overflow-hidden">
                        <DialogHeader className="p-6 bg-white/5 border-b border-border-dark">
                            <DialogTitle className="text-xl font-black uppercase flex items-center gap-3">
                                <PlayCircle className="size-6 text-primary" /> Apertura de Hoja de Ruta
                            </DialogTitle>
                        </DialogHeader>

                        <Form {...formApertura}>
                            <form onSubmit={formApertura.handleSubmit(onAperturaSubmit)} className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={formApertura.control} name="vehiculoId" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase text-text-secondary">Vehículo</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger className="bg-background-dark border-border-dark"><SelectValue placeholder="Seleccione placa" /></SelectTrigger></FormControl>
                                                <SelectContent className="bg-surface-dark border-border-dark text-foreground">
                                                    {vehiculos?.map(v => <SelectItem key={v.id} value={v.placa}>{v.placa} ({v.marca})</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )} />
                                    <FormField control={formApertura.control} name="conductorId" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase text-text-secondary">Conductor</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger className="bg-background-dark border-border-dark"><SelectValue placeholder="Nombre" /></SelectTrigger></FormControl>
                                                <SelectContent className="bg-surface-dark border-border-dark text-foreground">
                                                    {conductores?.map(c => <SelectItem key={c.id} value={c.nombreCompleto}>{c.nombreCompleto}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )} />
                                </div>

                                {watchVehiculo && (
                                    <div className={`p-4 rounded-xl border flex items-center justify-between ${preopValid ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                        <div className="flex items-center gap-3">
                                            {isValidatingContratista ? <Loader2 className="size-5 animate-spin text-primary" /> : (preopValid ? <ShieldCheck className="size-5 text-emerald-500" /> : <AlertTriangle className="size-5 text-red-500" />)}
                                            <span className="text-sm font-bold">
                                                {isValidatingContratista ? "Validando cumplimiento de contratista..." : (preopValid ? "Validaciones de seguridad aprobadas" : "Bloqueo de seguridad activo")}
                                            </span>
                                        </div>
                                        {preopValid && !isValidatingContratista && <Badge className="bg-emerald-500 text-white border-none text-[10px]">OK</Badge>}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={formApertura.control} name="rutaId" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase text-text-secondary">Ruta</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger className="bg-background-dark border-border-dark"><SelectValue placeholder="Ruta guardada" /></SelectTrigger></FormControl>
                                                <SelectContent className="bg-surface-dark border-border-dark text-foreground">
                                                    {rutasDefinidas?.map(r => <SelectItem key={r.id} value={r.nombreRuta}>{r.nombreRuta}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )} />
                                    <FormField control={formApertura.control} name="tipoViaje" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase text-text-secondary">Tipo Desplazamiento</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger className="bg-background-dark border-border-dark"><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent className="bg-surface-dark border-border-dark text-foreground">
                                                    <SelectItem value="Laboral (Misión)">Laboral (Misión)</SelectItem>
                                                    <SelectItem value="In Itinere">In Itinere (Casa-Trabajo)</SelectItem>
                                                    <SelectItem value="Salida Extramural">Salida Extramural</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )} />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/5 mt-4">
                                    <FormField control={formApertura.control} name="fechaHoraInicio" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase">Hora de Salida</FormLabel>
                                            <FormControl><Input type="datetime-local" {...field} className="bg-background-dark border-border-dark" /></FormControl>
                                        </FormItem>
                                    )} />
                                    <FormField control={formApertura.control} name="kmInicial" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase">Kilometraje Inicial</FormLabel>
                                            <FormControl><Input type="number" {...field} className="bg-background-dark border-border-dark" /></FormControl>
                                        </FormItem>
                                    )} />
                                </div>

                                <Button type="submit" disabled={isSaving || !preopValid || isValidatingContratista} className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 font-black uppercase text-white shadow-xl">
                                    {isSaving ? "Procesando..." : "Despachar Vehículo"}
                                </Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>

                {/* Dialog Cierre */}
                <Dialog open={isOpenCierre} onOpenChange={setIsOpenCierre}>
                    <DialogContent className="max-w-2xl bg-surface-dark border-border-dark text-foreground p-0">
                        <DialogHeader className="p-6 bg-emerald-500/10 border-b border-border-dark">
                            <DialogTitle className="text-xl font-black uppercase text-emerald-500">Consolidación de Viaje</DialogTitle>
                        </DialogHeader>
                        <Form {...formCierre}>
                            <form onSubmit={formCierre.handleSubmit(onCierreSubmit)} className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={formCierre.control} name="fechaHoraFin" render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs font-bold uppercase">Llegada Real</FormLabel><FormControl><Input type="datetime-local" {...field} className="bg-background-dark border-border-dark" /></FormControl></FormItem>
                                    )} />
                                    <FormField control={formCierre.control} name="kmFinal" render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs font-bold uppercase">Kilometraje Final</FormLabel><FormControl><Input type="number" {...field} className="bg-background-dark border-border-dark" /></FormControl></FormItem>
                                    )} />
                                </div>
                                <FormField control={formCierre.control} name="tiempoPausasTotalesMinutos" render={({ field }) => (
                                    <FormItem><FormLabel className="text-xs font-bold uppercase">Total Pausas (Minutos)</FormLabel><FormControl><Input type="number" {...field} className="bg-background-dark border-border-dark" /></FormControl></FormItem>
                                )} />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={formCierre.control} name="alertasExcesoVelocidad" render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs font-bold text-red-400 uppercase">Excesos Velocidad</FormLabel><FormControl><Input type="number" {...field} className="bg-background-dark border-red-500/20" /></FormControl></FormItem>
                                    )} />
                                    <FormField control={formCierre.control} name="alertasFrenadasBruscas" render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs font-bold text-orange-400 uppercase">Frenadas Bruscas</FormLabel><FormControl><Input type="number" {...field} className="bg-background-dark border-orange-500/20" /></FormControl></FormItem>
                                    )} />
                                </div>
                                <Button type="submit" disabled={isSaving} className="w-full bg-emerald-600 font-black h-12 uppercase">Cerrar Hoja de Ruta</Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* List and Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-220px)] overflow-hidden">
                <div className="lg:col-span-12 bg-surface-dark border border-border-dark rounded-xl flex flex-col overflow-hidden shadow-2xl">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border-dark bg-white/5">
                                <TableHead className="text-[10px] font-black uppercase text-text-secondary">Vehículo / Conductor</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-text-secondary">Ruta / Tipo</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-text-secondary">Inicio / KM</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-text-secondary text-center">Gestión Pausas</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-right text-text-secondary">Estado / Acción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-10 opacity-50">Cargando viajes...</TableCell></TableRow>
                            ) : viajes?.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-10 opacity-50 italic">No hay viajes registrados.</TableCell></TableRow>
                            ) : viajes?.map(viaje => (
                                <TableRow key={viaje.id} className="border-border-dark hover:bg-white/5 transition-colors">
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-black text-foreground">{viaje.vehiculoId}</span>
                                            <span className="text-[10px] text-text-secondary">{viaje.conductorId}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-bold text-primary truncate max-w-[150px] uppercase">{viaje.rutaId}</span>
                                            <Badge variant="outline" className="text-[8px] w-fit border-border-dark">{viaje.tipoViaje}</Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-foreground">{new Date(viaje.fechaHoraInicio).toLocaleString()}</span>
                                            <span className="text-[10px] text-text-secondary">{viaje.kmInicial} KM</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {viaje.estado === 'En Ruta' && (
                                            <div className="flex justify-center gap-2">
                                                {viaje.pausas?.at(-1)?.inicio && !viaje.pausas?.at(-1)?.fin ? (
                                                    <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold bg-white/5 border-emerald-500/30 text-emerald-400" onClick={() => handleActionPause(viaje, 'stop')}>
                                                        <Timer className="size-3 mr-1" /> Reanudar
                                                    </Button>
                                                ) : (
                                                    <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold bg-white/5 border-amber-500/30 text-amber-500" onClick={() => handleActionPause(viaje, 'start')}>
                                                        <Coffee className="size-3 mr-1" /> Pausa
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                        {viaje.estado === 'Finalizado' && (
                                            <span className="text-[10px] text-emerald-500 font-bold">{viaje.tiempoPausasTotalesMinutos}m Pausas</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <Badge className={viaje.estado === 'Finalizado' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-blue-500/20 text-blue-500 animate-pulse'}>
                                                {viaje.estado}
                                            </Badge>
                                            {viaje.estado === 'En Ruta' && (
                                                <Button size="sm" className="h-8 bg-red-600 text-white font-bold text-[10px] uppercase" onClick={() => handleAbrirCierre(viaje)}>Terminar</Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
