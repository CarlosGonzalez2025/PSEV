'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, serverTimestamp, addDoc } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Plus, 
  Truck, 
  Search, 
  Filter, 
  MoreVertical, 
  Calendar, 
  AlertCircle,
  FileCheck
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const MOCK_EMPRESA_ID = "demo-empresa-123";

const vehicleSchema = z.object({
  placa: z.string().min(6, "Placa inválida"),
  marca: z.string().min(2, "Marca requerida"),
  modelo: z.string().min(2, "Modelo requerido"),
  vin: z.string().min(5, "VIN requerido"),
  kilometrajeActual: z.coerce.number().min(0),
  estadoOperativo: z.string().default("Operativo"),
});

export default function VehiculosPage() {
  const firestore = useFirestore();
  const [open, setOpen] = useState(false);

  const vehiculosRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'empresas', MOCK_EMPRESA_ID, 'vehiculos')
    );
  }, [firestore]);

  const { data: vehiculos, isLoading } = useCollection(vehiculosRef);

  const form = useForm<z.infer<typeof vehicleSchema>>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      placa: "",
      marca: "",
      modelo: "",
      vin: "",
      kilometrajeActual: 0,
      estadoOperativo: "Operativo",
    },
  });

  function onSubmit(values: z.infer<typeof vehicleSchema>) {
    if (!firestore) return;
    const colRef = collection(firestore, 'empresas', MOCK_EMPRESA_ID, 'vehiculos');
    addDocumentNonBlocking(colRef, {
      ...values,
      empresaId: MOCK_EMPRESA_ID,
      fechaRegistro: new Date().toISOString(),
      tipoVehiculo: "Automotor",
      propiedad: "Propio"
    });
    setOpen(false);
    form.reset();
  }

  const getStatusBadge = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'operativo':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 font-bold">Operativo</Badge>;
      case 'en taller':
        return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 font-bold">En Taller</Badge>;
      case 'bloqueado':
        return <Badge variant="destructive">Bloqueado</Badge>;
      default:
        return <Badge variant="secondary">{estado || 'N/A'}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Gestión de Flota</h1>
          <p className="text-muted-foreground mt-1">Inventario y estado de activos (Paso 16 del PESV)</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" />
              Registrar Vehículo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-surface-dark border-border-dark text-white">
            <DialogHeader>
              <DialogTitle>Nuevo Vehículo</DialogTitle>
              <DialogDescription className="text-text-secondary">
                Ingrese los datos técnicos del activo para la hoja de vida digital.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="placa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Placa</FormLabel>
                        <FormControl>
                          <Input placeholder="ABC-123" {...field} className="bg-background-dark border-border-dark" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>VIN</FormLabel>
                        <FormControl>
                          <Input placeholder="12345..." {...field} className="bg-background-dark border-border-dark" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="marca"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca</FormLabel>
                        <FormControl>
                          <Input placeholder="Toyota" {...field} className="bg-background-dark border-border-dark" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="modelo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modelo</FormLabel>
                        <FormControl>
                          <Input placeholder="Hilux" {...field} className="bg-background-dark border-border-dark" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="kilometrajeActual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kilometraje Inicial</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="bg-background-dark border-border-dark" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full font-bold">Guardar Vehículo</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Total Vehículos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">{vehiculos?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Activos en plataforma</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/5 border-red-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Alertas Críticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-red-500">2</div>
            <p className="text-xs text-muted-foreground mt-1">Documentos vencidos</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-500/5 border-orange-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Mantenimientos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-orange-500">5</div>
            <p className="text-xs text-muted-foreground mt-1">Programados esta semana</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-surface-dark border-border-dark">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                className="pl-10 bg-background-dark border-border-dark text-white" 
                placeholder="Buscar por placa, modelo o VIN..." 
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-border-dark text-white">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
              <Button variant="outline" size="sm" className="border-border-dark text-white">
                <FileCheck className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border-dark overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/5 border-border-dark">
                  <th className="p-4 font-bold text-xs uppercase text-muted-foreground text-left">Placa</th>
                  <th className="p-4 font-bold text-xs uppercase text-muted-foreground text-left">Vehículo</th>
                  <th className="p-4 font-bold text-xs uppercase text-muted-foreground text-left">Kilometraje</th>
                  <th className="p-4 font-bold text-xs uppercase text-muted-foreground text-left">Estado</th>
                  <th className="p-4 font-bold text-xs uppercase text-muted-foreground text-left">Próx. Mantenimiento</th>
                  <th className="p-4 text-right"></th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-border-dark">
                      <TableCell><Skeleton className="h-4 w-20 bg-white/5" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32 bg-white/5" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24 bg-white/5" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-full bg-white/5" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32 bg-white/5" /></TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))
                ) : vehiculos?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No hay vehículos registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  vehiculos?.map((v) => (
                    <TableRow key={v.id} className="hover:bg-white/5 transition-colors border-border-dark">
                      <TableCell className="font-mono font-bold text-white">{v.placa}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-white">{v.marca} {v.modelo}</span>
                          <span className="text-[10px] text-muted-foreground">VIN: {v.vin?.slice(-6)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-white">{v.kilometrajeActual?.toLocaleString()} km</TableCell>
                      <TableCell>{getStatusBadge(v.estadoOperativo)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>15 Nov 2023</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
