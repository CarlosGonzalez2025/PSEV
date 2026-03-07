
'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Plus, 
  Truck, 
  Search, 
  Filter, 
  MoreVertical, 
  Calendar, 
  FileCheck,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Info,
  Eye,
  Edit,
  Trash2
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
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

const vehicleSchema = z.object({
  placa: z.string().min(5, "La placa debe tener al menos 5 caracteres"),
  vin: z.string().min(5, "VIN requerido"),
  numeroMotor: z.string().min(5, "Número de motor requerido"),
  marca: z.string().min(2, "Marca requerida"),
  modelo: z.string().min(2, "Modelo requerido"),
  tipoVehiculo: z.string().min(1, "Clase requerida"),
  cilindraje: z.string().optional().or(z.literal("")),
  carroceria: z.string().optional().or(z.literal("")),
  propietario: z.string().min(3, "Propietario requerido"),
  soatVencimiento: z.string().optional().or(z.literal("")),
  rtmVencimiento: z.string().optional().or(z.literal("")),
  polizaVencimiento: z.string().optional().or(z.literal("")),
  kilometrajeActual: z.coerce.number().min(0, "Debe ser mayor o igual a 0"),
  kilometrajeMensualEstimado: z.coerce.number().min(0, "Debe ser mayor o igual a 0"),
  estadoOperativo: z.string().default("Operativo"),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

export default function VehiculosPage() {
  const firestore = useFirestore();
  const { profile, user } = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<any>(null);

  const vehiculosRef = useMemoFirebase(() => {
    if (!firestore || !profile?.empresaId) return null;
    return query(
      collection(firestore, 'empresas', profile.empresaId, 'vehiculos'),
      orderBy('placa', 'asc')
    );
  }, [firestore, profile?.empresaId]);

  const { data: vehiculos, isLoading } = useCollection(vehiculosRef);

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    mode: "onTouched",
    defaultValues: {
      placa: "", vin: "", numeroMotor: "", marca: "", modelo: "",
      tipoVehiculo: "Automotor", cilindraje: "", carroceria: "", propietario: "",
      soatVencimiento: "", rtmVencimiento: "", polizaVencimiento: "",
      kilometrajeActual: 0, kilometrajeMensualEstimado: 0, estadoOperativo: "Operativo",
    },
  });

  const onSubmit = (values: VehicleFormValues) => {
    if (!firestore || !profile?.empresaId || !user) return;
    
    // Trazabilidad Multi-tenant (Fase 2.4)
    const traceability = {
      empresaId: profile.empresaId,
      creadoPor: user.uid,
      creadoPorEmail: user.email,
      fechaActualizacion: new Date().toISOString()
    };

    try {
      if (editingVehicle) {
        const docRef = doc(firestore, 'empresas', profile.empresaId, 'vehiculos', editingVehicle.id);
        updateDocumentNonBlocking(docRef, { ...values, ...traceability });
        toast({ title: "Vehículo Actualizado" });
      } else {
        const colRef = collection(firestore, 'empresas', profile.empresaId, 'vehiculos');
        addDocumentNonBlocking(colRef, { 
          ...values, 
          ...traceability,
          fechaRegistro: new Date().toISOString() 
        });
        toast({ title: "Vehículo Registrado" });
      }
      handleClose();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "Ocurrió un error al procesar." });
    }
  };

  const handleEdit = (vehicle: any) => {
    setEditingVehicle(vehicle);
    const cleanedValues: any = {};
    Object.keys(vehicleSchema.shape).forEach((key) => {
      const val = vehicle[key];
      const isNum = key === 'kilometrajeActual' || key === 'kilometrajeMensualEstimado';
      cleanedValues[key] = (val !== undefined && val !== null) ? val : (isNum ? 0 : "");
    });
    form.reset(cleanedValues);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingVehicle(null);
    form.reset();
  };

  const handleDelete = () => {
    if (!deletingVehicle || !profile?.empresaId) return;
    const docRef = doc(firestore, 'empresas', profile.empresaId, 'vehiculos', deletingVehicle.id);
    deleteDocumentNonBlocking(docRef);
    setDeletingVehicle(null);
    toast({ title: "Vehículo Eliminado" });
  };

  const checkVencimiento = (fechaStr?: string) => {
    if (!fechaStr) return 'neutral';
    const hoy = new Date();
    const fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) return 'neutral';
    const diff = fecha.getTime() - hoy.getTime();
    const dias = diff / (1000 * 60 * 60 * 24);
    if (dias < 0) return 'vencido';
    if (dias < 30) return 'por-vencer';
    return 'vigente';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase">Gestión de Flota (Paso 16)</h1>
          <p className="text-text-secondary mt-1">Hoja de vida digital aislada por empresa</p>
        </div>
        
        <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
          <DialogTrigger asChild>
            <Button className="font-bold shadow-lg shadow-primary/20 bg-primary" onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Registrar Vehículo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl bg-surface-dark border-border-dark text-white p-0 overflow-hidden">
            <DialogHeader className="p-6 border-b border-border-dark">
              <DialogTitle className="text-xl font-black uppercase">Hoja de Vida de Vehículo</DialogTitle>
              <DialogDescription className="text-text-secondary">Información técnica y legal PESV.</DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <Tabs defaultValue="tecnica" className="w-full">
                  <div className="px-6 bg-background-dark/50">
                    <TabsList className="bg-transparent border-none gap-6 h-12">
                      <TabsTrigger value="tecnica" className="px-0 font-bold text-xs uppercase">Técnica</TabsTrigger>
                      <TabsTrigger value="legal" className="px-0 font-bold text-xs uppercase">Legal</TabsTrigger>
                      <TabsTrigger value="operacion" className="px-0 font-bold text-xs uppercase">Operación</TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="p-6 max-h-[60vh] overflow-y-auto">
                    <TabsContent value="tecnica" className="mt-0 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="placa" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] font-bold">PLACA</FormLabel><FormControl><Input placeholder="ABC-123" {...field} className="bg-background-dark border-border-dark" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="vin" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] font-bold">VIN</FormLabel><FormControl><Input {...field} className="bg-background-dark border-border-dark" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="numeroMotor" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] font-bold">MOTOR</FormLabel><FormControl><Input {...field} className="bg-background-dark border-border-dark" /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="marca" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] font-bold">MARCA</FormLabel><FormControl><Input {...field} className="bg-background-dark border-border-dark" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="modelo" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] font-bold">MODELO</FormLabel><FormControl><Input {...field} className="bg-background-dark border-border-dark" /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="propietario" render={({ field }) => (
                        <FormItem><FormLabel className="text-[10px] font-bold">PROPIETARIO</FormLabel><FormControl><Input {...field} className="bg-background-dark border-border-dark" /></FormControl><FormMessage /></FormItem>
                      )} />
                    </TabsContent>

                    <TabsContent value="legal" className="mt-0 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="soatVencimiento" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] font-bold">SOAT</FormLabel><FormControl><Input type="date" {...field} className="bg-background-dark border-border-dark" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="rtmVencimiento" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] font-bold">RTM</FormLabel><FormControl><Input type="date" {...field} className="bg-background-dark border-border-dark" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="polizaVencimiento" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] font-bold">PÓLIZA</FormLabel><FormControl><Input type="date" {...field} className="bg-background-dark border-border-dark" /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                    </TabsContent>

                    <TabsContent value="operacion" className="mt-0 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="kilometrajeActual" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] font-bold">KM ACTUAL</FormLabel><FormControl><Input type="number" {...field} className="bg-background-dark border-border-dark" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="estadoOperativo" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-bold">ESTADO</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger className="bg-background-dark border-border-dark"><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent className="bg-surface-dark border-border-dark text-white">
                                <SelectItem value="Operativo">Operativo</SelectItem>
                                <SelectItem value="En Taller">En Taller</SelectItem>
                                <SelectItem value="Bloqueado">Bloqueado</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                      </div>
                    </TabsContent>
                  </div>

                  <div className="p-6 border-t border-border-dark bg-background-dark/30">
                    <Button type="submit" className="w-full font-black uppercase h-12">Guardar Datos</Button>
                  </div>
                </Tabs>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-surface-dark border-border-dark">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase text-text-secondary">Inventario Flota</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-black text-white">{vehiculos?.length || 0}</div></CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark border-l-4 border-l-red-500">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase text-red-500">Vencidos</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-black text-white">{vehiculos?.filter(v => checkVencimiento(v.soatVencimiento) === 'vencido' || checkVencimiento(v.rtmVencimiento) === 'vencido').length || 0}</div></CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark border-l-4 border-l-amber-500">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase text-amber-500">Por Vencer</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-black text-white">{vehiculos?.filter(v => checkVencimiento(v.soatVencimiento) === 'por-vencer' || checkVencimiento(v.rtmVencimiento) === 'por-vencer').length || 0}</div></CardContent>
        </Card>
      </div>

      <Card className="bg-surface-dark border-border-dark">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow className="bg-white/5 border-border-dark">
                <TableHead className="text-[10px] font-black uppercase">Activo</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Estado Legal</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Uso</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Operación</TableHead>
                <th className="text-right"></th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5}><Skeleton className="h-12 w-full bg-white/5" /></TableCell></TableRow>
              ) : (
                vehiculos?.map((v) => (
                  <TableRow key={v.id} className="hover:bg-white/5 border-border-dark">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-mono font-black text-white text-lg">{v.placa}</span>
                        <span className="text-[10px] text-primary uppercase font-bold">{v.marca} {v.modelo}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge className={`text-[9px] h-4 ${checkVencimiento(v.soatVencimiento) === 'vencido' ? 'bg-red-500' : 'bg-emerald-500'}`}>SOAT: {v.soatVencimiento || 'N/A'}</Badge>
                        <Badge className={`text-[9px] h-4 ${checkVencimiento(v.rtmVencimiento) === 'vencido' ? 'bg-red-500' : 'bg-emerald-500'}`}>RTM: {v.rtmVencimiento || 'N/A'}</Badge>
                      </div>
                    </TableCell>
                    <TableCell><span className="text-sm font-bold text-white">{v.kilometrajeActual?.toLocaleString()} km</span></TableCell>
                    <TableCell><Badge variant="outline" className="text-emerald-500 border-emerald-500/30">{v.estadoOperativo?.toUpperCase()}</Badge></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="size-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-surface-dark border-border-dark text-white">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/vehiculos/${v.id}`)}><Eye className="size-4 mr-2" /> Ver Detalle</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(v)}><Edit className="size-4 mr-2" /> Editar</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-500" onClick={() => setDeletingVehicle(v)}><Trash2 className="size-4 mr-2" /> Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!deletingVehicle} onOpenChange={(val) => !val && setDeletingVehicle(null)}>
        <AlertDialogContent className="bg-surface-dark border-border-dark text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar Vehículo {deletingVehicle?.placa}?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción es irreversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild><Button variant="ghost">Cancelar</Button></AlertDialogCancel>
            <AlertDialogAction asChild><Button onClick={handleDelete} className="bg-red-600">Eliminar</Button></AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
