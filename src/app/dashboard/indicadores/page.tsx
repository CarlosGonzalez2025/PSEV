'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, TrendingUp, AlertTriangle, FileBarChart, Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const MOCK_EMPRESA_ID = "demo-empresa-123";

export default function IndicadoresPage() {
  const firestore = useFirestore();
  const medicionesRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'empresas', MOCK_EMPRESA_ID, 'indicadoresMedicion'),
      orderBy('fechaMedicion', 'desc')
    );
  }, [firestore]);

  const { data: mediciones, isLoading } = useCollection(medicionesRef);

  const indicators = [
    { name: "Tasa de Siniestralidad", target: "< 2.0%", current: "1.2%", status: "compliant", icon: AlertTriangle },
    { name: "Mantenimiento Preventivo", target: "100%", current: "92%", status: "warning", icon: FileBarChart },
    { name: "Plan de Formación", target: "90%", current: "85%", status: "warning", icon: CheckCircle2 },
    { name: "No Conformidades Cerradas", target: "100%", current: "75%", status: "warning", icon: BarChart3 },
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Indicadores PESV (Paso 20)</h1>
          <p className="text-text-secondary mt-1">Cálculo automático de los 13 indicadores mínimos de ley</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/20">
          <Download className="size-4 mr-2" />
          Exportar Reporte SISI
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {indicators.map((ind, i) => (
          <Card key={i} className="bg-surface-dark border-border-dark hover:border-primary/30 transition-all group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-bold text-white">{ind.name}</CardTitle>
                <CardDescription className="text-text-secondary text-xs">Meta Legal: {ind.target}</CardDescription>
              </div>
              <div className={`p-2 rounded-lg ${ind.status === 'compliant' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                <ind.icon className="size-5" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-4xl font-black text-white tracking-tighter">{ind.current}</span>
                <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                  <TrendingUp className="size-3" />
                  +2.4% vs anterior
                </span>
              </div>
              <Progress value={85} className="h-2" />
              <div className="flex justify-between text-[10px] font-bold text-text-secondary uppercase">
                <span>Último corte: 30 Sep</span>
                <span>Siguiente corte: 31 Dic</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-surface-dark border-border-dark">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white">Consolidado Histórico</CardTitle>
          <CardDescription>Resumen de autogestión anual reportado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="animate-pulse space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-12 bg-white/5 rounded-lg" />)}
              </div>
            ) : mediciones?.length === 0 ? (
              <div className="text-center py-10 text-text-secondary italic border-2 border-dashed border-border-dark rounded-xl">
                No hay mediciones históricas registradas. Los datos se generarán al finalizar el trimestre.
              </div>
            ) : (
              mediciones?.map(m => (
                <div key={m.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-transparent hover:border-primary/20 transition-all">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">{m.periodo}</span>
                    <span className="text-[10px] text-text-secondary">{m.fechaMedicion}</span>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <span className="text-xs text-text-secondary block">Resultado</span>
                      <span className="text-lg font-black text-white">{m.resultadoPorcentaje}%</span>
                    </div>
                    <Badge className={m.cumpleMeta ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}>
                      {m.cumpleMeta ? 'CUMPLE' : 'DESVIACIÓN'}
                    </Badge>
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
