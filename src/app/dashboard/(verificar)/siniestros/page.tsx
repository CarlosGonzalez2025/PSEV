
'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  TrendingDown,
  MoreVertical,
  Filter,
  AlertOctagon,
  DollarSign,
  FileSearch,
  Activity
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const GRAVEDAD_VARIANTS: Record<string, string> = {
  Fatalidad: "bg-red-600",
  "Heriado Grave": "bg-red-400",
  "Herido Leve": "bg-orange-400",
  "Choque Simple": "bg-blue-400"
};

export default function SiniestrosPage() {
  const firestore = useFirestore();
  const { profile } = useUser();
  const [open, setOpen] = useState(false);

  const siniestrosRef = useMemoFirebase(() => {
    if (!firestore || !profile?.empresaId) return null;
    return query(
      collection(firestore, 'empresas', profile.empresaId, 'siniestros'),
      orderBy('fechaHora', 'desc')
    );
  }, [firestore, profile?.empresaId]);

  const { data: siniestros, isLoading } = useCollection(siniestrosRef);

  const handleReportSiniestro = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore || !profile?.empresaId) return;
    const formData = new FormData(e.currentTarget);
    try {
      await addDoc(collection(firestore, 'empresas', profile.empresaId, 'siniestros'), {
        fechaHora: formData.get('fechaHora') as string,
        conductorId: formData.get('conductorId') as string,
        vehiculoId: formData.get('vehiculoId') as string,
        gravedad: formData.get('gravedad') as string,
        costosDirectos: Number(formData.get('costosDirectos')),
        costosIndirectos: Number(formData.get('costosIndirectos')),
        resumen: formData.get('resumen') as string,
        estadoInvestigacion: "Abierta",
        empresaId: profile.empresaId,
        creadoEn: new Date().toISOString()
      });
      setOpen(false);
      toast({ title: "Siniestro Reportado", description: "Se ha iniciado el proceso de investigación (Paso 21)." });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo registrar el evento." });
    }
  };

  const totalCostos = siniestros?.reduce((acc, s) => acc + (s.costosDirectos || 0) + (s.costosIndirectos || 0), 0) || 0;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase text-white">Siniestralidad Vial</h1>
          <p className="text-text-secondary mt-1">Registro, investigación y análisis de costos (Paso 21 del PESV)</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold shadow-lg shadow-destructive/20 bg-destructive hover:bg-destructive/90 text-white">
              <Plus className="size-4 mr-2" />
              Reportar Siniestro
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-surface-dark border-border-dark text-white max-w-lg">
            <DialogHeader>
              <DialogTitle>Nuevo Reporte de Siniestro</DialogTitle>
              <DialogDescription className="text-text-secondary">Asegúrese de clasificar correctamente la gravedad según la norma.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleReportSiniestro} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha y Hora</Label>
                  <Input type="datetime-local" name="fechaHora" className="bg-background-dark border-border-dark" required />
                </div>
                <div className="space-y-2">
                  <Label>Gravedad (Normativa)</Label>
                  <select name="gravedad" className="w-full bg-background-dark border-border-dark text-white h-10 px-3 rounded-md border text-sm">
                    <option value="Fatalidad">1. Fatalidad</option>
                    <option value="Herido Grave">2. Herido Grave</option>
                    <option value="Herido Leve">3. Herido Leve</option>
                    <option value="Choque Simple">4. Choque Simple</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ID Conductor</Label>
                  <Input name="conductorId" placeholder="ID o Cédula" className="bg-background-dark border-border-dark" required />
                </div>
                <div className="space-y-2">
                  <Label>Placa Vehículo</Label>
                  <Input name="vehiculoId" placeholder="ABC-123" className="bg-background-dark border-border-dark uppercase" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Costos Directos (COP)</Label>
                  <Input type="number" name="costosDirectos" placeholder="Repuestos, Grúa" className="bg-background-dark border-border-dark" />
                </div>
                <div className="space-y-2">
                  <Label>Costos Indirectos (COP)</Label>
                  <Input type="number" name="costosIndirectos" placeholder="Lucro cesante, etc" className="bg-background-dark border-border-dark" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Resumen Preliminar</Label>
                <textarea name="resumen" className="w-full bg-background-dark border-border-dark text-white p-3 rounded-md border text-sm h-20 outline-none" placeholder="Descripción breve de los hechos..." required />
              </div>
              <Button type="submit" variant="destructive" className="w-full font-bold">Registrar Evento Crítico</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-destructive/5 border-destructive/20">
          <CardHeader className="pb-2">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Tasa Siniestralidad</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 text-white">
              <span className="text-3xl font-black">1.2%</span>
              <Badge className="bg-green-500/10 text-green-500 mb-1 flex gap-1 border-none font-bold italic">
                <TrendingDown className="size-3" /> -0.5%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardHeader className="pb-2">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Costos Totales Siniestros</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="size-5 text-amber-500" />
              <div className="text-3xl font-black text-white">{totalCostos.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface-dark border-border-dark">
          <CardHeader className="pb-2">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Investigaciones Abiertas</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileSearch className="size-5 text-primary" />
              <div className="text-3xl font-black text-white">
                {siniestros?.filter(s => s.estadoInvestigacion === 'Abierta').length || 0}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-500/5 border-emerald-500/20 text-emerald-500">
          <CardHeader className="pb-2">
            <p className="text-[10px] font-bold uppercase opacity-70">Días sin incidentes</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="size-5" />
              <div className="text-3xl font-black">45</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-surface-dark border-border-dark">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input className="pl-9 bg-background-dark border-border-dark text-white" placeholder="Buscar siniestro por ID, placa o conductor..." />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-white border-border-dark"><Filter className="size-4 mr-2" /> Filtros</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border-dark overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-white/5 border-border-dark hover:bg-transparent">
                  <TableHead className="text-xs uppercase font-bold text-text-secondary">Evento</TableHead>
                  <TableHead className="text-xs uppercase font-bold text-text-secondary">Fecha / Hora</TableHead>
                  <TableHead className="text-xs uppercase font-bold text-text-secondary">Involucrados</TableHead>
                  <TableHead className="text-xs uppercase font-bold text-text-secondary">Gravedad</TableHead>
                  <TableHead className="text-xs uppercase font-bold text-text-secondary">Costos (Dir+Ind)</TableHead>
                  <TableHead className="text-xs uppercase font-bold text-text-secondary">Estado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-border-dark">
                      <TableCell colSpan={7} className="h-12 bg-white/5 animate-pulse" />
                    </TableRow>
                  ))
                ) : siniestros?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground italic">No hay siniestros reportados para esta empresa.</TableCell>
                  </TableRow>
                ) : (
                  siniestros?.map((s) => (
                    <TableRow key={s.id} className="hover:bg-white/5 transition-colors border-border-dark">
                      <TableCell>
                        <span className="font-mono font-bold text-primary">#EVT-{s.id.slice(-4).toUpperCase()}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white">{s.fechaHora?.split('T')[0]}</span>
                          <span className="text-[10px] text-muted-foreground">{s.fechaHora?.split('T')[1]}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white">{s.vehiculoId}</span>
                          <span className="text-[10px] text-muted-foreground">{s.conductorId}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${GRAVEDAD_VARIANTS[s.gravedad] || 'bg-slate-500'} text-[10px] text-white border-none`}>
                          {s.gravedad}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white text-sm">
                        $ {((s.costosDirectos || 0) + (s.costosIndirectos || 0)).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-bold text-white border-border-dark bg-white/5">
                          {s.estadoInvestigacion || 'ABIERTA'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="text-text-secondary hover:text-white"><MoreVertical className="size-4" /></Button>
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
