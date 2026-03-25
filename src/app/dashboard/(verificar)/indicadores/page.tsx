
'use client';

import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  FileBarChart,
  Download,
  CheckCircle2,
  Skull,
  Activity,
  History,
  DollarSign,
  Truck,
  Users,
  Timer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const SISI_INDICATORS = [
  {
    group: "Impacto (Siniestralidad)", items: [
      { name: "Tasa de Siniestralidad", target: "< 1.5%", current: "1.2%", status: "compliant", icon: AlertTriangle, desc: "Siniestros / Kilómetros * 10^6" },
      { name: "Tasa de Mortalidad", target: "0.0", current: "0.0", status: "compliant", icon: Skull, desc: "Muertos / Kilómetros * 10^6" },
      { name: "Tasa de Incidencia Lesiones", target: "< 1.0", current: "0.4", status: "compliant", icon: Activity, desc: "Heridos / Kilómetros * 10^6" },
      { name: "Frecuencia de Siniestros", target: "< 5.0", current: "2.1", status: "compliant", icon: Timer, desc: "Eventos por cada 10 vehículos" },
    ]
  },
  {
    group: "Gestión y Cumplimiento", items: [
      { name: "Plan Anual de Trabajo", target: "100%", current: "95%", status: "compliant", icon: CheckCircle2, desc: "Actividades ejecutadas / programadas" },
      { name: "Inspección Diaria", target: "100%", current: "98%", status: "compliant", icon: FileBarChart, desc: "Preoperativos realizados / total viajes" },
      { name: "Mantenimiento Preventivo", target: "100%", current: "92%", status: "warning", icon: Truck, desc: "Vehículos con mantenimiento al día" },
      { name: "Capacitación PESV", target: "90%", current: "85%", status: "warning", icon: Users, desc: "Personal formado / total nómina" },
      { name: "Investigación Siniestros", target: "100%", current: "100%", status: "compliant", icon: History, desc: "Casos investigados / total reportados" },
    ]
  },
  {
    group: "Operación y Costos", items: [
      { name: "Kilómetros Recorridos", target: "N/A", current: "45,230", status: "neutral", icon: TrendingUp, desc: "Total acumulado trimestre" },
      { name: "Costos de Siniestros", target: "N/A", current: "$ 2.5M", status: "neutral", icon: DollarSign, desc: "Gastos directos e indirectos" },
      { name: "Flota Inspeccionada", target: "100%", current: "100%", status: "compliant", icon: BarChart3, desc: "Vehículos verificados físicamente" },
      { name: "Personal Capacitado", target: "90%", current: "88%", status: "warning", icon: Users, desc: "Certificados cargados en sistema" },
    ]
  }
];

export default function IndicadoresPage() {
  const firestore = useFirestore();
  const { profile } = useUser();

  const medicionesRef = useMemoFirebase(() => {
    if (!firestore || !profile?.empresaId) return null;
    return query(
      collection(firestore, 'empresas', profile.empresaId, 'indicadoresMedicion'),
      orderBy('fechaMedicion', 'desc')
    );
  }, [firestore, profile?.empresaId]);

  const { data: mediciones, isLoading } = useCollection(medicionesRef);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Dashboard de Indicadores SISI</h1>
          <p className="text-text-secondary mt-1">Reporte trimestral alineado a la Resolución 40595 (Paso 20)</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-border-dark text-foreground hover:bg-white/10 font-bold">
            <Download className="size-4 mr-2" />
            Descargar Formato SISI (Excel)
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20">
            Actualizar Mediciones
          </Button>
        </div>
      </div>

      <Tabs defaultValue={SISI_INDICATORS[0].group} className="w-full">
        <TabsList className="bg-surface-dark border-border-dark w-full md:w-auto h-auto p-1 overflow-x-auto flex-nowrap">
          {SISI_INDICATORS.map(group => (
            <TabsTrigger key={group.group} value={group.group} className="text-xs uppercase font-bold py-2 data-[state=active]:bg-primary">
              {group.group}
            </TabsTrigger>
          ))}
        </TabsList>

        {SISI_INDICATORS.map(group => (
          <TabsContent key={group.group} value={group.group} className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {group.items.map((ind, i) => (
                <Card key={i} className="bg-surface-dark border-border-dark hover:border-primary/30 transition-all group shadow-xl overflow-hidden relative">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${ind.status === 'compliant' ? 'bg-emerald-500' : ind.status === 'warning' ? 'bg-amber-500' : 'bg-primary'}`} />
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle className="text-base font-bold text-foreground uppercase tracking-tight">{ind.name}</CardTitle>
                      <CardDescription className="text-text-secondary text-[10px] font-bold">FÓRMULA: {ind.desc}</CardDescription>
                    </div>
                    <div className={`p-2 rounded-lg ${ind.status === 'compliant' ? 'bg-emerald-500/10 text-emerald-500' : ind.status === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
                      <ind.icon className="size-5" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-baseline justify-between">
                      <div className="flex flex-col">
                        <span className="text-4xl font-black text-foreground tracking-tighter">{ind.current}</span>
                        <span className="text-[10px] text-text-secondary font-bold uppercase">Resultado actual</span>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="border-border-dark text-text-secondary">META: {ind.target}</Badge>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Progress value={ind.current.includes('%') ? parseFloat(ind.current) : 85} className="h-1.5" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Card className="bg-surface-dark border-border-dark shadow-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <History className="w-5 h-5 text-primary" /> Reportes Trimestrales Enviados
          </CardTitle>
          <CardDescription>Evidencia de cumplimiento ante la autoridad competente</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border-dark bg-white/5">
                <TableHead className="text-foreground font-bold">Periodo</TableHead>
                <TableHead className="text-foreground font-bold">Fecha Envío</TableHead>
                <TableHead className="text-foreground font-bold text-center">Cumplimiento Global</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mediciones?.map((m) => (
                <TableRow key={m.id} className="border-border-dark">
                  <TableCell className="text-foreground font-bold">{m.periodo}</TableCell>
                  <TableCell className="text-text-secondary text-sm">{m.fechaMedicion?.split('T')[0]}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={m.resultadoPorcentaje > 90 ? "bg-emerald-500/10 text-emerald-500 border-none" : "bg-amber-500/10 text-amber-500 border-none"}>
                      {m.resultadoPorcentaje}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-primary font-bold">Ver Detalles</Button>
                  </TableCell>
                </TableRow>
              ))}
              {mediciones?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-text-secondary italic">No hay reportes trimestrales históricos.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
