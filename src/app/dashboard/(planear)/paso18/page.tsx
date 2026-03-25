'use client';

import React, { useState, useMemo, useEffect, useTransition } from 'react';
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
import { 
  Alert, 
  AlertTitle, 
  AlertDescription 
} from "@/components/ui/alert";
import { 
  Plus, 
  Search, 
  ExternalLink, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Users, 
  Truck, 
  ClipboardCopy,
  Lock,
  ArrowRight,
  Filter,
  Info,
  Loader2
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { createContratista } from '@/actions/contratistas';

export default function Paso18Dashboard() {
  const { profile } = useUser();
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newContratista, setNewContratista] = useState({ nombreEmpresa: '', nit: '', email: '', contactoNombre: '' });
  const [isPending, startTransition] = useTransition();

  // Verificar Nivel de Empresa
  const isBasico = profile?.nivel === 'Básico';

  const contratistasRef = useMemoFirebase(() => {
    if (!firestore || !profile?.empresaId) return null;
    return query(
      collection(firestore, 'contratistas'), 
      where('empresaId', '==', profile.empresaId),
      orderBy('creadoEn', 'desc')
    );
  }, [firestore, profile?.empresaId]);

  const { data: contratistas, isLoading } = useCollection(contratistasRef);

  const filtered = contratistas?.filter(c => 
    c.nombreEmpresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.nit.includes(searchTerm)
  );

  const stats = useMemo(() => {
    if (!contratistas) return { total: 0, aprobados: 0, pendientes: 0, bloqueados: 0 };
    return {
      total: contratistas.length,
      aprobados: contratistas.filter(c => c.estado === 'Aprobado').length,
      pendientes: contratistas.filter(c => c.estado === 'Pendiente').length,
      bloqueados: contratistas.filter(c => c.estado === 'Bloqueado').length,
    };
  }, [contratistas]);

  const handleCreate = async () => {
    if (!profile?.empresaId) return;
    startTransition(async () => {
      const res = await createContratista({ ...newContratista, empresaId: profile.empresaId });
      if (res.success) {
        toast({ title: "Contratista creado", description: "Se ha generado el link de portal." });
        setIsCreateOpen(false);
        setNewContratista({ nombreEmpresa: '', nit: '', email: '', contactoNombre: '' });
      } else {
        toast({ title: "Error", description: res.error, variant: "destructive" });
      }
    });
  };

  const copyToClipboard = (token: string) => {
    const url = `${window.location.origin}/portal/contratista/${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link Copiado", description: "Envía este link al contratista para su autogestión." });
  };

  if (isBasico) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Card className="max-w-md border-2 border-yellow-500/20 bg-yellow-500/5 shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Módulo Paso 18</CardTitle>
            <CardDescription className="text-base">Gestión de Contratistas y del Cambio</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Este módulo está diseñado para empresas de nivel <span className="font-bold text-foreground">Estándar</span> o <span className="font-bold text-foreground">Avanzado</span> según la Resolución 40595 de 2022.
            </p>
            <Alert variant="default" className="bg-primary/5 border-primary/20 text-left">
              <Info className="h-4 w-4" />
              <AlertTitle>¿Por qué?</AlertTitle>
              <AlertDescription className="text-xs">
                Las empresas con nivel Básico no están obligadas legalmente a implementar este paso completo, aunque se recomienda para un control operativo total.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
             <Button className="w-full" variant="outline" onClick={() => window.history.back()}>Regresar</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Gestión de Contratistas</h1>
          <p className="text-text-secondary mt-1">Control operativo y cumplimiento del Paso 18</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
           <DialogTrigger asChild>
             <Button className="bg-primary font-black uppercase h-12 px-8 text-white shadow-lg">
               <Plus className="w-5 h-5 mr-2" /> Agregar Contratista
             </Button>
           </DialogTrigger>
           <DialogContent className="bg-surface-dark border-border-dark text-white">
             <DialogHeader>
               <DialogTitle>Nuevo Aliado / Contratista</DialogTitle>
               <DialogDescription>Se generará un link único para que el contratista cargue sus conductores y vehículos.</DialogDescription>
             </DialogHeader>
             <div className="space-y-4 py-4">
               <div className="grid gap-2">
                 <Label>Nombre de la Empresa</Label>
                 <Input value={newContratista.nombreEmpresa} onChange={e => setNewContratista({...newContratista, nombreEmpresa: e.target.value})} className="bg-background-dark border-border-dark" />
               </div>
               <div className="grid gap-2">
                 <Label>NIT / Identificación</Label>
                 <Input value={newContratista.nit} onChange={e => setNewContratista({...newContratista, nit: e.target.value})} className="bg-background-dark border-border-dark" />
               </div>
               <div className="grid gap-2">
                 <Label>Email Principal (Notificaciones)</Label>
                 <Input type="email" value={newContratista.email} onChange={e => setNewContratista({...newContratista, email: e.target.value})} className="bg-background-dark border-border-dark" />
               </div>
             </div>
             <DialogFooter>
                <Button onClick={handleCreate} disabled={isPending} className="bg-emerald-600 hover:bg-emerald-500 w-full uppercase font-bold text-white">
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Crear y Generar Token
                </Button>
             </DialogFooter>
           </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-surface-dark border-border-dark">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Users className="size-5 text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-secondary uppercase">Total Aliados</p>
              <p className="text-2xl font-black text-white">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark border-l-4 border-l-emerald-500">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="size-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-secondary uppercase">Aprobados</p>
              <p className="text-2xl font-black text-white">{stats.aprobados}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark border-l-4 border-l-amber-500">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Clock className="size-5 text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-secondary uppercase">Pendientes</p>
              <p className="text-2xl font-black text-white">{stats.pendientes}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark border-l-4 border-l-red-500">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <ShieldAlert className="size-5 text-red-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-secondary uppercase">Bloqueados</p>
              <p className="text-2xl font-black text-white">{stats.bloqueados}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="bg-surface-dark border-border-dark overflow-hidden">
        <div className="p-4 bg-white/5 border-b border-border-dark flex justify-between items-center gap-4">
           <div className="relative flex-1 max-w-sm">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-secondary" />
             <Input
               className="bg-black/20 border-border-dark pl-9 h-10 text-white"
               placeholder="Buscar por nombre o NIT..."
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
           </div>
           <Button variant="outline" className="border-border-dark text-white"><Filter className="w-4 h-4 mr-2"/> Filtros</Button>
        </div>
        
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-border-dark hover:bg-transparent">
              <TableHead className="text-xs font-bold uppercase text-text-secondary">Empresa Aliatada</TableHead>
              <TableHead className="text-xs font-bold uppercase text-text-secondary">Identificación</TableHead>
              <TableHead className="text-xs font-bold uppercase text-text-secondary">Estado</TableHead>
              <TableHead className="text-xs font-bold uppercase text-text-secondary">Operación</TableHead>
              <TableHead className="text-xs font-bold uppercase text-text-secondary text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow><TableCell colSpan={5} className="text-center py-10 opacity-50">Cargando contratistas...</TableCell></TableRow>
            ) : filtered?.length === 0 ? (
               <TableRow><TableCell colSpan={5} className="text-center py-10 opacity-50 italic">No hay registros que coincidan.</TableCell></TableRow>
            ) : filtered?.map((c) => (
              <TableRow key={c.id} className="border-border-dark hover:bg-white/5 transition-colors">
                <TableCell className="font-bold text-white">
                  <div className="flex flex-col">
                    {c.nombreEmpresa}
                    <span className="text-[10px] text-text-secondary font-normal">{c.contactoNombre}</span>
                  </div>
                </TableCell>
                <TableCell className="text-text-secondary">{c.nit}</TableCell>
                <TableCell>
                  <Badge className={
                    c.estado === 'Aprobado' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                    c.estado === 'Bloqueado' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                    'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }>
                    {c.estado}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-4 text-text-secondary text-[11px]">
                     <span className="flex items-center gap-1"><Users className="w-3 h-3"/> 0</span>
                     <span className="flex items-center gap-1"><Truck className="w-3 h-3"/> 0</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                   <div className="flex justify-end gap-2">
                      <Button size="icon" variant="ghost" className="text-primary hover:bg-primary/10" onClick={() => copyToClipboard(c.portalToken)}>
                        <ClipboardCopy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" className="text-text-secondary hover:text-white" asChild>
                         <a href={`/portal/contratista/${c.portalToken}`} target="_blank"><ExternalLink className="w-4 h-4" /></a>
                      </Button>
                      <Button size="sm" variant="secondary" className="gap-1">
                        Detalle <ArrowRight className="w-3 h-3" />
                      </Button>
                   </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
