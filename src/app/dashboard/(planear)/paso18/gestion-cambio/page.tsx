'use client';

import React, { useState } from 'react';
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase 
} from '@/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
    Plus, 
    Search, 
    AlertTriangle, 
    CheckCircle2, 
    Clock, 
    FileText, 
    ArrowRight,
    MapPin,
    AlertCircle,
    History
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createGestionCambio } from '@/actions/contratistas';

export default function GestionCambioPage() {
  const { profile } = useUser();
  const firestore = useFirestore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCambio, setNewCambio] = useState({
    tipoCambio: 'Infraestructura' as 'Infraestructura' | 'Nueva Ruta' | 'Proceso Operativo' | 'Legal/Normativo',
    descripcion: '',
    impactoRiesgo: 'Bajo' as 'Bajo' | 'Medio' | 'Alto',
    fechaImplementacion: new Date().toISOString().split('T')[0]
  });

  const cambiosRef = useMemoFirebase(() => {
    if (!firestore || !profile?.empresaId) return null;
    return query(
      collection(firestore, 'gestionCambiosViales'), 
      where('empresaId', '==', profile.empresaId),
      orderBy('creadoEn', 'desc')
    );
  }, [firestore, profile?.empresaId]);

  const { data: cambios, isLoading } = useCollection(cambiosRef);

  const handleCreate = async () => {
    if (!profile?.empresaId) return;
    const res = await createGestionCambio({ 
        ...newCambio, 
        empresaId: profile.empresaId,
        impactoRiesgo: newCambio.impactoRiesgo as any,
        tipoCambio: newCambio.tipoCambio as any
    });
    if (res.success) {
      toast({ title: "Cambio registrado", description: "Se ha notificado al área de Riesgos (Paso 6)." });
      setIsCreateOpen(false);
      setNewCambio({
        tipoCambio: 'Infraestructura',
        descripcion: '',
        impactoRiesgo: 'Bajo',
        fechaImplementacion: new Date().toISOString().split('T')[0]
      });
    } else {
      toast({ title: "Error", description: res.error, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Gestión del Cambio Vial</h1>
          <p className="text-text-secondary mt-1">Identificación y control de riesgos ante cambios en la operación</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
           <DialogTrigger asChild>
             <Button className="bg-amber-600 hover:bg-amber-500 font-black uppercase h-12 px-8 text-white shadow-lg">
               <Plus className="w-5 h-5 mr-2" /> Registrar Cambio
             </Button>
           </DialogTrigger>
           <DialogContent className="bg-surface-dark border-border-dark text-foreground">
             <DialogHeader>
               <DialogTitle className="flex items-center gap-2 italic uppercase font-black"><AlertTriangle className="text-amber-500"/> Notificar Cambio Operativo</DialogTitle>
               <DialogDescription>El registro generará automáticamente una alerta en la Matriz de Riesgos (Paso 6).</DialogDescription>
             </DialogHeader>
             <div className="grid gap-4 py-4 text-foreground">
               <div className="grid gap-2">
                 <Label>Tipo de Cambio</Label>
                 <Select value={newCambio.tipoCambio} onValueChange={(val: any) => setNewCambio({...newCambio, tipoCambio: val})}>
                    <SelectTrigger className="bg-background-dark border-border-dark"><SelectValue/></SelectTrigger>
                    <SelectContent className="bg-surface-dark border-border-dark text-foreground">
                        <SelectItem value="Infraestructura">Infraestructura (Vías, Sedes)</SelectItem>
                        <SelectItem value="Nueva Ruta">Nueva Ruta / Trayecto</SelectItem>
                        <SelectItem value="Proceso Operativo">Cambio en Proceso Operativo</SelectItem>
                        <SelectItem value="Legal/Normativo">Cambio Legal o Normativo</SelectItem>
                    </SelectContent>
                 </Select>
               </div>
               <div className="grid gap-2">
                 <Label>Descripción del Cambio / Novedad</Label>
                 <Textarea value={newCambio.descripcion} onChange={e => setNewCambio({...newCambio, descripcion: e.target.value})} className="bg-background-dark border-border-dark h-24" placeholder="Ej: Nueva variante en la ruta Bogotá-Cali..." />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2">
                    <Label>Impacto en Riesgos</Label>
                    <Select value={newCambio.impactoRiesgo} onValueChange={(val: any) => setNewCambio({...newCambio, impactoRiesgo: val})}>
                        <SelectTrigger className="bg-background-dark border-border-dark"><SelectValue/></SelectTrigger>
                        <SelectContent className="bg-surface-dark border-border-dark text-foreground">
                            <SelectItem value="Bajo">Impacto Bajo</SelectItem>
                            <SelectItem value="Medio">Impacto Medio</SelectItem>
                            <SelectItem value="Alto">Impacto Alto</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                 <div className="grid gap-2">
                    <Label>Fecha de Implementación</Label>
                    <Input type="date" value={newCambio.fechaImplementacion} onChange={e => setNewCambio({...newCambio, fechaImplementacion: e.target.value})} className="bg-background-dark border-border-dark" />
                 </div>
               </div>
             </div>
             <DialogFooter>
                <Button onClick={handleCreate} className="bg-primary w-full uppercase font-bold text-white">Notificar e Integrar</Button>
             </DialogFooter>
           </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-surface-dark border-border-dark col-span-2">
          <CardHeader className="bg-white/5 border-b border-border-dark">
            <CardTitle className="text-sm font-bold uppercase flex items-center gap-2"><History className="w-4 h-4 text-primary"/> Historial de Cambios Viales</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             <Table>
                <TableHeader>
                    <TableRow className="border-border-dark hover:bg-transparent">
                        <TableHead className="text-[10px] font-bold uppercase">Fecha</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Tipo</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Descripción</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Riesgo</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Estado</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                         <TableRow><TableCell colSpan={5} className="text-center py-10 opacity-50">Cargando...</TableCell></TableRow>
                    ) : cambios?.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-10 opacity-50 italic">No se han registrado cambios.</TableCell></TableRow>
                    ) : cambios?.map((c) => (
                        <TableRow key={c.id} className="border-border-dark hover:bg-white/5 transition-colors">
                            <TableCell className="text-text-secondary text-xs">{new Date(c.fechaImplementacion).toLocaleDateString()}</TableCell>
                            <TableCell className="text-foreground text-xs font-bold">{c.tipoCambio}</TableCell>
                            <TableCell className="text-text-secondary text-xs max-w-xs truncate">{c.descripcion}</TableCell>
                            <TableCell>
                                <Badge className={
                                    c.impactoRiesgo === 'Alto' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                    c.impactoRiesgo === 'Medio' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                    'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                }>
                                    {c.impactoRiesgo}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="text-[9px] uppercase border-border-dark">{c.estado}</Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
             </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
            <Card className="bg-surface-dark border-border-dark border-l-4 border-l-primary">
                <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase flex items-center gap-2"><AlertCircle className="w-4 h-4 text-primary"/> Importancia del Paso 18</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-text-secondary leading-relaxed">
                    De acuerdo con la <span className="text-foreground">Resolución 40595 de 2022</span>, las empresas deben documentar y analizar los riesgos generados por cambios en la flota, infraestructura o rutas.
                    <br/><br/>
                    Cada registro aquí notifica al <span className="text-primary italic">Paso 6: Matriz de Riesgos</span> para su re-evaluación inmediata.
                </CardContent>
            </Card>

            <Card className="bg-surface-dark border-border-dark">
                <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-500"/> Integración de Rutas</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-text-secondary">
                    Si el cambio implica una nueva ruta, asegúrese de registrarla también en el inventario de rutas para que esté disponible en los despachos.
                </CardContent>
                <CardFooter>
                    <Button variant="ghost" className="w-full text-xs text-primary group" asChild>
                        <a href="/dashboard/rutas">Ir a Inventario de Rutas <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform"/></a>
                    </Button>
                </CardFooter>
            </Card>
        </div>
      </div>
    </div>
  );
}
