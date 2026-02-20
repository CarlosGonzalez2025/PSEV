'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GraduationCap, Calendar, CheckCircle2, Clock, Upload, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const MOCK_EMPRESA_ID = "demo-empresa-123";

export default function PlanFormacionPage() {
  const firestore = useFirestore();
  const capacitacionesRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'empresas', MOCK_EMPRESA_ID, 'capacitaciones'),
      orderBy('fechaProgramada', 'desc')
    );
  }, [firestore]);

  const { data: capacitaciones, isLoading } = useCollection(capacitacionesRef);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Plan Anual de Formación</h1>
          <p className="text-text-secondary mt-1">Gestión de competencias y capacitación vial (Paso 11 del PESV)</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="font-bold border-border-dark">
            <Upload className="w-4 h-4 mr-2" />
            Cargar Material
          </Button>
          <Button className="font-bold shadow-lg shadow-primary/20 bg-primary">
            <Calendar className="w-4 h-4 mr-2" />
            Programar Sesión
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-surface-dark border-border-dark">
          <CardHeader className="pb-2">
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Cobertura Total</p>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">85%</div>
            <Progress value={85} className="h-1.5 mt-2" />
            <p className="text-[10px] text-text-secondary mt-2">Meta anual: 90%</p>
          </CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark">
          <CardHeader className="pb-2">
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Sesiones Realizadas</p>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">48</div>
            <p className="text-[10px] text-emerald-500 mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> 100% efectividad
            </p>
          </CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark text-amber-500">
          <CardHeader className="pb-2">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Pendientes Urgentes</p>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">5</div>
            <p className="text-[10px] opacity-70 mt-2">Vencen esta semana</p>
          </CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark">
          <CardHeader className="pb-2">
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Horas Impartidas</p>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">124h</div>
            <p className="text-[10px] text-text-secondary mt-2">Acumulado anual</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-surface-dark border-border-dark">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <CardTitle className="text-lg font-bold text-white">Cronograma de Capacitaciones</CardTitle>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <Input className="pl-10 bg-background-dark border-border-dark" placeholder="Buscar capacitación..." />
              </div>
              <Button variant="outline" size="icon" className="border-border-dark">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl" />)}
              </div>
            ) : capacitaciones?.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-border-dark rounded-xl">
                <GraduationCap className="w-12 h-12 text-border-dark mx-auto mb-4" />
                <p className="text-text-secondary italic">No hay sesiones programadas en el plan actual.</p>
              </div>
            ) : (
              capacitaciones?.map(cap => (
                <div key={cap.id} className="flex flex-col md:flex-row items-center justify-between p-4 bg-white/5 rounded-xl border border-transparent hover:border-primary/20 transition-all gap-4">
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{cap.tema}</h4>
                      <p className="text-xs text-text-secondary">{cap.modalidad} • {cap.horasDuracion} horas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                      <p className="text-xs text-text-secondary flex items-center justify-end gap-1">
                        <Calendar className="w-3 h-3" /> {cap.fechaProgramada?.split('T')[0]}
                      </p>
                      <p className="text-[10px] font-mono text-white/50">{cap.fechaProgramada?.split('T')[1]}</p>
                    </div>
                    <Badge className={cap.estado === 'Realizada' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}>
                      {cap.estado.toUpperCase()}
                    </Badge>
                    <Button variant="ghost" size="sm" className="text-primary font-bold">Gestionar</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}