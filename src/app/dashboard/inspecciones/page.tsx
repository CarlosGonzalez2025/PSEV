'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
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

const MOCK_EMPRESA_ID = "demo-empresa-123";

const inspectionSchema = z.object({
  vehiculoId: z.string().min(1, "Vehículo requerido"),
  conductorId: z.string().min(1, "Conductor requerido"),
  kilometraje: z.coerce.number().min(0),
  aprobadoParaCircular: z.boolean().default(true),
  estadoGeneral: z.string().default("Bueno"),
});

export default function InspeccionesPage() {
  const firestore = useFirestore();
  const [open, setOpen] = useState(false);

  const inspeccionesRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'empresas', MOCK_EMPRESA_ID, 'inspeccionesPreoperacionales'),
      orderBy('fechaHora', 'desc'),
      limit(20)
    );
  }, [firestore]);

  const { data: inspecciones, isLoading } = useCollection(inspeccionesRef);

  const vehiculosRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'empresas', MOCK_EMPRESA_ID, 'vehiculos'));
  }, [firestore]);
  const { data: vehiculos } = useCollection(vehiculosRef);

  const conductoresRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'empresas', MOCK_EMPRESA_ID, 'conductores'));
  }, [firestore]);
  const { data: conductores } = useCollection(conductoresRef);

  const form = useForm<z.infer<typeof inspectionSchema>>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      vehiculoId: "",
      conductorId: "",
      kilometraje: 0,
      aprobadoParaCircular: true,
      estadoGeneral: "Bueno",
    },
  });

  function onSubmit(values: z.infer<typeof inspectionSchema>) {
    if (!firestore) return;
    const colRef = collection(firestore, 'empresas', MOCK_EMPRESA_ID, 'inspeccionesPreoperacionales');
    addDocumentNonBlocking(colRef, {
      ...values,
      empresaId: MOCK_EMPRESA_ID,
      fechaHora: new Date().toISOString(),
      itemsChequeados: JSON.stringify({ luces: "ok", frenos: "ok", llantas: "ok" }),
      alertaBloqueoGenerada: !values.aprobadoParaCircular
    });
    setOpen(false);
    form.reset();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Inspecciones Diarias</h1>
          <p className="text-text-secondary mt-1">Control preoperacional de flota (Paso 16 del PESV)</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Inspección
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-surface-dark border-border-dark text-white">
            <DialogHeader>
              <DialogTitle>Registro Preoperacional</DialogTitle>
              <DialogDescription className="text-text-secondary">
                Verifique el estado del vehículo antes de iniciar la jornada.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="vehiculoId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehículo (Placa)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background-dark border-border-dark">
                            <SelectValue placeholder="Seleccione placa" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-surface-dark border-border-dark text-white">
                          {vehiculos?.map(v => (
                            <SelectItem key={v.id} value={v.placa}>{v.placa} ({v.marca})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="conductorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conductor</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background-dark border-border-dark">
                            <SelectValue placeholder="Seleccione conductor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-surface-dark border-border-dark text-white">
                          {conductores?.map(c => (
                            <SelectItem key={c.id} value={c.nombreCompleto}>{c.nombreCompleto}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="kilometraje"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kilometraje Actual</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="bg-background-dark border-border-dark" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="aprobadoParaCircular"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border border-border-dark p-3 bg-background-dark">
                      <div className="space-y-0.5">
                        <FormLabel>Aprobado para Circular</FormLabel>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="size-5 rounded border-border-dark text-primary focus:ring-primary"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full font-bold">Enviar Inspección</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase text-emerald-500">Aprobadas Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">42</div>
            <p className="text-[10px] text-emerald-500 mt-1 flex items-center gap-1"><CheckCircle2 className="size-3" /> 100% operatividad</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase text-red-500">Rechazadas / Bloqueadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">3</div>
            <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1"><XCircle className="size-3" /> Falla crítica en frenos</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase text-amber-500">Pendientes Turno</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">12</div>
            <p className="text-[10px] text-amber-500 mt-1 flex items-center gap-1"><AlertCircle className="size-3" /> Turno 2 (Tarde)</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-surface-dark border-border-dark">
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-3 size-4 text-text-secondary" />
            <Input className="pl-10 bg-background-dark border-border-dark text-white" placeholder="Buscar por placa o conductor..." />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border-dark hover:bg-transparent">
                <TableHead className="text-text-secondary font-bold uppercase text-[10px]">Fecha / Hora</TableHead>
                <TableHead className="text-text-secondary font-bold uppercase text-[10px]">Vehículo</TableHead>
                <TableHead className="text-text-secondary font-bold uppercase text-[10px]">Conductor</TableHead>
                <TableHead className="text-text-secondary font-bold uppercase text-[10px]">Kilometraje</TableHead>
                <TableHead className="text-text-secondary font-bold uppercase text-[10px]">Estado</TableHead>
                <TableHead className="text-right text-text-secondary font-bold uppercase text-[10px]">Detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse border-border-dark">
                    <TableCell colSpan={6} className="h-16 bg-white/5" />
                  </TableRow>
                ))
              ) : inspecciones?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-text-secondary italic">No se han registrado inspecciones hoy.</TableCell>
                </TableRow>
              ) : (
                inspecciones?.map(insp => (
                  <TableRow key={insp.id} className="border-border-dark hover:bg-white/5 transition-colors">
                    <TableCell className="font-mono text-xs text-white">
                      {insp.fechaHora?.replace('T', ' ')}
                    </TableCell>
                    <TableCell className="font-bold text-white">{insp.vehiculoId.toUpperCase()}</TableCell>
                    <TableCell className="text-text-secondary text-xs">{insp.conductorId}</TableCell>
                    <TableCell className="text-white font-mono text-xs">{insp.kilometraje.toLocaleString()} km</TableCell>
                    <TableCell>
                      <Badge className={insp.aprobadoParaCircular ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold" : "bg-red-500/10 text-red-500 border-red-500/20 font-bold"}>
                        {insp.aprobadoParaCircular ? 'APTO' : 'NO APTO'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-primary font-bold">Ver Checklist</Button>
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
