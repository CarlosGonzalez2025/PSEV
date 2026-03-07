
'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Plus, AlertCircle, CheckCircle2, XCircle, Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { toast } from '@/hooks/use-toast';

const inspectionSchema = z.object({
  vehiculoId: z.string().min(1, "Vehículo requerido"),
  conductorId: z.string().min(1, "Conductor requerido"),
  kilometraje: z.coerce.number().min(0),
  aprobadoParaCircular: z.boolean().default(true),
  estadoGeneral: z.string().default("Bueno"),
});

export default function InspeccionesPage() {
  const firestore = useFirestore();
  const { profile, user } = useUser();
  const [open, setOpen] = useState(false);

  const inspeccionesRef = useMemoFirebase(() => {
    if (!firestore || !profile?.empresaId) return null;
    return query(
      collection(firestore, 'empresas', profile.empresaId, 'inspeccionesPreoperacionales'),
      orderBy('fechaHora', 'desc'),
      limit(20)
    );
  }, [firestore, profile?.empresaId]);

  const { data: inspecciones, isLoading } = useCollection(inspeccionesRef);

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

  const form = useForm<z.infer<typeof inspectionSchema>>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      vehiculoId: "", conductorId: "", kilometraje: 0, aprobadoParaCircular: true, estadoGeneral: "Bueno",
    },
  });

  function onSubmit(values: z.infer<typeof inspectionSchema>) {
    if (!firestore || !profile?.empresaId || !user) return;
    
    // Trazabilidad Multi-tenant (Fase 2.4)
    const traceability = {
      empresaId: profile.empresaId,
      creadoPor: user.uid,
      creadoPorEmail: user.email,
      fechaHora: new Date().toISOString(),
      itemsChequeados: JSON.stringify({ luces: "ok", frenos: "ok", llantas: "ok" }),
      alertaBloqueoGenerada: !values.aprobadoParaCircular
    };

    try {
      const colRef = collection(firestore, 'empresas', profile.empresaId, 'inspeccionesPreoperacionales');
      addDocumentNonBlocking(colRef, { ...values, ...traceability });
      toast({ title: "Inspección Registrada" });
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
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Inspecciones Diarias</h1>
          <p className="text-text-secondary mt-1">Control preoperacional aislado por empresa</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold bg-primary shadow-lg shadow-primary/20"><Plus className="w-4 h-4 mr-2" /> Nueva Inspección</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-surface-dark border-border-dark text-white">
            <DialogHeader><DialogTitle>Registro Preoperacional</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="vehiculoId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>VEHÍCULO</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="bg-background-dark border-border-dark"><SelectValue placeholder="Placa" /></SelectTrigger></FormControl>
                      <SelectContent className="bg-surface-dark border-border-dark text-white">
                        {vehiculos?.map(v => <SelectItem key={v.id} value={v.placa}>{v.placa}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="conductorId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>CONDUCTOR</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="bg-background-dark border-border-dark"><SelectValue placeholder="Nombre" /></SelectTrigger></FormControl>
                      <SelectContent className="bg-surface-dark border-border-dark text-white">
                        {conductores?.map(c => <SelectItem key={c.id} value={c.nombreCompleto}>{c.nombreCompleto}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="kilometraje" render={({ field }) => (
                  <FormItem><FormLabel>KM ACTUAL</FormLabel><FormControl><Input type="number" {...field} className="bg-background-dark border-border-dark" /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="aprobadoParaCircular" render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-3 bg-background-dark rounded-lg">
                    <FormLabel>APTO PARA CIRCULAR</FormLabel>
                    <FormControl><input type="checkbox" checked={field.value} onChange={field.onChange} className="size-5 rounded" /></FormControl>
                  </FormItem>
                )} />
                <Button type="submit" className="w-full font-bold">Enviar Inspección</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-surface-dark border-border-dark">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow className="border-border-dark bg-white/5">
                <TableHead className="text-[10px] font-black uppercase">Fecha / Hora</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Vehículo</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Estado</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Registrado Por</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4}><Skeleton className="h-12 bg-white/5" /></TableCell></TableRow>
              ) : inspecciones?.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-10 italic">Sin inspecciones registradas.</TableCell></TableRow>
              ) : (
                inspecciones?.map(insp => (
                  <TableRow key={insp.id} className="border-border-dark hover:bg-white/5">
                    <TableCell className="text-xs font-mono">{insp.fechaHora?.replace('T', ' ')}</TableCell>
                    <TableCell className="font-bold text-white">{insp.vehiculoId}</TableCell>
                    <TableCell>
                      <Badge className={insp.aprobadoParaCircular ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}>
                        {insp.aprobadoParaCircular ? 'APTO' : 'NO APTO'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] text-text-secondary">{insp.creadoPorEmail}</TableCell>
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
