
'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Plus,
  Search,
  AlertTriangle,
  Activity,
  Edit,
  Trash2,
  CheckCircle,
  ShieldCheck,
  Zap,
  Navigation,
  Info,
  Save,
  ChevronRight
} from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, serverTimestamp, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";

// --- Esquemas de Validación ---

const riskSchema = z.object({
  rolActorVial: z.enum(["Conductor", "Peatón", "Pasajero", "Ciclista", "Motociclista"]),
  factorSeguridadVial: z.enum(["Factor Humano", "Factor Vehículo", "Factor Vía y Entorno"]),
  tipoDesplazamiento: z.enum(["Laboral (Misión)", "In Itinere (Casa-Trabajo)", "Vías Internas"]),
  areaId: z.string().min(1, "Área requerida"),
  actividadTarea: z.string().min(3, "Actividad requerida"),
  esRutinaria: z.enum(["Sí", "No"]),
  descripcionPeligro: z.string().min(3, "Descripción requerida"),
  efectosPosibles: z.string().min(3, "Efectos requeridos"),

  // Controles Existentes
  controlFuente: z.string().optional(),
  controlMedio: z.string().optional(),
  controlIndividuo: z.string().optional(),

  // Evaluación 3x3
  nivelExposicion: z.coerce.number().min(1).max(3),
  nivelProbabilidad: z.coerce.number().min(1).max(3),

  // Tratamiento
  accionFrenteAlRiesgo: z.enum(["Evitarlo", "Aceptarlo", "Eliminar la fuente", "Modificar factores"]),
  medidaIngenieria: z.string().optional(),
  medidaAdministrativa: z.string().optional(),
  eppRequerido: z.string().optional(),
  programaId: z.string().optional()
});

const NE_LABELS: Record<number, string> = {
  3: "Frecuente (>6h/día)",
  2: "Ocasional (3-6h/día)",
  1: "Esporádica (<3h/día)"
};

const NP_LABELS: Record<number, string> = {
  3: "Muy Probable (Sin controles)",
  2: "Poco Probable (Eficacia baja)",
  1: "No Probable (Controles eficaces)"
};

export default function RiesgosPage() {
  const { profile } = useUser();
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const riesgosRef = useMemoFirebase(() => {
    if (!firestore || !profile?.empresaId) return null;
    return query(collection(firestore, 'empresas', profile.empresaId, 'riesgosViales'));
  }, [firestore, profile?.empresaId]);

  const { data: riesgos, isLoading } = useCollection(riesgosRef);

  const form = useForm<z.infer<typeof riskSchema>>({
    resolver: zodResolver(riskSchema),
    defaultValues: {
      rolActorVial: "Conductor",
      factorSeguridadVial: "Factor Humano",
      tipoDesplazamiento: "Laboral (Misión)",
      areaId: "Operaciones",
      esRutinaria: "Sí",
      nivelExposicion: 2,
      nivelProbabilidad: 2,
      accionFrenteAlRiesgo: "Modificar factores"
    }
  });

  // Cálculo de Matriz
  const watchNE = form.watch("nivelExposicion");
  const watchNP = form.watch("nivelProbabilidad");
  const riskValue = watchNE * watchNP;

  const getRiskLevel = (value: number) => {
    if (value >= 6) return { label: "I: CRÍTICO", color: "bg-red-600", text: "text-red-600" };
    if (value >= 3) return { label: "II: MODERADO", color: "bg-yellow-500", text: "text-yellow-500" };
    return { label: "III: BAJO", color: "bg-emerald-500", text: "text-emerald-500" };
  };

  const currentLevel = getRiskLevel(riskValue);

  const onSubmit = async (values: z.infer<typeof riskSchema>) => {
    if (!profile?.empresaId || !firestore) return;

    try {
      const payload = {
        ...values,
        valorNR: values.nivelExposicion * values.nivelProbabilidad,
        calificacionNR: getRiskLevel(values.nivelExposicion * values.nivelProbabilidad).label,
        fechaRegistro: serverTimestamp(),
        creadoPor: profile.email,
        empresaId: profile.empresaId
      };

      if (selectedRiskId) {
        await updateDoc(doc(firestore, 'empresas', profile.empresaId, 'riesgosViales', selectedRiskId), payload);
        toast({ title: "Riesgo Actualizado", description: "Se han guardado los cambios en la matriz." });
      } else {
        await addDoc(collection(firestore, 'empresas', profile.empresaId, 'riesgosViales'), payload);
        toast({ title: "Riesgo Creado", description: "Nuevo peligro identificado y valorado." });
      }
      setIsDialogOpen(false);
      form.reset();
      setSelectedRiskId(null);
    } catch (error) {
      toast({ title: "Error", description: "No se pudo guardar el riesgo.", variant: "destructive" });
    }
  };

  const handleEdit = (risk: any) => {
    setSelectedRiskId(risk.id);
    form.reset(risk);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta valoración de riesgo?") || !profile?.empresaId || !firestore) return;
    await deleteDoc(doc(firestore, 'empresas', profile.empresaId, 'riesgosViales', id));
    toast({ title: "Riesgo Eliminado" });
  };

  const filteredRiesgos = useMemo(() => {
    if (!riesgos) return [];
    return riesgos.filter(r =>
      r.actividadTarea?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.descripcionPeligro?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [riesgos, searchTerm]);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Matriz de Riesgos Viales</h1>
          <p className="text-text-secondary mt-1">Identificación y valoración (Resolución 40595 - Paso 6)</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) { setSelectedRiskId(null); form.reset(); }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary font-black uppercase h-12 px-8 shadow-lg shadow-primary/20">
              <Plus className="w-5 h-5 mr-2" /> Identificar Peligro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl bg-surface-dark border-border-dark text-foreground max-h-[90vh] overflow-y-auto custom-scrollbar">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase text-foreground">
                {selectedRiskId ? "Editar Valoración de Riesgo" : "Nueva Identificación de Riesgo"}
              </DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-4">
                <Tabs defaultValue="contexto" className="w-full">
                  <TabsList className="bg-white/5 border border-border-dark w-full justify-start overflow-x-auto h-auto p-1 gap-1">
                    <TabsTrigger value="contexto" className="data-[state=active]:bg-primary font-bold py-2 gap-2"><Navigation className="size-4" /> Contexto</TabsTrigger>
                    <TabsTrigger value="controles" className="data-[state=active]:bg-primary font-bold py-2 gap-2"><ShieldCheck className="size-4" /> Controles Act.</TabsTrigger>
                    <TabsTrigger value="calculo" className="data-[state=active]:bg-primary font-bold py-2 gap-2"><Zap className="size-4" /> Matriz 3x3</TabsTrigger>
                    <TabsTrigger value="intervencion" className="data-[state=active]:bg-primary font-bold py-2 gap-2"><Activity className="size-4" /> Intervención</TabsTrigger>
                  </TabsList>

                  <div className="mt-6">
                    <TabsContent value="contexto" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="rolActorVial" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase text-text-secondary">Rol Vial Expuesto</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger className="bg-background-dark border-border-dark"><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                {["Conductor", "Peatón", "Pasajero", "Ciclista", "Motociclista"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="factorSeguridadVial" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase text-text-secondary">Factor de Seguridad</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger className="bg-background-dark border-border-dark"><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                {["Factor Humano", "Factor Vehículo", "Factor Vía y Entorno"].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="tipoDesplazamiento" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase text-text-secondary">Tipo Desplazamiento</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger className="bg-background-dark border-border-dark"><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="Laboral (Misión)">Laboral (Misión)</SelectItem>
                                <SelectItem value="In Itinere (Casa-Trabajo)">In Itinere</SelectItem>
                                <SelectItem value="Vías Internas">Vías Internas/Parqueaderos</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="areaId" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase text-text-secondary">Proceso / Área</FormLabel>
                            <FormControl><Input {...field} className="bg-background-dark border-border-dark" placeholder="Ej: Logística" /></FormControl>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="esRutinaria" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase text-text-secondary">¿Es Rutinaria?</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger className="bg-background-dark border-border-dark"><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent><SelectItem value="Sí">Sí</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="actividadTarea" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase text-text-secondary">Tarea Específica</FormLabel>
                          <FormControl><Input {...field} className="bg-background-dark border-border-dark" placeholder="Ej: Entrega de pedidos en zona urbana" /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="descripcionPeligro" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase text-text-secondary">Descripción del Peligro</FormLabel>
                          <FormControl><Textarea {...field} className="bg-background-dark border-border-dark" placeholder="Ej: Vías con baches y huecos en el sector industrial" /></FormControl>
                        </FormItem>
                      )} />
                    </TabsContent>

                    <TabsContent value="controles" className="space-y-4">
                      <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-3 mb-4">
                        <Info className="size-5 text-blue-400 mt-0.5" />
                        <p className="text-xs text-blue-900/80 dark:text-blue-100/70">Registre los controles que la empresa <span className="font-bold text-foreground dark:text-foreground uppercase italic">YA tiene implementados</span> antes de esta valoración.</p>
                      </div>
                      <FormField control={form.control} name="controlFuente" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase text-text-secondary">Control en la Fuente</FormLabel>
                          <FormControl><Input {...field} className="bg-background-dark border-border-dark" placeholder="Ej: Mantenimiento preventivo" /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="controlMedio" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase text-text-secondary">Control en el Medio</FormLabel>
                          <FormControl><Input {...field} className="bg-background-dark border-border-dark" placeholder="Ej: Señalética en ruta" /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="controlIndividuo" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase text-text-secondary">Control en el Individuo</FormLabel>
                          <FormControl><Input {...field} className="bg-background-dark border-border-dark" placeholder="Ej: Kit de carretera, capacitación" /></FormControl>
                        </FormItem>
                      )} />
                    </TabsContent>

                    <TabsContent value="calculo" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <FormField control={form.control} name="nivelExposicion" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-bold uppercase text-text-secondary">Nivel de Exposición (NE)</FormLabel>
                              <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={String(field.value)}>
                                <FormControl><SelectTrigger className="bg-background-dark border-border-dark py-6"><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                  {Object.entries(NE_LABELS).map(([val, label]) => <SelectItem key={val} value={val}>{label}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="nivelProbabilidad" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-bold uppercase text-text-secondary">Nivel de Probabilidad (NP)</FormLabel>
                              <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={String(field.value)}>
                                <FormControl><SelectTrigger className="bg-background-dark border-border-dark py-6"><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                  {Object.entries(NP_LABELS).map(([val, label]) => <SelectItem key={val} value={val}>{label}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )} />
                        </div>

                        <div className="bg-black/20 rounded-3xl p-8 flex flex-col items-center justify-center border border-white/5 space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Resultado Nivel Riesgo</p>
                          <div className={`text-6xl font-black ${currentLevel.text}`}>{riskValue}</div>
                          <Badge className={`${currentLevel.color} h-8 px-4 text-xs font-black uppercase tracking-widest border-none`}>
                            {currentLevel.label}
                          </Badge>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="intervencion" className="space-y-4">
                      <FormField control={form.control} name="accionFrenteAlRiesgo" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase text-text-secondary">Acción Sugerida</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="bg-background-dark border-border-dark"><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              {["Evitarlo", "Aceptarlo", "Eliminar la fuente", "Modificar factores"].map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="programaId" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase text-text-secondary">{riskValue >= 6 ? "Programa Asociado (OBLIGATORIO)" : "Programa Asociado"}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className={`bg-background-dark border-border-dark ${riskValue >= 6 && !field.value ? 'border-red-500' : ''}`}><SelectValue placeholder="Vincular a programa..." /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="velocidad">Gestión de Velocidad</SelectItem>
                              <SelectItem value="fatiga">Prevención de Fatiga</SelectItem>
                              <SelectItem value="distraccion">Prevención de Distracción</SelectItem>
                              <SelectItem value="vulnerables">Actores Vulnerables</SelectItem>
                              <SelectItem value="mantenimiento">Mantenimiento Preventivo</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="medidaAdministrativa" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase text-text-secondary">Medida Administrativa</FormLabel>
                          <FormControl><Input {...field} className="bg-background-dark border-border-dark" placeholder="Ej: Ajuste de horarios" /></FormControl>
                        </FormItem>
                      )} />
                    </TabsContent>
                  </div>
                </Tabs>

                <DialogFooter className="pt-4 border-t border-border-dark">
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 font-black uppercase gap-2 h-12 px-10">
                    <Save className="size-5" /> {selectedRiskId ? "Actualizar" : "Guardar"} Matriz
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-220px)] overflow-hidden">
        {/* HEATMAP / SUMMARY */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card className="bg-surface-dark border-border-dark h-full flex flex-col overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-border-dark p-4">
              <CardTitle className="text-sm font-black uppercase text-foreground tracking-widest">Resumen Crítico</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex-1 space-y-4">
              <div className="relative aspect-square border-l border-b border-white/10 p-2">
                <div className="absolute -left-8 top-1/2 -rotate-90 text-[8px] font-bold text-text-secondary">PROBABILIDAD</div>
                <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-[8px] font-bold text-text-secondary">EXPOSICIÓN</div>

                <div className="grid grid-cols-3 grid-rows-3 gap-1 h-full w-full">
                  {[3, 2, 1].map(p => (
                    [1, 2, 3].map(e => {
                      const score = p * e;
                      const lvl = getRiskLevel(score);
                      const count = riesgos?.filter(r => r.nivelExposicion === e && r.nivelProbabilidad === p).length || 0;
                      return (
                        <div key={`${p}-${e}`} className={`rounded flex flex-col items-center justify-center transition-all ${lvl.color} ${count > 0 ? 'opacity-100 scale-100 shadow-lg' : 'opacity-10 scale-95'}`}>
                          <span className="text-xl font-black text-foreground">{count}</span>
                          <span className="text-[8px] font-black text-foreground/50">{score}pts</span>
                        </div>
                      )
                    })
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-border-dark">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-red-500 uppercase">I: Críticos</span>
                  <span className="text-sm font-black text-foreground">{riesgos?.filter(r => r.valorNR >= 6).length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-yellow-500 uppercase">II: Moderados</span>
                  <span className="text-sm font-black text-foreground">{riesgos?.filter(r => r.valorNR >= 3 && r.valorNR < 6).length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase">III: Bajos</span>
                  <span className="text-sm font-black text-foreground">{riesgos?.filter(r => r.valorNR < 3).length || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* LIST TABLE */}
        <div className="lg:col-span-3 bg-surface-dark border border-border-dark rounded-xl flex flex-col overflow-hidden shadow-2xl">
          <div className="p-4 bg-white/5 border-b border-border-dark flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-secondary" />
              <Input
                className="bg-black/20 border-border-dark pl-9 h-10 text-foreground placeholder:text-text-secondary/50"
                placeholder="Buscar por descripción o tarea..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="border-border-dark h-8 text-[10px] font-bold uppercase">{profile?.empresaId || 'ID'}</Badge>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="p-10 text-center animate-pulse text-text-secondary">Cargando matriz...</div>
            ) : filteredRiesgos.length === 0 ? (
              <div className="p-20 text-center space-y-4">
                <AlertTriangle className="size-16 text-yellow-500 mx-auto opacity-20" />
                <div className="text-text-secondary italic">No se han encontrado riesgos con los criterios de búsqueda.</div>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-surface-dark shadow-sm z-10">
                  <tr className="border-b border-border-dark">
                    <th className="p-4 text-[10px] font-black text-text-secondary uppercase">Actor Vial</th>
                    <th className="p-4 text-[10px] font-black text-text-secondary uppercase">Tarea / Peligro</th>
                    <th className="p-4 text-[10px] font-black text-text-secondary uppercase text-center">NE x NP</th>
                    <th className="p-4 text-[10px] font-black text-text-secondary uppercase">Calificación</th>
                    <th className="p-4 text-[10px] font-black text-text-secondary uppercase text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRiesgos.map((r: any) => {
                    const lvl = getRiskLevel(r.valorNR);
                    return (
                      <tr key={r.id} className="border-b border-border-dark group hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-foreground">{r.rolActorVial}</span>
                            <span className="text-[9px] text-text-secondary uppercase">{r.tipoDesplazamiento}</span>
                          </div>
                        </td>
                        <td className="p-4 max-w-xs">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-primary truncate uppercase tracking-tight">{r.actividadTarea}</span>
                            <span className="text-[10px] text-text-secondary line-clamp-1">{r.descripcionPeligro}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-xs font-black text-foreground">{r.nivelExposicion} x {r.nivelProbabilidad} = {r.valorNR}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className={`size-2 rounded-full ${lvl.color}`}></div>
                            <span className={`text-[10px] font-black uppercase ${lvl.text}`}>{lvl.label}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="size-8 text-foreground hover:bg-white/10" onClick={() => handleEdit(r)}><Edit className="size-4" /></Button>
                            <Button size="icon" variant="ghost" className="size-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(r.id)}><Trash2 className="size-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="p-3 bg-white/5 border-t border-border-dark flex justify-between items-center">
            <p className="text-[9px] text-text-secondary uppercase tracking-widest font-bold">Base de Datos Normativa PESV 2022</p>
            <p className="text-[9px] text-text-secondary font-mono italic">ROADWISE_ENGINE_V1.2</p>
          </div>
        </div>
      </div>
    </div>
  );
}
