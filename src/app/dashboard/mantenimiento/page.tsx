'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Plus, Calendar, Settings, AlertTriangle, CheckCircle2 } from "lucide-react";
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
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const MOCK_EMPRESA_ID = "demo-empresa-123";

const maintenanceSchema = z.object({
  vehiculoId: z.string().min(1, "Vehículo requerido"),
  tipo: z.string(),
  descripcion: z.string().min(5, "Descripción requerida"),
  costo: z.coerce.number().min(0),
  fechaEjecucion: z.string(),
});

export default function MantenimientoPage() {
  const firestore = useFirestore();
  const [open, setOpen] = useState(false);

  const mantenimientosRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'empresas', MOCK_EMPRESA_ID, 'mantenimientos'),
      orderBy('fechaEjecucion', 'desc')
    );
  }, [firestore]);

  const { data: mantenimientos, isLoading } = useCollection(mantenimientosRef);

  const vehiculosRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'empresas', MOCK_EMPRESA_ID, 'vehiculos'));
  }, [firestore]);
  const { data: vehiculos } = useCollection(vehiculosRef);

  const form = useForm<z.infer<typeof maintenanceSchema>>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      vehiculoId: "",
      tipo: "Preventivo",
      descripcion: "",
      costo: 0,
      fechaEjecucion: new Date().toISOString().split('T')[0],
    },
  });

  function onSubmit(values: z.infer<typeof maintenanceSchema>) {
    if (!firestore) return;
    const colRef = collection(firestore, 'empresas', MOCK_EMPRESA_ID, 'mantenimientos');
    addDocumentNonBlocking(colRef, {
      ...values,
      empresaId: MOCK_EMPRESA_ID,
      estado: "Ejecutado"
    });
    setOpen(false);
    form.reset();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Plan de Mantenimiento</h1>
          <p className="text-text-secondary mt-1">Gestión de servicios preventivos y correctivos (Paso 17 del PESV)</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="font-bold border-border-dark text-white">Configurar Alertas</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="font-bold shadow-lg shadow-primary/20 bg-primary">
                <Plus className="w-4 h-4 mr-2" />
                Programar Mantenimiento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-surface-dark border-border-dark text-white">
              <DialogHeader>
                <DialogTitle>Nueva Orden de Trabajo</DialogTitle>
                <DialogDescription className="text-text-secondary">
                  Registre los detalles del servicio realizado al vehículo.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="vehiculoId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehículo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background-dark border-border-dark">
                              <SelectValue placeholder="Seleccione placa" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-surface-dark border-border-dark text-white">
                            {vehiculos?.map(v => (
                              <SelectItem key={v.id} value={v.placa}>{v.placa}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Mantenimiento</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background-dark border-border-dark">
                              <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-surface-dark border-border-dark text-white">
                            <SelectItem value="Preventivo">Preventivo</SelectItem>
                            <SelectItem value="Correctivo">Correctivo</SelectItem>
                            <SelectItem value="Predictivo">Predictivo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="descripcion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción del Servicio</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Cambio de aceite y filtros" {...field} className="bg-background-dark border-border-dark" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="costo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Costo ($)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} className="bg-background-dark border-border-dark" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fechaEjecucion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="bg-background-dark border-border-dark" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="w-full font-bold">Registrar Mantenimiento</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="bg-surface-dark border-border-dark">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Mantenimientos Hoy</p>
                <h3 className="text-2xl font-black text-white">{mantenimientos?.length || 0}</h3>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Calendar className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Vencimientos Críticos</p>
                <h3 className="text-2xl font-black text-red-500">2</h3>
              </div>
              <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                <AlertTriangle className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Cumplimiento Plan</p>
                <h3 className="text-2xl font-black text-emerald-500">92%</h3>
              </div>
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                <CheckCircle2 className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Gastos Mes</p>
                <h3 className="text-2xl font-black text-white">$12.4M</h3>
              </div>
              <div className="p-2 bg-white/5 rounded-lg text-white">
                <Settings className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-surface-dark border-border-dark">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold text-white">Historial de Mantenimientos</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-[10px] border-border-dark text-white">Preventivos</Badge>
            <Badge variant="outline" className="text-[10px] border-border-dark text-white">Correctivos</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border-dark hover:bg-transparent">
                <TableHead className="text-text-secondary font-bold uppercase text-[10px] text-left">Vehículo</TableHead>
                <TableHead className="text-text-secondary font-bold uppercase text-[10px] text-left">Tipo</TableHead>
                <TableHead className="text-text-secondary font-bold uppercase text-[10px] text-left">Descripción</TableHead>
                <TableHead className="text-text-secondary font-bold uppercase text-[10px] text-left">Fecha</TableHead>
                <TableHead className="text-text-secondary font-bold uppercase text-[10px] text-left">Costo</TableHead>
                <TableHead className="text-text-secondary font-bold uppercase text-[10px] text-left">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse border-border-dark">
                    <TableCell colSpan={6} className="h-12 bg-white/5" />
                  </TableRow>
                ))
              ) : (
                mantenimientos?.map(mtto => (
                  <TableRow key={mtto.id} className="border-border-dark hover:bg-white/5 transition-colors">
                    <TableCell className="font-bold text-white">{mtto.vehiculoId}</TableCell>
                    <TableCell>
                      <Badge className={mtto.tipo === 'Correctivo' ? 'bg-red-500/10 text-red-500 font-bold' : 'bg-blue-500/10 text-blue-500 font-bold'}>
                        {mtto.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-text-secondary max-w-xs truncate">{mtto.descripcion}</TableCell>
                    <TableCell className="text-xs text-white">{mtto.fechaEjecucion}</TableCell>
                    <TableCell className="font-mono text-xs text-white">${mtto.costo.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] font-bold">{mtto.estado.toUpperCase()}</Badge>
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
