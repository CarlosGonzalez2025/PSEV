'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Plus, AlertCircle, CheckCircle2, XCircle, Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const MOCK_EMPRESA_ID = "demo-empresa-123";

export default function InspeccionesPage() {
  const firestore = useFirestore();
  const inspeccionesRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'empresas', MOCK_EMPRESA_ID, 'inspeccionesPreoperacionales'),
      orderBy('fechaHora', 'desc'),
      limit(20)
    );
  }, [firestore]);

  const { data: inspecciones, isLoading } = useCollection(inspeccionesRef);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Inspecciones Diarias</h1>
          <p className="text-text-secondary mt-1">Control preoperacional de flota (Paso 16 del PESV)</p>
        </div>
        <Button className="font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Inspección
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase text-emerald-500">Aprobadas Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">42</div>
            <p className="text-[10px] text-emerald-500 mt-1 flex items-center gap-1"><CheckCircle2 className="size-3" /> 100% operatividad</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase text-red-500">Rechazadas / Bloqueadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">3</div>
            <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1"><XCircle className="size-3" /> Falla crítica en frenos</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase text-amber-500">Pendientes Turno</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">12</div>
            <p className="text-[10px] text-amber-500 mt-1 flex items-center gap-1"><AlertCircle className="size-3" /> Turno 2 (Tarde)</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-surface-dark border-border-dark">
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-3 size-4 text-text-secondary" />
            <Input className="pl-10" placeholder="Buscar por placa o conductor..." />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border-dark hover:bg-transparent">
                <TableHead className="text-text-secondary font-bold uppercase text-[10px]">Fecha / Hora</TableHead>
                <TableHead className="text-text-secondary font-bold uppercase text-[10px]">Vehículo</TableHead>
                <TableHead className="text-text-secondary font-bold uppercase text-[10px]">Conductor</TableHead>
                <TableHead className="text-text-secondary font-bold uppercase text-[10px]">Kilometraje</TableHead>
                <TableHead className="text-text-secondary font-bold uppercase text-[10px]">Estado</TableHead>
                <TableHead className="text-right text-text-secondary font-bold uppercase text-[10px]">Detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse border-border-dark">
                    <TableCell colSpan={6} className="h-16 bg-white/5" />
                  </TableRow>
                ))
              ) : inspecciones?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-text-secondary italic">No se han registrado inspecciones hoy.</TableCell>
                </TableRow>
              ) : (
                inspecciones?.map(insp => (
                  <TableRow key={insp.id} className="border-border-dark hover:bg-white/5 transition-colors">
                    <TableCell className="font-mono text-xs text-white">
                      {insp.fechaHora?.replace('T', ' ')}
                    </TableCell>
                    <TableCell className="font-bold text-white">{insp.vehiculoId.toUpperCase()}</TableCell>
                    <TableCell className="text-text-secondary text-xs">{insp.conductorId}</TableCell>
                    <TableCell className="text-white font-mono text-xs">{insp.kilometraje.toLocaleString()} km</TableCell>
                    <TableCell>
                      <Badge className={insp.aprobadoParaCircular ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}>
                        {insp.aprobadoParaCircular ? 'APTO' : 'NO APTO'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-primary font-bold">Ver Checklist</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
