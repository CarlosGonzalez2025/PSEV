
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
  const { profile } = useUser();
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
      placa: "",
      vin: "",
      numeroMotor: "",
      marca: "",
      modelo: "",
      tipoVehiculo: "Automotor",
      cilindraje: "",
      carroceria: "",
      propietario: "",
      soatVencimiento: "",
      rtmVencimiento: "",
      polizaVencimiento: "",
      kilometrajeActual: 0,
      kilometrajeMensualEstimado: 0,
      estadoOperativo: "Operativo",
    },
  });

  const onSubmit = (values: VehicleFormValues) => {
    if (!firestore || !profile?.empresaId) return;
    
    try {
      if (editingVehicle) {
        const docRef = doc(firestore, 'empresas', profile.empresaId, 'vehiculos', editingVehicle.id);
        updateDocumentNonBlocking(docRef, {
          ...values,
          fechaActualizacion: new Date().toISOString()
        });
        toast({ title: "Vehículo Actualizado", description: `La unidad ${values.placa} ha sido modificada.` });
      } else {
        const colRef = collection(firestore, 'empresas', profile.empresaId, 'vehiculos');
        addDocumentNonBlocking(colRef, {
          ...values,
          empresaId: profile.empresaId,
          fechaRegistro: new Date().toISOString(),
        });
        toast({ title: "Vehículo Registrado", description: `Se ha creado la hoja de vida para ${values.placa}.` });
      }
      handleClose();
    } catch (error: any) {
      console.error("Error al guardar:", error);
      toast({ variant: "destructive", title: "Error", description: "Ocurrió un error al procesar la solicitud." });
    }
  };

  const onInvalid = (errors: any) => {
    console.error("Errores de validación detallados:", errors);
    const firstErrorKey = Object.keys(errors)[0];
    const firstErrorMessage = errors[firstErrorKey]?.message;
    
    toast({ 
      variant: "destructive", 
      title: "Información Incompleta", 
      description: firstErrorMessage || "Por favor revisa todas las pestañas. Hay campos obligatorios marcados en rojo." 
    });
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
    form.reset({
      placa: "", vin: "", numeroMotor: "", marca: "", modelo: "",
      tipoVehiculo: "Automotor", cilindraje: "", carroceria: "", propietario: "",
      soatVencimiento: "", rtmVencimiento: "", polizaVencimiento: "",
      kilometrajeActual: 0, kilometrajeMensualEstimado: 0, estadoOperativo: "Operativo"
    });
  };

  const handleDelete = () => {
    if (!deletingVehicle || !profile?.empresaId) return;
    const docRef = doc(firestore, 'empresas', profile.empresaId, 'vehiculos', deletingVehicle.id);
    deleteDocumentNonBlocking(docRef);
    setDeletingVehicle(null);
    toast({ title: "Vehículo Eliminado", description: "El registro ha sido removido del sistema." });
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
          <h1 className="text-3xl font-black tracking-tight text-white uppercase">Gestión de Flota (Paso 5 y 17)</h1>
          <p className="text-text-secondary mt-1">Hoja de vida digital y control de vigencias legales PESV</p>
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
              <DialogTitle className="text-xl font-black uppercase">
                {editingVehicle ? 'Editar Hoja de Vida' : 'Nueva Hoja de Vida de Vehículo'}
              </DialogTitle>
              <DialogDescription className="text-text-secondary">
                Información obligatoria según Resolución 40595 para desplazamientos laborales.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
                <Tabs defaultValue="tecnica" className="w-full">
                  <div className="px-6 bg-background-dark/50">
                    <TabsList className="bg-transparent border-none gap-6 h-12">
                      <TabsTrigger value="tecnica" className="data-[state=active]:bg-transparent data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 font-bold text-xs uppercase">Identificación Técnica</TabsTrigger>
                      <TabsTrigger value="legal" className="data-[state=active]:bg-transparent data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 font-bold text-xs uppercase">Documentación y Vigencias</TabsTrigger>
                      <TabsTrigger value="operacion" className="data-[state=active]:bg-transparent data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 font-bold text-xs uppercase">Operación y Uso</TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="p-6 max-h-[60vh] overflow-y-auto">
                    <TabsContent value="tecnica" className="mt-0 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="placa" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] uppercase font-bold">Placa</FormLabel><FormControl><Input placeholder="ABC-123" {...field} className="bg-background-dark border-border-dark text-white" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="vin" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] uppercase font-bold">VIN / Chasis</FormLabel><FormControl><Input placeholder="1234567..." {...field} className="bg-background-dark border-border-dark text-white" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="numeroMotor" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] uppercase font-bold">Número de Motor</FormLabel><FormControl><Input placeholder="M-12345..." {...field} className="bg-background-dark border-border-dark text-white" /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="marca" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] uppercase font-bold">Marca</FormLabel><FormControl><Input placeholder="Toyota" {...field} className="bg-background-dark border-border-dark text-white" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="modelo" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] uppercase font-bold">Modelo (Año)</FormLabel><FormControl><Input placeholder="2023" {...field} className="bg-background-dark border-border-dark text-white" /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="tipoVehiculo" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] uppercase font-bold">Clase</FormLabel><FormControl><Input placeholder="Camión / Automóvil" {...field} className="bg-background-dark border-border-dark text-white" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="cilindraje" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] uppercase font-bold">Cilindraje</FormLabel><FormControl><Input placeholder="2500 cc" {...field} className="bg-background-dark border-border-dark text-white" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="carroceria" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] uppercase font-bold">Carrocería</FormLabel><FormControl><Input placeholder="Furgón / Sedan" {...field} className="bg-background-dark border-border-dark text-white" /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="propietario" render={({ field }) => (
                        <FormItem><FormLabel className="text-[10px] uppercase font-bold">Propietario / Empresa Afiliada</FormLabel><FormControl><Input placeholder="Razón Social o Nombre" {...field} className="bg-background-dark border-border-dark text-white" /></FormControl><FormMessage /></FormItem>
                      )} />
                    </TabsContent>

                    <TabsContent value="legal" className="mt-0 space-y-4">
                      <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 mb-4 flex items-start gap-3">
                        <ShieldCheck className="size-5 text-primary mt-0.5" />
                        <p className="text-xs text-text-secondary leading-relaxed">
                          El sistema generará alertas automáticas 30 días antes del vencimiento de estos documentos para garantizar el cumplimiento del Paso 17.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="soatVencimiento" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] uppercase font-bold">Vencimiento SOAT</FormLabel><FormControl><Input type="date" {...field} className="bg-background-dark border-border-dark text-white" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="rtmVencimiento" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] uppercase font-bold">Vencimiento RTM</FormLabel><FormControl><Input type="date" {...field} className="bg-background-dark border-border-dark text-white" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="polizaVencimiento" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] uppercase font-bold">Vencimiento Póliza Todo Riesgo</FormLabel><FormControl><Input type="date" {...field} className="bg-background-dark border-border-dark text-white" /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                    </TabsContent>

                    <TabsContent value="operacion" className="mt-0 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="kilometrajeActual" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] uppercase font-bold">Kilometraje Actual (Corte)</FormLabel><FormControl><Input type="number" {...field} className="bg-background-dark border-border-dark text-white" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="kilometrajeMensualEstimado" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] uppercase font-bold">Km Estimado / Mes</FormLabel><FormControl><Input type="number" {...field} className="bg-background-dark border-border-dark text-white" /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="estadoOperativo" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] uppercase font-bold">Estado Operativo</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background-dark border-border-dark text-white">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-surface-dark border-border-dark text-white">
                              <SelectItem value="Operativo">Operativo</SelectItem>
                              <SelectItem value="En Taller">En Taller</SelectItem>
                              <SelectItem value="Bloqueado">Bloqueado</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                    </TabsContent>
                  </div>

                  <div className="p-6 border-t border-border-dark bg-background-dark/30">
                    <Button type="submit" className="w-full font-black uppercase tracking-widest h-12 shadow-lg shadow-primary/20">
                      {editingVehicle ? 'Actualizar Hoja de Vida' : 'Guardar Hoja de Vida'}
                    </Button>
                  </div>
                </Tabs>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-surface-dark border-border-dark">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Inventario Flota</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">{vehiculos?.length || 0} <span className="text-sm font-normal text-text-secondary">Vehículos</span></div>
            <p className="text-[10px] text-primary mt-1 flex items-center gap-1"><Info className="size-3" /> Registrados en PESV</p>
          </CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-red-500">Documentos Vencidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">
              {vehiculos?.filter(v => checkVencimiento(v.soatVencimiento) === 'vencido' || checkVencimiento(v.rtmVencimiento) === 'vencido').length || 0}
            </div>
            <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1"><AlertTriangle className="size-3" /> Acción inmediata requerida</p>
          </CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-amber-500">Próximos Vencimientos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">
              {vehiculos?.filter(v => checkVencimiento(v.soatVencimiento) === 'por-vencer' || checkVencimiento(v.rtmVencimiento) === 'por-vencer').length || 0}
            </div>
            <p className="text-[10px] text-amber-500 mt-1 flex items-center gap-1"><Calendar className="size-3" /> Siguientes 30 días</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-surface-dark border-border-dark">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <Input 
                className="pl-10 bg-background-dark border-border-dark text-white" 
                placeholder="Buscar por placa, VIN o propietario..." 
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-border-dark text-white hover:bg-white/5">
                <FileCheck className="w-4 h-4 mr-2 text-primary" />
                Reporte Legal
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border-dark overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-white/5 border-border-dark hover:bg-transparent">
                  <TableHead className="text-[10px] font-black uppercase text-text-secondary">Activo</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-text-secondary">Identificación Técnica</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-text-secondary">Estado SOAT / RTM</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-text-secondary">Uso (Km)</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-text-secondary">Operación</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-border-dark"><TableCell colSpan={6}><Skeleton className="h-12 bg-white/5" /></TableCell></TableRow>
                  ))
                ) : vehiculos?.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-text-secondary italic">No hay vehículos registrados para esta empresa.</TableCell></TableRow>
                ) : (
                  vehiculos?.map((v) => (
                    <TableRow key={v.id} className="hover:bg-white/5 transition-colors border-border-dark group">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-mono font-black text-white text-lg leading-tight">{v.placa}</span>
                          <span className="text-[10px] text-primary uppercase font-bold">{v.marca} {v.modelo}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <p className="text-[10px] text-text-secondary uppercase">VIN: <span className="text-white font-mono">{v.vin}</span></p>
                          <p className="text-[10px] text-text-secondary uppercase">Motor: <span className="text-white font-mono">{v.numeroMotor}</span></p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between w-32">
                            <span className="text-[9px] font-bold text-text-secondary">SOAT</span>
                            <Badge className={`text-[9px] h-4 ${checkVencimiento(v.soatVencimiento) === 'vencido' ? 'bg-red-500' : checkVencimiento(v.soatVencimiento) === 'por-vencer' ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                              {v.soatVencimiento || 'N/A'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between w-32">
                            <span className="text-[9px] font-bold text-text-secondary">RTM</span>
                            <Badge className={`text-[9px] h-4 ${checkVencimiento(v.rtmVencimiento) === 'vencido' ? 'bg-red-500' : checkVencimiento(v.rtmVencimiento) === 'por-vencer' ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                              {v.rtmVencimiento || 'N/A'}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white">{v.kilometrajeActual?.toLocaleString()} km</span>
                          <span className="text-[9px] text-text-secondary uppercase font-bold">~{v.kilometrajeMensualEstimado} km/mes</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={v.estadoOperativo === 'Operativo' ? 'outline' : 'destructive'} className={v.estadoOperativo === 'Operativo' ? 'text-emerald-500 border-emerald-500/30' : ''}>
                          {v.estadoOperativo?.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-text-secondary hover:text-white">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-surface-dark border-border-dark text-white w-48">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-border-dark" />
                            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`/dashboard/vehiculos/${v.id}`)}>
                              <Eye className="size-4 mr-2 text-primary" /> Ver Hoja de Vida
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => handleEdit(v)}>
                              <Edit className="size-4 mr-2" /> Editar Datos
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border-dark" />
                            <DropdownMenuItem className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10" onClick={() => setDeletingVehicle(v)}>
                              <Trash2 className="size-4 mr-2" /> Eliminar Unidad
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deletingVehicle} onOpenChange={(val) => !val && setDeletingVehicle(null)}>
        <AlertDialogContent className="bg-surface-dark border-border-dark text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-red-500" /> ¿Eliminar Vehículo {deletingVehicle?.placa}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-text-secondary">
              Esta acción eliminará permanentemente la hoja de vida del vehículo. No se pueden recuperar los datos técnicos registrados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="ghost" className="border-border-dark text-white hover:bg-white/5">Cancelar</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Eliminar Definitivamente</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
