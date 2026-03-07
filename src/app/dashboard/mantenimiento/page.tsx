
'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Plus, Calendar, Settings, AlertTriangle, CheckCircle2, UserCircle, Briefcase } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const maintenanceSchema = z.object({
  vehiculoId: z.string().min(1, "Vehículo requerido"),
  tipo: z.string(),
  descripcion: z.string().min(5, "Descripción requerida"),
  costo: z.coerce.number().min(0),
  fechaEjecucion: z.string(),
  taller: z.string().min(3, "Nombre del taller requerido"),
  tecnicoResponsable: z.string().min(3, "Técnico requerido"),
  repuestosUtilizados: z.string().optional(),
});

export default function MantenimientoPage() {
  const firestore = useFirestore();
  const { profile } = useUser();
  const [open, setOpen] = useState(false);

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

  const form = useForm<z.infer<typeof maintenanceSchema>>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      vehiculoId: "",
      tipo: "Preventivo",
      descripcion: "",
      costo: 0,
      fechaEjecucion: new Date().toISOString().split('T')[0],
      taller: "",
      tecnicoResponsable: "",
      repuestosUtilizados: "",
    },
  });

  function onSubmit(values: z.infer<typeof maintenanceSchema>) {
    if (!firestore || !profile?.empresaId) return;
    const colRef = collection(firestore, 'empresas', profile.empresaId, 'mantenimientos');
    addDocumentNonBlocking(colRef, {
      ...values,
      empresaId: profile.empresaId,
      estado: "Ejecutado"
    });
    setOpen(false);
    form.reset();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Control de Mantenimiento (Paso 17)</h1>
          <p className="text-text-secondary mt-1">Trazabilidad de servicios y repuestos para la flota segura</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold shadow-lg shadow-primary/20 bg-primary">
              <Plus className="w-4 h-4 mr-2" />
              Registrar Acción
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-surface-dark border-border-dark text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase">Nueva Orden de Trabajo Ejecutada</DialogTitle>
              <DialogDescription className="text-text-secondary">
                Documente la intervención para la hoja de vida digital del vehículo.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="vehiculoId" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase">Vehículo (Placa)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="bg-background-dark border-border-dark"><SelectValue placeholder="Seleccione placa" /></SelectTrigger></FormControl>
                        <SelectContent className="bg-surface-dark border-border-dark text-white">
                          {vehiculos?.map(v => <SelectItem key={v.id} value={v.placa}>{v.placa}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="tipo" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase">Tipo de Intervención</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="bg-background-dark border-border-dark"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent className="bg-surface-dark border-border-dark text-white">
                          <SelectItem value="Preventivo">Preventivo</SelectItem>
                          <SelectItem value="Correctivo">Correctivo</SelectItem>
                          <SelectItem value="Predictivo">Predictivo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="taller" render={({ field }) => (
                    <FormItem><FormLabel className="text-[10px] font-bold uppercase">Taller / Proveedor</FormLabel><FormControl><div className="relative"><Briefcase className="absolute left-3 top-3 size-4 text-text-secondary" /><Input placeholder="Nombre del taller" {...field} className="pl-10 bg-background-dark border-border-dark text-white" /></div></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="tecnicoResponsable" render={({ field }) => (
                    <FormItem><FormLabel className="text-[10px] font-bold uppercase">Técnico Responsable</FormLabel><FormControl><div className="relative"><UserCircle className="absolute left-3 top-3 size-4 text-text-secondary" /><Input placeholder="Nombre del mecánico" {...field} className="pl-10 bg-background-dark border-border-dark text-white" /></div></FormControl><FormMessage /></FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="descripcion" render={({ field }) => (
                  <FormItem><FormLabel className="text-[10px] font-bold uppercase">Descripción del Servicio</FormLabel><FormControl><Textarea placeholder="Detalle las operaciones realizadas..." {...field} className="bg-background-dark border-border-dark text-white resize-none" /></FormControl><FormMessage /></FormItem>
                )} />

                <FormField control={form.control} name="repuestosUtilizados" render={({ field }) => (
                  <FormItem><FormLabel className="text-[10px] font-bold uppercase">Equipos y Repuestos Reemplazados</FormLabel><FormControl><Input placeholder="Ej: Filtros, Aceite 10W40, Pastillas de freno" {...field} className="bg-background-dark border-border-dark text-white" /></FormControl><FormMessage /></FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="costo" render={({ field }) => (
                    <FormItem><FormLabel className="text-[10px] font-bold uppercase">Costo Total ($)</FormLabel><FormControl><Input type="number" {...field} className="bg-background-dark border-border-dark text-white" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="fechaEjecucion" render={({ field }) => (
                    <FormItem><FormLabel className="text-[10px] font-bold uppercase">Fecha de Ejecución</FormLabel><FormControl><Input type="date" {...field} className="bg-background-dark border-border-dark text-white" /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>

                <Button type="submit" className="w-full font-black uppercase tracking-widest h-12 shadow-lg shadow-primary/20 mt-4">Registrar en Hoja de Vida</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="bg-surface-dark border-border-dark">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Mantenimientos Hoy</p>
                <h3 className="text-2xl font-black text-white">{mantenimientos?.filter(m => m.fechaEjecucion === new Date().toISOString().split('T')[0]).length || 0}</h3>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg text-primary"><Calendar className="size-5" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Trazabilidad Total</p>
                <h3 className="text-2xl font-black text-white">{mantenimientos?.length || 0} <span className="text-xs font-normal opacity-50">Servicios</span></h3>
              </div>
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><CheckCircle2 className="size-5" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark">
          <CardHeader className="p-6 pb-0"><p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Inversión Flota Segura</p></CardHeader>
          <CardContent className="p-6 pt-2">
            <h3 className="text-2xl font-black text-white">${mantenimientos?.reduce((acc, curr) => acc + (Number(curr.costo) || 0), 0).toLocaleString()}</h3>
            <p className="text-[10px] text-text-secondary mt-1 uppercase font-bold">Acumulado histórico</p>
          </CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Correctivos Críticos</p>
                <h3 className="text-2xl font-black text-white">{mantenimientos?.filter(m => m.tipo === 'Correctivo').length || 0}</h3>
              </div>
              <div className="p-2 bg-red-500/10 rounded-lg text-red-500"><AlertTriangle className="size-5" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-surface-dark border-border-dark shadow-2xl">
        <CardHeader className="border-b border-border-dark"><CardTitle className="text-lg font-bold text-white uppercase tracking-tight">Historial de Intervenciones (Trazabilidad PESV)</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border-dark hover:bg-transparent bg-white/5">
                <TableHead className="text-text-secondary font-black uppercase text-[10px]">Vehículo</TableHead>
                <TableHead className="text-text-secondary font-black uppercase text-[10px]">Servicio / Taller</TableHead>
                <TableHead className="text-text-secondary font-black uppercase text-[10px]">Responsable</TableHead>
                <TableHead className="text-text-secondary font-black uppercase text-[10px]">Repuestos</TableHead>
                <TableHead className="text-text-secondary font-black uppercase text-[10px]">Fecha / Costo</TableHead>
                <th className="text-right"></th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse border-border-dark"><TableCell colSpan={6} className="h-16 bg-white/5" /></TableRow>
                ))
              ) : mantenimientos?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20 text-text-secondary italic">No se han registrado mantenimientos bajo la normativa PESV.</TableCell></TableRow>
              ) : (
                mantenimientos?.map(mtto => (
                  <TableRow key={mtto.id} className="border-border-dark hover:bg-white/5 transition-colors group">
                    <TableCell className="font-black text-white text-md">{mtto.vehiculoId}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <Badge className={`w-fit text-[9px] mb-1 ${mtto.tipo === 'Correctivo' ? 'bg-red-500' : 'bg-blue-500'}`}>{mtto.tipo?.toUpperCase()}</Badge>
                        <span className="text-sm font-bold text-white truncate max-w-[200px]">{mtto.descripcion}</span>
                        <span className="text-[10px] text-text-secondary uppercase">{mtto.taller}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary font-bold">{mtto.tecnicoResponsable?.[0]}</div>
                        <span className="text-xs text-text-secondary font-medium">{mtto.tecnicoResponsable}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-text-secondary italic max-w-xs">{mtto.repuestosUtilizados || 'Sin repuestos registrados'}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs text-white font-bold">{mtto.fechaEjecucion}</span>
                        <span className="text-[10px] font-mono text-emerald-500">${mtto.costo?.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-primary font-black uppercase text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">Ver PDF</Button>
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
