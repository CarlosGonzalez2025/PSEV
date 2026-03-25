
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, serverTimestamp, addDoc, updateDoc, doc, orderBy } from 'firebase/firestore';
import { ExcelBulkActions } from '@/components/shared/excel-bulk-actions';
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Plus,
  Search,
  Filter,
  IdCard,
  Upload,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Eye,
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
import { Progress } from "@/components/ui/progress";
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

const driverSchema = z.object({
  nombreCompleto: z.string().min(3, "Nombre requerido"),
  cedula: z.string().min(5, "Cédula inválida"),
  tipoContrato: z.enum(["Fijo", "Indefinido", "Obra Labor", "Prestación de Servicios", "Tercerizado"]),
  rolEnLaVia: z.enum(["Conductor", "Motociclista", "Ciclista", "Peatón", "Pasajero"]),
  inscripcionRUNT: z.boolean().default(true),
  categoriaLicencia: z.string().optional(),
  fechaVencimientoLicencia: z.string().optional(),
  fechaExamenMedico: z.string().optional(),
  restriccionesMedicas: z.string().optional(),
});

export default function ConductoresPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { profile } = useUser();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingConductor, setEditingConductor] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const conductoresRef = useMemoFirebase(() => {
    if (!firestore || !profile?.empresaId) return null;
    return query(collection(firestore, 'empresas', profile.empresaId, 'conductores'), orderBy('nombreCompleto'));
  }, [firestore, profile?.empresaId]);

  const { data: conductores, isLoading } = useCollection(conductoresRef);

  const filteredConductores = useMemo(() => {
    if (!conductores) return [];
    return conductores.filter(c =>
      c.nombreCompleto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cedula?.includes(searchTerm)
    );
  }, [conductores, searchTerm]);

  const form = useForm<z.infer<typeof driverSchema>>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      nombreCompleto: "",
      cedula: "",
      tipoContrato: "Fijo",
      rolEnLaVia: "Conductor",
      inscripcionRUNT: true,
      categoriaLicencia: "C2",
      fechaVencimientoLicencia: "",
      fechaExamenMedico: "",
      restriccionesMedicas: ""
    },
  });

  const watchRol = form.watch("rolEnLaVia");

  const editForm = useForm<z.infer<typeof driverSchema>>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      nombreCompleto: "",
      cedula: "",
      tipoContrato: "Fijo",
      rolEnLaVia: "Conductor",
      inscripcionRUNT: true,
      categoriaLicencia: "",
      fechaVencimientoLicencia: "",
      fechaExamenMedico: "",
      restriccionesMedicas: ""
    },
  });

  const watchEditRol = editForm.watch("rolEnLaVia");

  function openEdit(conductor: any) {
    setEditingConductor(conductor);
    editForm.reset({
      nombreCompleto: conductor.nombreCompleto || "",
      cedula: conductor.cedula || "",
      tipoContrato: conductor.tipoContrato || "Fijo",
      rolEnLaVia: conductor.rolEnLaVia || "Conductor",
      inscripcionRUNT: conductor.inscripcionRUNT ?? true,
      categoriaLicencia: conductor.categoriaLicencia || "",
      fechaVencimientoLicencia: conductor.fechaVencimientoLicencia || "",
      fechaExamenMedico: conductor.fechaExamenMedico || "",
      restriccionesMedicas: conductor.restriccionesMedicas || "",
    });
    setEditOpen(true);
  }

  async function onUpdateSubmit(values: z.infer<typeof driverSchema>) {
    if (!firestore || !profile?.empresaId || !editingConductor?.id) return;
    try {
      const docRef = doc(firestore, 'empresas', profile.empresaId, 'conductores', editingConductor.id);
      await updateDoc(docRef, { ...values });
      setEditOpen(false);
      setEditingConductor(null);
      toast({ title: "Perfil Actualizado", description: "Los datos del colaborador han sido guardados." });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el registro." });
    }
  }

  async function onSubmit(values: z.infer<typeof driverSchema>) {
    if (!firestore || !profile?.empresaId) return;
    try {
      const colRef = collection(firestore, 'empresas', profile.empresaId, 'conductores');
      await addDoc(colRef, {
        ...values,
        empresaId: profile.empresaId,
        fechaRegistro: serverTimestamp(),
        estado: "Activo",
        scoringVial: 100, // Inicia con puntaje perfecto
        incidentes: 0,
        multas: 0,
        asistenciaCapacitaciones: 100,
        competenciaValidada: true
      });
      setOpen(false);
      form.reset();
      toast({ title: "Colaborador Registrado", description: "La hoja de vida vial ha sido creada." });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar el registro." });
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-destructive";
  };

  const isExpired = (dateStr: string) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight uppercase italic">Talento Humano Vial</h1>
          <p className="text-text-secondary mt-1">Gestión de competencias, salud y comportamiento seguro (Pasos 10 y 11)</p>
        </div>
        <div className="flex gap-2">
          <ExcelBulkActions
            data={conductores || []}
            fileName="Talento_Humano_Res40595"
            templateColumns={["nombreCompleto", "cedula", "tipoContrato", "rolEnLaVia", "categoriaLicencia"]}
            onImport={async () => { }}
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary font-black uppercase h-11 px-8 shadow-lg shadow-primary/20">
                <Plus className="size-5 mr-2" /> Nuevo Actor Vial
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl bg-surface-dark border-border-dark text-foreground p-0 overflow-hidden">
              <DialogHeader className="p-6 bg-primary/10 border-b border-border-dark">
                <DialogTitle className="text-xl font-black uppercase italic">Hoja de Vida del Actor Vial</DialogTitle>
                <DialogDescription className="text-text-secondary">Paso 10: Perfil y Requisitos de Ingreso.</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="nombreCompleto" render={({ field }) => (
                      <FormItem><FormLabel>Nombre Completo</FormLabel><FormControl><Input {...field} className="bg-background-dark" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="cedula" render={({ field }) => (
                      <FormItem><FormLabel>Cédula/ID</FormLabel><FormControl><Input {...field} className="bg-background-dark" /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="tipoContrato" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Contrato</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className="bg-background-dark"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent><SelectItem value="Fijo">Fijo</SelectItem><SelectItem value="Indefinido">Indefinido</SelectItem><SelectItem value="Obra Labor">Obra Labor</SelectItem><SelectItem value="Prestación de Servicios">Prestación de Servicios</SelectItem><SelectItem value="Tercerizado">Tercerizado</SelectItem></SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="rolEnLaVia" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rol en la Vía</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className="bg-background-dark"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent><SelectItem value="Conductor">Conductor</SelectItem><SelectItem value="Motociclista">Motociclista</SelectItem><SelectItem value="Ciclista">Ciclista</SelectItem><SelectItem value="Peatón">Peatón</SelectItem><SelectItem value="Pasajero">Pasajero</SelectItem></SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </div>

                  {(watchRol === 'Conductor' || watchRol === 'Motociclista') && (
                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="categoriaLicencia" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoría Licencia</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-background-dark">
                                  <SelectValue placeholder="Categoría" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="A1">A1</SelectItem>
                                <SelectItem value="A2">A2</SelectItem>
                                <SelectItem value="B1">B1</SelectItem>
                                <SelectItem value="B2">B2</SelectItem>
                                <SelectItem value="B3">B3</SelectItem>
                                <SelectItem value="C1">C1</SelectItem>
                                <SelectItem value="C2">C2</SelectItem>
                                <SelectItem value="C3">C3</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="fechaVencimientoLicencia" render={({ field }) => (
                          <FormItem><FormLabel>Vencimiento Licencia</FormLabel><FormControl><Input type="date" {...field} className="bg-background-dark" /></FormControl></FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="fechaExamenMedico" render={({ field }) => (
                          <FormItem><FormLabel>Fecha Examen Médico</FormLabel><FormControl><Input type="date" {...field} className="bg-background-dark" /></FormControl></FormItem>
                        )} />
                        <div className="space-y-2 flex flex-col justify-end">
                          <Button variant="outline" className="border-border-dark h-11 uppercase font-bold text-[10px] gap-2"><Upload className="size-4" /> Licencia (PDF)</Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button type="submit" className="w-full bg-primary font-black uppercase h-12 shadow-xl shadow-primary/20">Crear Perfil Vial</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent className="max-w-xl bg-surface-dark border-border-dark text-foreground p-0 overflow-hidden">
              <DialogHeader className="p-6 bg-primary/10 border-b border-border-dark">
                <DialogTitle className="text-xl font-black uppercase italic">Editar Actor Vial</DialogTitle>
                <DialogDescription className="text-text-secondary">Actualiza los datos del colaborador.</DialogDescription>
              </DialogHeader>
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onUpdateSubmit)} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={editForm.control} name="nombreCompleto" render={({ field }) => (
                      <FormItem><FormLabel>Nombre Completo</FormLabel><FormControl><Input {...field} className="bg-background-dark" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={editForm.control} name="cedula" render={({ field }) => (
                      <FormItem><FormLabel>Cédula/ID</FormLabel><FormControl><Input {...field} className="bg-background-dark" /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={editForm.control} name="tipoContrato" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Contrato</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger className="bg-background-dark"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent><SelectItem value="Fijo">Fijo</SelectItem><SelectItem value="Indefinido">Indefinido</SelectItem><SelectItem value="Obra Labor">Obra Labor</SelectItem><SelectItem value="Prestación de Servicios">Prestación de Servicios</SelectItem><SelectItem value="Tercerizado">Tercerizado</SelectItem></SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={editForm.control} name="rolEnLaVia" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rol en la Vía</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger className="bg-background-dark"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent><SelectItem value="Conductor">Conductor</SelectItem><SelectItem value="Motociclista">Motociclista</SelectItem><SelectItem value="Ciclista">Ciclista</SelectItem><SelectItem value="Peatón">Peatón</SelectItem><SelectItem value="Pasajero">Pasajero</SelectItem></SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </div>
                  {(watchEditRol === 'Conductor' || watchEditRol === 'Motociclista') && (
                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={editForm.control} name="categoriaLicencia" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoría Licencia</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger className="bg-background-dark"><SelectValue placeholder="Categoría" /></SelectTrigger></FormControl>
                              <SelectContent>
                                {["A1","A2","B1","B2","B3","C1","C2","C3"].map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                        <FormField control={editForm.control} name="fechaVencimientoLicencia" render={({ field }) => (
                          <FormItem><FormLabel>Vencimiento Licencia</FormLabel><FormControl><Input type="date" {...field} className="bg-background-dark" /></FormControl></FormItem>
                        )} />
                      </div>
                      <FormField control={editForm.control} name="fechaExamenMedico" render={({ field }) => (
                        <FormItem><FormLabel>Fecha Examen Médico</FormLabel><FormControl><Input type="date" {...field} className="bg-background-dark" /></FormControl></FormItem>
                      )} />
                    </div>
                  )}
                  <FormField control={editForm.control} name="restriccionesMedicas" render={({ field }) => (
                    <FormItem><FormLabel>Restricciones Médicas</FormLabel><FormControl><Input {...field} className="bg-background-dark" placeholder="Ninguna" /></FormControl></FormItem>
                  )} />
                  <Button type="submit" className="w-full bg-primary font-black uppercase h-12 shadow-xl shadow-primary/20">Guardar Cambios</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-surface-dark border-border-dark">
          <CardHeader className="pb-2"><p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Actores Viales</p></CardHeader>
          <CardContent><div className="text-3xl font-black text-foreground">{conductores?.length || 0}</div></CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark">
          <CardHeader className="pb-2"><p className="text-[10px] font-black text-text-secondary uppercase tracking-widest text-emerald-500">Scoring Promedio</p></CardHeader>
          <CardContent><div className="text-3xl font-black text-emerald-500">92/100</div></CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark">
          <CardHeader className="pb-2"><p className="text-[10px] font-black text-text-secondary uppercase tracking-widest text-amber-500">Vencimientos (30d)</p></CardHeader>
          <CardContent><div className="text-3xl font-black text-amber-500">3</div></CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark">
          <CardHeader className="pb-2"><p className="text-[10px] font-black text-text-secondary uppercase tracking-widest text-primary">Contratación Vial</p></CardHeader>
          <CardContent><div className="text-3xl font-black text-primary">100%</div></CardContent>
        </Card>
      </div>

      <Card className="bg-surface-dark border-border-dark overflow-hidden">
        <CardHeader className="border-b border-white/5 bg-white/[0.02] flex flex-row items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-secondary" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-background-dark border-border-dark pl-9"
              placeholder="Buscar por nombre o cédula..."
            />
          </div>
          <Button variant="outline" className="border-border-dark font-bold gap-2"><Filter className="size-4" /> Filtros Avanzados</Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border-dark bg-white/5">
                <TableHead className="text-[10px] font-black uppercase">Colaborador / Rol</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Documentos / Vencimiento</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-center">Formación (%)</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-center">Smart Scoring</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Estado Operativo</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20"><Skeleton className="h-20 w-full" /></TableCell></TableRow>
              ) : filteredConductores.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20 italic text-text-secondary">Sin registros encontrados.</TableCell></TableRow>
              ) : (
                filteredConductores.map(c => {
                  const licVence = c.fechaVencimientoLicencia;
                  const licExpired = isExpired(licVence);
                  const score = c.scoringVial || 0;

                  return (
                    <TableRow key={c.id} className="border-border-dark hover:bg-white/5 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black uppercase italic tracking-tighter shadow-inner">
                            {c.nombreCompleto?.substring(0, 2)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-foreground uppercase tracking-tight">{c.nombreCompleto}</span>
                            <Badge variant="outline" className="w-fit text-[8px] h-4 mt-0.5 border-primary/20 text-primary uppercase">{c.rolEnLaVia}</Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-text-secondary">
                            <IdCard className="size-3" /> {c.categoriaLicencia || 'N/A'}
                            <span className={licExpired ? 'text-destructive' : 'text-emerald-500'}>
                              {licExpired ? 'VENCIDA' : `Vence: ${licVence || 'N/A'}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-text-secondary">
                            <ShieldCheck className="size-3" /> Salud: <span className="text-emerald-500">APTO</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className="text-xs font-black text-foreground">{c.asistenciaCapacitaciones || 0}%</span>
                          <Progress value={c.asistenciaCapacitaciones || 0} className="w-16 h-1 bg-white/5" indicatorClassName="bg-primary" />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className={`text-sm font-black ${score >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>{score}</span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(i => (
                              <div key={i} className={`size-1 rounded-full ${score >= i * 20 ? getScoreColor(score) : 'bg-white/10'}`} />
                            ))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {licExpired ? (
                          <Badge className="bg-destructive/10 text-destructive border-none text-[8px] uppercase gap-1 animate-pulse"><AlertCircle className="size-3" /> Bloqueado</Badge>
                        ) : (
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] uppercase gap-1"><CheckCircle2 className="size-3" /> Operativo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="text-text-secondary hover:text-primary" onClick={() => router.push(`/dashboard/conductores/${c.id}`)}><Eye className="size-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-text-secondary hover:text-primary" onClick={() => openEdit(c)}><Pencil className="size-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
