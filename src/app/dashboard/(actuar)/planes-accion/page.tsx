
'use client';

import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HardHat, Plus, Search, Filter, CheckCircle2, Clock, AlertTriangle, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function PlanesAccionPage() {
  const firestore = useFirestore();
  const { profile } = useUser();

  const planesRef = useMemoFirebase(() => {
    if (!firestore || !profile?.empresaId) return null;
    return query(
      collection(firestore, 'empresas', profile.empresaId, 'planesAccion'),
      orderBy('fechaCreacion', 'desc')
    );
  }, [firestore, profile?.empresaId]);

  const { data: planes, isLoading } = useCollection(planesRef);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Planes de Acción</h1>
          <p className="text-text-secondary mt-1">Mejora continua y cierre de no conformidades (Paso 23 y 24)</p>
        </div>
        <Button className="font-bold shadow-lg shadow-primary/20 bg-primary">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Acción
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-surface-dark border-border-dark">
          <CardHeader className="pb-2">
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Total Hallazgos</p>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">{planes?.length || 0}</div>
            <p className="text-[10px] text-emerald-500 mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Eficacia monitoreada
            </p>
          </CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Vencidos / Críticos</p>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">0</div>
            <p className="text-[10px] text-red-500 mt-2">Requieren cierre inmediato</p>
          </CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark">
          <CardHeader className="pb-2">
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">En Proceso</p>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">{planes?.filter(p => p.estado === 'Abierto' || p.estado === 'En Proceso').length || 0}</div>
            <p className="text-[10px] text-text-secondary mt-2">Acciones activas</p>
          </CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Eficacia Promedio</p>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">100%</div>
            <p className="text-[10px] text-emerald-500 mt-2">Meta de cierre cumplida</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-surface-dark border-border-dark">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative flex-1 md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <Input className="pl-10 bg-background-dark border-border-dark" placeholder="Buscar hallazgos..." />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border-dark hover:bg-transparent">
                  <TableHead className="text-[10px] font-black uppercase text-text-secondary">ID</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-text-secondary">Origen / Hallazgo</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-text-secondary">Responsable</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-text-secondary">Estado / Límite</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse border-border-dark">
                      <TableCell colSpan={6} className="h-16 bg-white/5" />
                    </TableRow>
                  ))
                ) : planes?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-text-secondary italic">No hay planes de acción registrados.</TableCell>
                  </TableRow>
                ) : (
                  planes?.map(plan => (
                    <TableRow key={plan.id} className="border-border-dark hover:bg-white/5 transition-colors cursor-pointer group">
                      <TableCell className="text-xs text-text-secondary font-mono">{plan.id.slice(-5).toUpperCase()}</TableCell>
                      <TableCell>
                        <div className="flex flex-col max-w-xs">
                          <span className="text-sm font-bold text-foreground truncate">{plan.descripcion}</span>
                          <span className="text-[10px] text-primary uppercase font-bold">{plan.origen}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-foreground">AF</div>
                          <span className="text-sm text-text-secondary">Responsable</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge className={plan.estado === 'Cerrado' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}>
                            {plan.estado?.toUpperCase()}
                          </Badge>
                          <span className="text-[10px] text-text-secondary flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {plan.fechaLimite?.split('T')[0]}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <ChevronRight className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors" />
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
