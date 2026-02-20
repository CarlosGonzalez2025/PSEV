'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Plus, Calendar, Settings, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const MOCK_EMPRESA_ID = "demo-empresa-123";

export default function MantenimientoPage() {
  const firestore = useFirestore();
  const mantenimientosRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'empresas', MOCK_EMPRESA_ID, 'mantenimientos'),
      orderBy('fechaEjecucion', 'desc')
    );
  }, [firestore]);

  const { data: mantenimientos, isLoading } = useCollection(mantenimientosRef);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Plan de Mantenimiento</h1>
          <p className="text-text-secondary mt-1">Gestión de servicios preventivos y correctivos (Paso 17 del PESV)</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="font-bold border-border-dark">Configurar Alertas</Button>
          <Button className="font-bold shadow-lg shadow-primary/20 bg-primary">
            <Plus className="w-4 h-4 mr-2" />
            Programar Mantenimiento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="bg-surface-dark border-border-dark">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Mantenimientos Hoy</p>
                <h3 className="text-2xl font-black text-white">5</h3>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Calendar className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Vencimientos Críticos</p>
                <h3 className="text-2xl font-black text-red-500">2</h3>
              </div>
              <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                <AlertTriangle className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Cumplimiento Plan</p>
                <h3 className="text-2xl font-black text-emerald-500">92%</h3>
              </div>
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                <CheckCircle2 className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Gastos Mes</p>
                <h3 className="text-2xl font-black text-white">$12.4M</h3>
              </div>
              <div className="p-2 bg-white/5 rounded-lg text-white">
                <Settings className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-surface-dark border-border-dark">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold text-white">Historial de Mantenimientos</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-[10px] border-border-dark">Preventivos</Badge>
            <Badge variant="outline" className="text-[10px] border-border-dark">Correctivos</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border-dark hover:bg-transparent">
                <TableHead className="text-text-secondary font-bold uppercase text-[10px]">Vehículo</TableHead>
                <TableHead className="text-text-secondary font-bold uppercase text-[10px]">Tipo</TableHead>
                <TableHead className="text-text-secondary font-bold uppercase text-[10px]">Descripción</TableHead>
                <TableHead className="text-text-secondary font-bold uppercase text-[10px]">Fecha</TableHead>
                <TableHead className="text-text-secondary font-bold uppercase text-[10px]">Costo</TableHead>
                <TableHead className="text-text-secondary font-bold uppercase text-[10px]">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse border-border-dark">
                    <TableCell colSpan={6} className="h-12 bg-white/5" />
                  </TableRow>
                ))
              ) : (
                mantenimientos?.map(mtto => (
                  <TableRow key={mtto.id} className="border-border-dark hover:bg-white/5 transition-colors">
                    <TableCell className="font-bold text-white">{mtto.vehiculoId}</TableCell>
                    <TableCell>
                      <Badge className={mtto.tipo === 'Correctivo' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}>
                        {mtto.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-text-secondary max-w-xs truncate">{mtto.descripcion}</TableCell>
                    <TableCell className="text-xs text-white">{mtto.fechaEjecucion}</TableCell>
                    <TableCell className="font-mono text-xs text-white">${mtto.costo.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">{mtto.estado}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </tbody >
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
