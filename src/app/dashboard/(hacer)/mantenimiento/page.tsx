
'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Plus, Calendar, Settings, AlertTriangle, CheckCircle2, UserCircle, Briefcase, FileText, Hash } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { toast } from '@/hooks/use-toast';

// === SISTEMAS DE SEGURIDAD INTERVENIBLES (Res. 40595) ===
const SISTEMAS_VEHICULARES = [
  "Frenos", "Llantas", "Dirección", "Suspensión", "Luces",
  "Motor", "Transmisión", "Sistema eléctrico", "Carrocería",
  "Escape", "Refrigeración", "Aceite y filtros", "Correas y mangueras",
  "Batería", "Limpiaparabrisas", "Cinturones de seguridad", "Espejos",
  "Sistema de combustible", "Alineación y balanceo", "Otro"
] as const;

const maintenanceSchema = z.object({
  // === Identificación ===
  vehiculoId: z.string().min(1, "Vehículo requerido"),
  consecutivoOT: z.string().optional().or(z.literal("")),

  // === Clasificación ===
  tipo: z.string().default("Preventivo"),
  origen: z.string().default("Programado"),
  estado: z.string().default("Programado"),

  // === Ejecución ===
  descripcion: z.string().min(5, "Descripción requerida"),
  sistemasIntervenidos: z.array(z.string()).optional().default([]),
  fechaProgramada: z.string().optional().or(z.literal("")),
  fechaEjecucion: z.string(),
  kmAlServicio: z.coerce.number().min(0).optional().default(0),
  kmProximoMantenimiento: z.coerce.number().min(0).optional().default(0),

  // === Responsables ===
  taller: z.string().min(3, "Nombre del taller requerido"),
  tecnicoResponsable: z.string().min(3, "Técnico requerido"),

  // === Insumos y costos ===
  repuestosUtilizados: z.string().optional().or(z.literal("")),
  costo: z.coerce.number().min(0),

  // === Observaciones ===
  observaciones: z.string().optional().or(z.literal("")),
});

type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;

export default function MantenimientoPage() {
  const firestore = useFirestore();
  const { profile, user } = useUser();
  const [open, setOpen] = useState(false);
  const [selectedSistemas, setSelectedSistemas] = useState<string[]>([]);

  const mantenimientosRef = useMemoFirebase(() => {
    if (!firestore || !profile?.empresaId) return null;
    return query(
      collection(firestore, 'empresas', profile.empresaId, 'mantenimientos'),
      orderBy('fechaEjecucion', 'desc')
    );
  }, [firestore, profile?.empresaId]);

  const { data: mantenimientos, isLoading } = useCollection(mantenimientosRef);

  const vehiculosRef = useMemoFirebase(() => {
    if (!firestore || !profile?.empresaId) return null;
    return query(collection(firestore, 'empresas', profile.empresaId, 'vehiculos'));
  }, [firestore, profile?.empresaId]);
  const { data: vehiculos } = useCollection(vehiculosRef);

  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema),
    mode: "onTouched",
    defaultValues: {
      vehiculoId: "", consecutivoOT: "",
      tipo: "Preventivo", origen: "Programado", estado: "Programado",
      descripcion: "", sistemasIntervenidos: [],
      fechaProgramada: "", fechaEjecucion: new Date().toISOString().split('T')[0],
      kmAlServicio: 0, kmProximoMantenimiento: 0,
      taller: "", tecnicoResponsable: "",
      repuestosUtilizados: "", costo: 0, observaciones: "",
    },
  });

  const toggleSistema = (sistema: string) => {
    setSelectedSistemas(prev => {
      const updated = prev.includes(sistema)
        ? prev.filter(s => s !== sistema)
        : [...prev, sistema];
      form.setValue('sistemasIntervenidos', updated);
      return updated;
    });
  };

  const [isSaving, setIsSaving] = useState(false);

  async function onSubmit(values: MaintenanceFormValues) {
    if (!firestore || !profile?.empresaId || !user) return;

    const traceability = {
      empresaId: profile.empresaId,
      creadoPor: user.uid,
      creadoPorEmail: user.email,
      fechaRegistro: new Date().toISOString(),
    };

    setIsSaving(true);
    try {
      const colRef = collection(firestore, 'empresas', profile.empresaId, 'mantenimientos');
      addDocumentNonBlocking(colRef, {
        ...values,
        sistemasIntervenidos: selectedSistemas,
        ...traceability,
      });
      toast({ title: "Mantenimiento Registrado", description: `OT: ${values.consecutivoOT || 'Auto'}` });
      handleClose();
    } catch (e) {
      toast({ variant: "destructive", title: "Error al guardar" });
    } finally {
      setIsSaving(false);
    }
  }

  const handleClose = () => {
    setOpen(false);
    setSelectedSistemas([]);
    form.reset();
  };

  // Stats
  const programados = mantenimientos?.filter(m => m.estado === 'Programado').length || 0;
  const ejecutados = mantenimientos?.filter(m => m.estado === 'Ejecutado').length || 0;
  const correctivos = mantenimientos?.filter(m => m.tipo === 'Correctivo').length || 0;
  const cumplimiento = programados + ejecutados > 0
    ? Math.round((ejecutados / (programados + ejecutados)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Mantenimiento PESV (Paso 17)</h1>
          <p className="text-text-secondary mt-1">Hoja de vida técnica y cronograma de mantenimiento preventivo</p>
        </div>

        <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
          <DialogTrigger asChild>
            <Button className="font-bold shadow-lg shadow-primary/20 bg-primary" onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Registrar Servicio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl bg-surface-dark border-border-dark text-white p-0 overflow-hidden">
            <DialogHeader className="p-6 border-b border-border-dark">
              <DialogTitle className="text-xl font-black uppercase">Orden de Trabajo — Intervención Técnica</DialogTitle>
              <DialogDescription className="text-text-secondary">Registro PESV Paso 17 — Resolución 40595/2022</DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <Tabs defaultValue="general" className="w-full">
                  <div className="px-6 bg-background-dark/50">
                    <TabsList className="bg-transparent border-none gap-4 h-12 flex-wrap">
                      <TabsTrigger value="general" className="px-0 font-bold text-xs uppercase">General</TabsTrigger>
                      <TabsTrigger value="sistemas" className="px-0 font-bold text-xs uppercase">Sistemas</TabsTrigger>
                      <TabsTrigger value="ejecucion" className="px-0 font-bold text-xs uppercase">Ejecución</TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {/* === TAB 1: GENERAL === */}
                    <TabsContent value="general" className="mt-0 space-y-4">
                      <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Identificación y Clasificación</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="vehiculoId" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-bold">VEHÍCULO</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger className="bg-background-dark border-border-dark"><SelectValue placeholder="Placa" /></SelectTrigger></FormControl>
                              <SelectContent className="bg-surface-dark border-border-dark text-white">
                                {vehiculos?.map(v => <SelectItem key={v.id} value={v.placa}>{v.placa} — {v.marca} {v.modelo}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="consecutivoOT" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] font-bold">NRO OT (CONSECUTIVO)</FormLabel><FormControl><Input placeholder="OT-001" {...field} className="bg-background-dark border-border-dark" /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="origen" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-bold">ORIGEN</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger className="bg-background-dark border-border-dark"><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent className="bg-surface-dark border-border-dark text-white">
                                <SelectItem value="Programado">Programado (Cronograma)</SelectItem>
                                <SelectItem value="Inspección">Inspección Preoperacional</SelectItem>
                                <SelectItem value="Siniestro">Post-Siniestro</SelectItem>
                                <SelectItem value="Manual">Solicitud Manual</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="tipo" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-bold">TIPO</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger className="bg-background-dark border-border-dark"><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent className="bg-surface-dark border-border-dark text-white">
                                <SelectItem value="Preventivo">Preventivo</SelectItem>
                                <SelectItem value="Correctivo">Correctivo</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="estado" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-bold">ESTADO</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger className="bg-background-dark border-border-dark"><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent className="bg-surface-dark border-border-dark text-white">
                                <SelectItem value="Programado">Programado</SelectItem>
                                <SelectItem value="En ejecución">En Ejecución</SelectItem>
                                <SelectItem value="Ejecutado">Ejecutado</SelectItem>
                                <SelectItem value="Cancelado">Cancelado</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="kmAlServicio" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] font-bold">KM AL MOMENTO DEL SERVICIO</FormLabel><FormControl><Input type="number" {...field} className="bg-background-dark border-border-dark" /></FormControl></FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="descripcion" render={({ field }) => (
                        <FormItem><FormLabel className="text-[10px] font-bold">DESCRIPCIÓN DE LA INTERVENCIÓN</FormLabel><FormControl><Textarea rows={3} placeholder="Detalle de las operaciones realizadas o a realizar..." {...field} className="bg-background-dark border-border-dark" /></FormControl><FormMessage /></FormItem>
                      )} />
                    </TabsContent>

                    {/* === TAB 2: SISTEMAS INTERVENIDOS === */}
                    <TabsContent value="sistemas" className="mt-0 space-y-4">
                      <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Sistemas de Seguridad Intervenidos (Res. 40595)</p>
                      <p className="text-xs text-text-secondary">Seleccione los sistemas del vehículo que serán o fueron intervenidos:</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {SISTEMAS_VEHICULARES.map(sistema => (
                          <button
                            key={sistema}
                            type="button"
                            onClick={() => toggleSistema(sistema)}
                            className={`p-3 rounded-lg border text-left text-xs font-bold transition-all ${selectedSistemas.includes(sistema)
                                ? 'bg-primary/20 border-primary text-primary'
                                : 'bg-background-dark border-border-dark text-text-secondary hover:border-white/30'
                              }`}
                          >
                            <div className="flex items-center gap-2">
                              {selectedSistemas.includes(sistema) && <CheckCircle2 className="size-3" />}
                              {sistema}
                            </div>
                          </button>
                        ))}
                      </div>
                      {selectedSistemas.length > 0 && (
                        <p className="text-xs text-primary font-bold">{selectedSistemas.length} sistema(s) seleccionado(s)</p>
                      )}
                    </TabsContent>

                    {/* === TAB 3: EJECUCIÓN === */}
                    <TabsContent value="ejecucion" className="mt-0 space-y-4">
                      <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Datos de Ejecución y Trazabilidad</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="fechaProgramada" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] font-bold">FECHA PROGRAMADA</FormLabel><FormControl><Input type="date" {...field} className="bg-background-dark border-border-dark" /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="fechaEjecucion" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] font-bold">FECHA EJECUCIÓN</FormLabel><FormControl><Input type="date" {...field} className="bg-background-dark border-border-dark" /></FormControl></FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="taller" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] font-bold">TALLER / PROVEEDOR</FormLabel><FormControl><Input placeholder="Nombre del taller autorizado" {...field} className="bg-background-dark border-border-dark" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="tecnicoResponsable" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] font-bold">TÉCNICO RESPONSABLE</FormLabel><FormControl><Input placeholder="Nombre del técnico" {...field} className="bg-background-dark border-border-dark" /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="repuestosUtilizados" render={({ field }) => (
                        <FormItem><FormLabel className="text-[10px] font-bold">REPUESTOS / INSUMOS UTILIZADOS</FormLabel><FormControl><Textarea rows={2} placeholder="Ej: 4 llantas Michelin 295/80, 1 batería Willard..." {...field} className="bg-background-dark border-border-dark" /></FormControl></FormItem>
                      )} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="costo" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] font-bold">COSTO TOTAL ($)</FormLabel><FormControl><Input type="number" {...field} className="bg-background-dark border-border-dark" /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="kmProximoMantenimiento" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] font-bold">KM PRÓXIMO MANTENIMIENTO</FormLabel><FormControl><Input type="number" placeholder="Ej: 15000" {...field} className="bg-background-dark border-border-dark" /></FormControl></FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="observaciones" render={({ field }) => (
                        <FormItem><FormLabel className="text-[10px] font-bold">OBSERVACIONES</FormLabel><FormControl><Textarea rows={2} {...field} className="bg-background-dark border-border-dark" /></FormControl></FormItem>
                      )} />
                    </TabsContent>
                  </div>

                  <div className="p-6 border-t border-border-dark bg-background-dark/30">
                    <Button type="submit" disabled={isSaving} className="w-full font-black uppercase h-12">
                      {isSaving ? "GUARDANDO..." : "Guardar Orden de Trabajo"}
                    </Button>
                  </div>
                </Tabs>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-surface-dark border-border-dark">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase text-text-secondary">Total Registros</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-black text-white">{mantenimientos?.length || 0}</div></CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark border-l-4 border-l-blue-500">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase text-blue-500">Preventivos</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-black text-white">{mantenimientos?.filter(m => m.tipo === 'Preventivo').length || 0}</div></CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark border-l-4 border-l-red-500">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase text-red-500">Correctivos</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-black text-white">{correctivos}</div></CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase text-emerald-500">CPMVh (Indicador 10)</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">{cumplimiento}%</div>
            <p className="text-[10px] text-text-secondary mt-1">Ejecutados / Programados</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="bg-surface-dark border-border-dark shadow-2xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border-dark bg-white/5">
                <TableHead className="text-[10px] font-black uppercase">OT / Vehículo</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Tipo / Origen</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Sistemas</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Taller</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Fecha / KM</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6}><Skeleton className="h-12 bg-white/5" /></TableCell></TableRow>
              ) : mantenimientos?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20 italic text-text-secondary">Sin registros de mantenimiento para esta empresa.</TableCell></TableRow>
              ) : (
                mantenimientos?.map(mtto => (
                  <TableRow key={mtto.id} className="border-border-dark hover:bg-white/5">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-black text-white">{mtto.vehiculoId}</span>
                        {mtto.consecutivoOT && <span className="text-[10px] text-primary font-mono">{mtto.consecutivoOT}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge className={mtto.tipo === 'Correctivo' ? 'bg-red-500' : 'bg-blue-500'}>{mtto.tipo?.toUpperCase()}</Badge>
                        <span className="text-[10px] text-text-secondary">{mtto.origen || 'Manual'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {(mtto.sistemasIntervenidos as string[] || []).slice(0, 3).map((s: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-[9px] border-border-dark">{s}</Badge>
                        ))}
                        {(mtto.sistemasIntervenidos as string[] || []).length > 3 && (
                          <Badge variant="outline" className="text-[9px] border-border-dark">+{(mtto.sistemasIntervenidos as string[]).length - 3}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-white">{mtto.taller}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs text-white font-bold">{mtto.fechaEjecucion}</span>
                        {mtto.kmAlServicio > 0 && <span className="text-[10px] text-text-secondary">{mtto.kmAlServicio?.toLocaleString()} km</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        mtto.estado === 'Ejecutado' ? 'bg-emerald-500/10 text-emerald-500' :
                          mtto.estado === 'En ejecución' ? 'bg-amber-500/10 text-amber-500' :
                            mtto.estado === 'Cancelado' ? 'bg-red-500/10 text-red-500' :
                              'bg-blue-500/10 text-blue-500'
                      }>
                        {mtto.estado?.toUpperCase() || 'EJECUTADO'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
