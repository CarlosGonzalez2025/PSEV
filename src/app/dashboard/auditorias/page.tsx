
'use client';

import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Plus, Search, Calendar, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function AuditoriasPage() {
  const firestore = useFirestore();
  const { profile } = useUser();

  const auditoriasRef = useMemoFirebase(() => {
    if (!firestore || !profile?.empresaId) return null;
    return query(
      collection(firestore, 'empresas', profile.empresaId, 'auditorias'),
      orderBy('fechaProgramada', 'desc')
    );
  }, [firestore, profile?.empresaId]);

  const { data: auditorias, isLoading } = useCollection(auditoriasRef);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Auditorías Internas PESV</h1>
          <p className="text-text-secondary mt-1">Verificación y cumplimiento de la Resolución 40595 (Paso 22)</p>
        </div>
        <Button className="font-bold shadow-lg shadow-primary/20 bg-primary">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Auditoría
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-surface-dark border-border-dark">
          <CardHeader className="pb-2">
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Cumplimiento Global</p>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">85%</div>
            <Progress value={85} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark">
          <CardHeader className="pb-2">
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Auditorías Ejecutadas</p>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">{auditorias?.filter(a => a.estado === 'Ejecutada').length || 0}</div>
            <p className="text-[10px] text-text-secondary mt-2">Periodo actual</p>
          </CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">No Conformidades</p>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">4</div>
            <p className="text-[10px] text-red-500 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Requieren atención
            </p>
          </CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark">
          <CardHeader className="pb-2">
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Estado Hallazgos</p>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">60%</div>
            <p className="text-[10px] text-text-secondary mt-2">Cerrados / Total</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-surface-dark border-border-dark">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white">Listado de Auditorías</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border-dark hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase text-text-secondary">Fecha</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-text-secondary">Auditor</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-text-secondary">Nivel</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-text-secondary">% Cumplimiento</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-text-secondary">Estado</TableHead>
                <th className="text-right"></th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse border-border-dark">
                    <TableCell colSpan={6} className="h-12 bg-white/5" />
                  </TableRow>
                ))
              ) : auditorias?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-text-secondary italic">No hay auditorías registradas para esta empresa.</TableCell>
                </TableRow>
              ) : (
                auditorias?.map(aud => (
                  <TableRow key={aud.id} className="border-border-dark hover:bg-white/5 transition-colors">
                    <TableCell className="text-xs text-white">{aud.fechaProgramada?.split('T')[0]}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">AUD</div>
                        <span className="text-sm text-white">Auditor PESV</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-text-secondary">Avanzado</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full" style={{ width: `${aud.puntuacionObtenida}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-emerald-500">{aud.puntuacionObtenida}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">{aud.estado?.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-primary font-bold">Ver Detalles</Button>
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
