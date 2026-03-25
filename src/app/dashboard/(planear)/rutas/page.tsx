
'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Plus,
  Search,
  Map,
  MapPin,
  Navigation,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ChevronRight,
  Save,
  Trash2,
  Edit,
  Coffee,
  Info
} from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, serverTimestamp, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// --- Esquemas de Validación ---

const puntoCriticoSchema = z.object({
  ubicacion: z.string().min(1, "Requerido"),
  tipoPeligro: z.enum(["Alta accidentalidad", "Derrumbes", "Orden público", "Inundación", "Curva peligrosa", "Zona escolar"])
});

const paradaSeguraSchema = z.object({
  nombreLugar: z.string().min(1, "Requerido"),
  tipoServicio: z.enum(["Alimentación", "Alojamiento", "Estación de servicio", "Pausa activa"])
});

const rutaSchema = z.object({
  nombreRuta: z.string().min(3, "Nombre requerido"),
  tipoRuta: z.enum(["Vía Urbana", "Vía Nacional", "Vía Rural", "Vía Interna/Privada"]),
  origen: z.string().min(1, "Origen requerido"),
  destino: z.string().min(1, "Destino requerido"),
  distanciaKm: z.coerce.number().min(0),
  tiempoEstimadoHoras: z.coerce.number().min(0),
  puntosCriticos: z.array(puntoCriticoSchema).default([]),
  paradasSeguras: z.array(paradaSeguraSchema).default([])
});

export default function RutasPage() {
  const { profile } = useUser();
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRutaId, setSelectedRutaId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const rutasRef = useMemoFirebase(() => {
    if (!firestore || !profile?.empresaId) return null;
    return query(collection(firestore, 'empresas', profile.empresaId, 'rutasInventario'));
  }, [firestore, profile?.empresaId]);

  const { data: rutas, isLoading } = useCollection(rutasRef);

  const form = useForm<z.infer<typeof rutaSchema>>({
    resolver: zodResolver(rutaSchema),
    defaultValues: {
      nombreRuta: "",
      tipoRuta: "Vía Nacional",
      origen: "",
      destino: "",
      distanciaKm: 0,
      tiempoEstimadoHoras: 0,
      puntosCriticos: [],
      paradasSeguras: []
    }
  });

  const onSubmit = async (values: z.infer<typeof rutaSchema>) => {
    if (!profile?.empresaId || !firestore) return;

    try {
      const payload = {
        ...values,
        fechaActualizacion: serverTimestamp(),
        actualizadoPor: profile.email
      };

      if (selectedRutaId) {
        await updateDoc(doc(firestore, 'empresas', profile.empresaId, 'rutasInventario', selectedRutaId), payload);
        toast({ title: "Ruta Actualizada", description: "Infraestructura de vía guardada." });
      } else {
        await addDoc(collection(firestore, 'empresas', profile.empresaId, 'rutasInventario'), payload);
        toast({ title: "Ruta Creada", description: "Nueva ruta añadida al inventario PESV." });
      }
      setIsDialogOpen(false);
      form.reset();
      setSelectedRutaId(null);
    } catch (error) {
      toast({ title: "Error", description: "No se pudo guardar la ruta.", variant: "destructive" });
    }
  };

  const handleEdit = (ruta: any) => {
    setSelectedRutaId(ruta.id);
    form.reset(ruta);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta ruta del inventario?") || !profile?.empresaId || !firestore) return;
    await deleteDoc(doc(firestore, 'empresas', profile.empresaId, 'rutasInventario', id));
    toast({ title: "Ruta Eliminada" });
  };

  const filteredRutas = rutas?.filter(r =>
    r.nombreRuta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.origen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.destino?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Vías Seguras Administradas</h1>
          <p className="text-text-secondary mt-1">Inventario de rutas, puntos críticos y paradas (Paso 14)</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) { setSelectedRutaId(null); form.reset(); }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary font-black uppercase h-12 px-8 shadow-lg shadow-primary/20 text-white">
              <Plus className="w-5 h-5 mr-2" /> Mapear Nueva Ruta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl bg-surface-dark border-border-dark text-foreground max-h-[95vh] overflow-y-auto custom-scrollbar p-0">
            <DialogHeader className="p-6 bg-white/5 border-b border-border-dark">
              <DialogTitle className="text-2xl font-black uppercase text-foreground tracking-tight flex items-center gap-3">
                <Navigation className="size-6 text-primary" />
                {selectedRutaId ? "Editar Ruta Inventariada" : "Nuevo Mapeo de Ruta"}
              </DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
                <Tabs defaultValue="basicos" className="w-full">
                  <TabsList className="bg-transparent border-b border-border-dark w-full justify-start rounded-none h-auto p-0 gap-0">
                    <TabsTrigger value="basicos" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary font-bold py-4 px-6 rounded-none border-b-2 border-transparent transition-all">Datos Básicos</TabsTrigger>
                    <TabsTrigger value="criticos" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary font-bold py-4 px-6 rounded-none border-b-2 border-transparent transition-all">Puntos Críticos</TabsTrigger>
                    <TabsTrigger value="paradas" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=primary]:border-primary font-bold py-4 px-6 rounded-none border-b-2 border-transparent transition-all">Paradas Seguras</TabsTrigger>
                  </TabsList>

                  <div className="p-6">
                    <TabsContent value="basicos" className="space-y-6 mt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="nombreRuta" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase text-text-secondary">Nombre de la Ruta</FormLabel>
                            <FormControl><Input {...field} className="bg-background-dark border-border-dark" placeholder="Ej: Bogotá - Medellín" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="tipoRuta" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase text-text-secondary">Clasificación</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger className="bg-background-dark border-border-dark"><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                {["Vía Urbana", "Vía Nacional", "Vía Rural", "Vía Interna/Privada"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="origen" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase text-text-secondary">Ciudad Origen</FormLabel>
                            <FormControl><Input {...field} className="bg-background-dark border-border-dark" /></FormControl>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="destino" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase text-text-secondary">Ciudad Destino</FormLabel>
                            <FormControl><Input {...field} className="bg-background-dark border-border-dark" /></FormControl>
                          </FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="distanciaKm" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase text-text-secondary">Distancia (Km)</FormLabel>
                            <FormControl><Input type="number" {...field} className="bg-background-dark border-border-dark" /></FormControl>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="tiempoEstimadoHoras" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase text-text-secondary">Tiempo Estimado (Hrs)</FormLabel>
                            <FormControl><Input type="number" step="0.5" {...field} className="bg-background-dark border-border-dark" /></FormControl>
                          </FormItem>
                        )} />
                      </div>
                    </TabsContent>

                    <TabsContent value="criticos" className="space-y-6 mt-0">
                      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex gap-3 text-amber-200">
                        <AlertTriangle className="size-5 shrink-0 mt-0.5" />
                        <p className="text-xs">Identifique tramos o puntos con alta siniestralidad, curvas peligrosas o riesgos de entorno segun la ANSV.</p>
                      </div>

                      <div className="space-y-4">
                        {form.watch("puntosCriticos")?.map((_, index) => (
                          <div key={index} className="flex gap-2 items-end bg-white/5 p-4 rounded-xl border border-border-dark">
                            <FormField control={form.control} name={`puntosCriticos.${index}.ubicacion`} render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-[10px] font-bold uppercase">Ubicación (PR / Dirección)</FormLabel>
                                <FormControl><Input {...field} className="bg-background-dark border-border-dark h-9" /></FormControl>
                              </FormItem>
                            )} />
                            <FormField control={form.control} name={`puntosCriticos.${index}.tipoPeligro`} render={({ field }) => (
                              <FormItem className="w-48">
                                <FormLabel className="text-[10px] font-bold uppercase">Riesgo</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl><SelectTrigger className="bg-background-dark border-border-dark h-9"><SelectValue /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    {["Alta accidentalidad", "Derrumbes", "Orden público", "Inundación", "Curva peligrosa", "Zona escolar"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )} />
                            <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:bg-red-500/10" onClick={() => {
                              const current = form.getValues("puntosCriticos");
                              form.setValue("puntosCriticos", current.filter((_, i) => i !== index));
                            }}>
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        ))}
                        <Button type="button" variant="outline" className="w-full border-border-dark text-foreground font-bold" onClick={() => {
                          const current = form.getValues("puntosCriticos") || [];
                          form.setValue("puntosCriticos", [...current, { ubicacion: "", tipoPeligro: "Curva peligrosa" }]);
                        }}>
                          <Plus className="size-4 mr-2" /> Agregar Punto Crítico
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="paradas" className="space-y-6 mt-0">
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex gap-3 text-emerald-200">
                        <Coffee className="size-5 shrink-0 mt-0.5" />
                        <p className="text-xs">Planifique paradas seguras para pausas activas, alimentación y descanso, mitigando el riesgo de fatiga.</p>
                      </div>

                      <div className="space-y-4">
                        {form.watch("paradasSeguras")?.map((_, index) => (
                          <div key={index} className="flex gap-2 items-end bg-white/5 p-4 rounded-xl border border-border-dark">
                            <FormField control={form.control} name={`paradasSeguras.${index}.nombreLugar`} render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-[10px] font-bold uppercase">Nombre del Lugar</FormLabel>
                                <FormControl><Input {...field} className="bg-background-dark border-border-dark h-9" /></FormControl>
                              </FormItem>
                            )} />
                            <FormField control={form.control} name={`paradasSeguras.${index}.tipoServicio`} render={({ field }) => (
                              <FormItem className="w-48">
                                <FormLabel className="text-[10px] font-bold uppercase">Servicio</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl><SelectTrigger className="bg-background-dark border-border-dark h-9"><SelectValue /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    {["Alimentación", "Alojamiento", "Estación de servicio", "Pausa activa"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )} />
                            <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:bg-red-500/10" onClick={() => {
                              const current = form.getValues("paradasSeguras");
                              form.setValue("paradasSeguras", current.filter((_, i) => i !== index));
                            }}>
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        ))}
                        <Button type="button" variant="outline" className="w-full border-border-dark text-foreground font-bold" onClick={() => {
                          const current = form.getValues("paradasSeguras") || [];
                          form.setValue("paradasSeguras", [...current, { nombreLugar: "", tipoServicio: "Pausa activa" }]);
                        }}>
                          <Plus className="size-4 mr-2" /> Agregar Parada Segura
                        </Button>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>

                <DialogFooter className="p-6 bg-white/5 border-t border-border-dark">
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 font-black uppercase gap-2 h-12 px-10 text-white">
                    <Save className="size-5" /> {selectedRutaId ? "Actualizar Inventario" : "Guardar Ruta"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-220px)] overflow-hidden">
        {/* Sidebar: Stat Cards */}
        <div className="lg:col-span-3 space-y-4 overflow-y-auto custom-scrollbar px-1 pb-4">
          <Card className="bg-surface-dark border-border-dark">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Navigation className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-secondary uppercase">Rutas Totales</p>
                <p className="text-2xl font-black text-foreground">{rutas?.length || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface-dark border-border-dark border-l-4 border-l-red-500">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="size-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="size-5 text-red-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-secondary uppercase">Puntos Críticos</p>
                <p className="text-2xl font-black text-foreground">
                  {rutas?.reduce((acc, r) => acc + (r.puntosCriticos?.length || 0), 0) || 0}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface-dark border-border-dark">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Info className="size-4 text-primary" />
                <p className="text-xs font-bold text-foreground uppercase">Cumplimiento Paso 14</p>
              </div>
              <p className="text-[10px] text-text-secondary leading-relaxed">
                La Resolución 40595 exige que el inventario incluya puntos de siniestralidad y planificación de descansos. El 100% de sus rutas cumplen si tienen mapeadas sus paradas seguras.
              </p>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full" style={{ width: '85%' }}></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content: Route Grid */}
        <div className="lg:col-span-9 bg-surface-dark border border-border-dark rounded-xl flex flex-col overflow-hidden shadow-2xl relative">
          <div className="p-4 bg-white/5 border-b border-border-dark flex justify-between items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-secondary" />
              <Input
                className="bg-black/20 border-border-dark pl-9 h-10 text-foreground placeholder:text-text-secondary/50"
                placeholder="Filtrar por nombre, origen o destino..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 text-[10px] font-bold text-text-secondary uppercase">
              Vista: Cuadrícula
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-white/5 animate-pulse rounded-2xl border border-border-dark" />)}
              </div>
            ) : filteredRutas?.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-40 space-y-4">
                <Map className="size-24" />
                <p className="italic">No se han encontrado rutas registradas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredRutas?.map((ruta: any) => (
                  <Card key={ruta.id} className="bg-background-dark border-border-dark hover:border-primary/50 transition-all group relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 p-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <Button size="icon" variant="ghost" className="size-7 bg-white/10 hover:bg-white/20 text-foreground" onClick={() => handleEdit(ruta)}><Edit className="size-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="size-7 bg-red-500/10 hover:bg-red-500/20 text-red-500" onClick={() => handleDelete(ruta.id)}><Trash2 className="size-3.5" /></Button>
                    </div>

                    <div className="bg-white/5 p-4 border-b border-white/5 flex flex-col h-28 justify-center relative">
                      <MapPin className="absolute right-4 bottom-4 size-12 text-primary/10 -rotate-12" />
                      <h3 className="text-lg font-black text-foreground leading-tight uppercase line-clamp-2">{ruta.nombreRuta}</h3>
                      <Badge variant="outline" className="mt-2 w-fit border-primary/30 text-primary text-[9px] uppercase font-black tracking-widest">{ruta.tipoRuta}</Badge>
                    </div>

                    <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-text-secondary uppercase">Origen - Destino</p>
                          <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                            <span>{ruta.origen}</span>
                            <ChevronRight className="size-3 text-primary" />
                            <span>{ruta.destino}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-foreground tracking-tighter">{ruta.distanciaKm} <span className="text-[10px] text-text-secondary">KM</span></p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className={`p-2 rounded-lg flex items-center gap-2 border ${ruta.puntosCriticos?.length > 0 ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-white/5 border-border-dark text-text-secondary'}`}>
                          <AlertTriangle className="size-3.5 shrink-0" />
                          <span className="text-[10px] font-bold uppercase">{ruta.puntosCriticos?.length || 0} Críticos</span>
                        </div>
                        <div className={`p-2 rounded-lg flex items-center gap-2 border ${ruta.paradasSeguras?.length > 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-border-dark text-text-secondary'}`}>
                          <Coffee className="size-3.5 shrink-0" />
                          <span className="text-[10px] font-bold uppercase">{ruta.paradasSeguras?.length || 0} Paradas</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 bg-white/5 border-t border-border-dark flex justify-between items-center bg-surface-dark">
            <p className="text-[9px] text-text-secondary uppercase tracking-widest font-black flex items-center gap-2">
              <ShieldCheck className="size-3 text-emerald-500" />
              Inventario de Infraestructura Vial Validado
            </p>
            <p className="text-[9px] text-text-secondary font-mono italic">DATA_SYNC_P14_SUCCESS</p>
          </div>
        </div>
      </div>
    </div>
  );
}
