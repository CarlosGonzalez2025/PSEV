
'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, serverTimestamp } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  IdCard,
  Award,
  AlertTriangle
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
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const driverSchema = z.object({
  nombreCompleto: z.string().min(3, "Nombre requerido"),
  cedula: z.string().min(5, "Cédula inválida"),
  categoriaLicencia: z.string().min(2, "Categoría requerida"),
  fechaVencimientoLicencia: z.string(),
});

export default function ConductoresPage() {
  const firestore = useFirestore();
  const { profile } = useUser();
  const [open, setOpen] = useState(false);

  const conductoresRef = useMemoFirebase(() => {
    if (!firestore || !profile?.empresaId) return null;
    return query(
      collection(firestore, 'empresas', profile.empresaId, 'conductores')
    );
  }, [firestore, profile?.empresaId]);

  const { data: conductores, isLoading } = useCollection(conductoresRef);

  const form = useForm<z.infer<typeof driverSchema>>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      nombreCompleto: "",
      cedula: "",
      categoriaLicencia: "C2",
      fechaVencimientoLicencia: "",
    },
  });

  function onSubmit(values: z.infer<typeof driverSchema>) {
    if (!firestore || !profile?.empresaId) return;
    const colRef = collection(firestore, 'empresas', profile.empresaId, 'conductores');
    addDocumentNonBlocking(colRef, {
      ...values,
      empresaId: profile.empresaId,
      fechaRegistro: new Date().toISOString(),
      estado: "Activo",
      estadoLicencia: "Vigente",
      puntosGamificacion: 80,
      tipoContrato: "Directo",
      usuarioId: "temp-user-" + Date.now(),
      estadoExamenMedico: "Apto"
    });
    setOpen(false);
    form.reset();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase">Talento Humano Vial</h1>
          <p className="text-muted-foreground mt-1">Directorio de conductores y actores viales (Paso 10 del PESV)</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold shadow-lg shadow-primary/20 bg-primary">
              <Plus className="w-4 h-4 mr-2" />
              Registrar Conductor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-surface-dark border-border-dark text-white">
            <DialogHeader>
              <DialogTitle>Nuevo Conductor</DialogTitle>
              <DialogDescription className="text-text-secondary">
                Registre los datos personales y de licencia del nuevo conductor.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nombreCompleto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Juan Pérez" {...field} className="bg-background-dark border-border-dark" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cedula"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Documento de Identidad</FormLabel>
                      <FormControl>
                        <Input placeholder="1.098.XXX.XXX" {...field} className="bg-background-dark border-border-dark" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="categoriaLicencia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoría Licencia</FormLabel>
                        <FormControl>
                          <Input placeholder="C2" {...field} className="bg-background-dark border-border-dark" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fechaVencimientoLicencia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vencimiento Licencia</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="bg-background-dark border-border-dark" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full font-bold">Guardar Conductor</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Conductores Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">{conductores?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">En el sistema</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Licencias por Vencer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-500">0</div>
            <p className="text-xs text-muted-foreground mt-1">Próximos 30 días</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/5 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Cobertura Formación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-green-500">85%</div>
            <p className="text-xs text-muted-foreground mt-1">Meta: 90%</p>
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
                placeholder="Buscar por nombre, cédula o licencia..." 
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-border-dark text-white hover:bg-white/10">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border-dark overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/5 border-border-dark hover:bg-transparent">
                  <TableHead className="p-4 font-bold text-xs uppercase text-muted-foreground text-left">Nombre</TableHead>
                  <TableHead className="p-4 font-bold text-xs uppercase text-muted-foreground text-left">Identificación</TableHead>
                  <TableHead className="p-4 font-bold text-xs uppercase text-muted-foreground text-left">Licencia</TableHead>
                  <TableHead className="p-4 font-bold text-xs uppercase text-muted-foreground text-left">Desempeño</TableHead>
                  <TableHead className="p-4 font-bold text-xs uppercase text-muted-foreground text-left">Vigencia Lic.</TableHead>
                  <TableHead className="p-4 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-border-dark">
                      <TableCell><Skeleton className="h-4 w-32 bg-white/5" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24 bg-white/5" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12 bg-white/5" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24 bg-white/5" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-full bg-white/5" /></TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))
                ) : conductores?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">
                      No hay conductores registrados para esta empresa.
                    </TableCell>
                  </TableRow>
                ) : (
                  conductores?.map((c) => (
                    <TableRow key={c.id} className="hover:bg-white/5 transition-colors border-border-dark">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
                            {c.nombreCompleto?.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="font-bold text-sm text-white">{c.nombreCompleto}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">{c.cedula}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-bold text-white border-border-dark">{c.categoriaLicencia}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 w-32">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-primary">Score</span>
                            <span className="text-white">{c.puntosGamificacion || 0}/100</span>
                          </div>
                          <Progress value={c.puntosGamificacion || 0} className="h-1" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20 font-bold">Vigente</Badge>
                          <span className="text-[10px] text-muted-foreground">{c.fechaVencimientoLicencia}</span>
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
