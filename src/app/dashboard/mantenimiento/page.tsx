
'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
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
import { toast } from '@/hooks/use-toast';

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
  const { profile, user } = useUser();
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
    if (!firestore || !profile?.empresaId || !user) return;
    
    // Trazabilidad Multi-tenant (Fase 2.4)
    const traceability = {
      empresaId: profile.empresaId,
      creadoPor: user.uid,
      creadoPorEmail: user.email,
      fechaRegistro: new Date().toISOString(),
      estado: "Ejecutado"
    };

    try {
      const colRef = collection(firestore, 'empresas', profile.empresaId, 'mantenimientos');
      addDocumentNonBlocking(colRef, { ...values, ...traceability });
      toast({ title: "Mantenimiento Registrado" });
      setOpen(false);
      form.reset();
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Mantenimiento PESV (Paso 17)</h1>
          <p className="text-text-secondary mt-1">Control de servicios aislados por empresa</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold shadow-lg shadow-primary/20 bg-primary"><Plus className="w-4 h-4 mr-2" /> Registrar Servicio</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-surface-dark border-border-dark text-white">
            <DialogHeader><DialogTitle className="uppercase font-black">Nueva Intervención Técnica</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="vehiculoId" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold">VEHÍCULO</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="bg-background-dark border-border-dark"><SelectValue placeholder="Placa" /></SelectTrigger></FormControl>
                        <SelectContent className="bg-surface-dark border-border-dark text-white">
                          {vehiculos?.map(v => <SelectItem key={v.id} value={v.placa}>{v.placa}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
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
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="taller" render={({ field }) => (
                    <FormItem><FormLabel className="text-[10px] font-bold">TALLER</FormLabel><FormControl><Input {...field} className="bg-background-dark border-border-dark" /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="tecnicoResponsable" render={({ field }) => (
                    <FormItem><FormLabel className="text-[10px] font-bold">TÉCNICO</FormLabel><FormControl><Input {...field} className="bg-background-dark border-border-dark" /></FormControl></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="descripcion" render={({ field }) => (
                  <FormItem><FormLabel className="text-[10px] font-bold">DETALLE</FormLabel><FormControl><Textarea {...field} className="bg-background-dark border-border-dark" /></FormControl></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="costo" render={({ field }) => (
                    <FormItem><FormLabel className="text-[10px] font-bold">COSTO ($)</FormLabel><FormControl><Input type="number" {...field} className="bg-background-dark border-border-dark" /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="fechaEjecucion" render={({ field }) => (
                    <FormItem><FormLabel className="text-[10px] font-bold">FECHA</FormLabel><FormControl><Input type="date" {...field} className="bg-background-dark border-border-dark" /></FormControl></FormItem>
                  )} />
                </div>
                <Button type="submit" className="w-full font-black uppercase">Guardar en Hoja de Vida</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-surface-dark border-border-dark shadow-2xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border-dark bg-white/5">
                <TableHead className="text-[10px] font-black uppercase">Vehículo</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Servicio</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Taller</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Fecha / Costo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4}><Skeleton className="h-12 bg-white/5" /></TableCell></TableRow>
              ) : mantenimientos?.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-20 italic">Sin registros para esta empresa.</TableCell></TableRow>
              ) : (
                mantenimientos?.map(mtto => (
                  <TableRow key={mtto.id} className="border-border-dark hover:bg-white/5">
                    <TableCell className="font-black text-white">{mtto.vehiculoId}</TableCell>
                    <TableCell>
                      <Badge className={mtto.tipo === 'Correctivo' ? 'bg-red-500' : 'bg-blue-500'}>{mtto.tipo?.toUpperCase()}</Badge>
                      <p className="text-xs text-white mt-1">{mtto.descripcion}</p>
                    </TableCell>
                    <TableCell className="text-xs">{mtto.taller}</TableCell>
                    <TableCell>
                      <p className="text-xs text-white font-bold">{mtto.fechaEjecucion}</p>
                      <p className="text-[10px] font-mono text-emerald-500">${mtto.costo?.toLocaleString()}</p>
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
