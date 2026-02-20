'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  TrendingDown,
  MoreVertical,
  Filter
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const MOCK_EMPRESA_ID = "demo-empresa-123";

const GRAVEDAD_VARIANTS: Record<string, string> = {
  Fatalidad: "bg-red-600",
  Grave: "bg-red-400",
  Leve: "bg-orange-400",
  "Solo Daños": "bg-blue-400"
};

export default function SiniestrosPage() {
  const firestore = useFirestore();

  const siniestrosRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'empresas', MOCK_EMPRESA_ID, 'siniestros'),
      orderBy('fechaHora', 'desc')
    );
  }, [firestore]);

  const { data: siniestros, isLoading } = useCollection(siniestrosRef);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Siniestralidad y Emergencias</h1>
          <p className="text-muted-foreground mt-1">Investigación y análisis de eventos viales (Pasos 12 y 13)</p>
        </div>
        <Button className="font-bold shadow-lg shadow-destructive/20" variant="destructive">
          <Plus className="size-4 mr-2" />
          Reportar Siniestro
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Tasa Siniestralidad</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black">1.2%</span>
              <Badge className="bg-green-500/10 text-green-500 mb-1 flex gap-1">
                <TrendingDown className="size-3" /> -0.5%
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Vs trimestre anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Costos Totales</p>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">$12.4M</div>
            <p className="text-[10px] text-muted-foreground mt-1">Directos + Indirectos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Investigaciones</p>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">12</div>
            <p className="text-[10px] text-muted-foreground mt-1">8 cerradas / 4 abiertas</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <p className="text-[10px] font-bold uppercase text-primary">Días sin incidentes</p>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-primary">45</div>
            <p className="text-[10px] text-muted-foreground mt-1">Récord histórico: 120</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar siniestro por ID, placa o conductor..." />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm"><Filter className="size-4 mr-2" /> Filtros</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs uppercase font-bold">Evento</TableHead>
                  <TableHead className="text-xs uppercase font-bold">Fecha / Hora</TableHead>
                  <TableHead className="text-xs uppercase font-bold">Conductor / Vehículo</TableHead>
                  <TableHead className="text-xs uppercase font-bold">Gravedad</TableHead>
                  <TableHead className="text-xs uppercase font-bold">Estado Inv.</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6} className="h-12 bg-muted/10 animate-pulse" />
                    </TableRow>
                  ))
                ) : siniestros?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">No hay siniestros reportados.</TableCell>
                  </TableRow>
                ) : (
                  siniestros?.map((s) => (
                    <TableRow key={s.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <span className="font-mono font-bold text-primary">#EVT-{s.id.slice(-4).toUpperCase()}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{s.fechaHora?.split('T')[0]}</span>
                          <span className="text-[10px] text-muted-foreground">{s.fechaHora?.split('T')[1]}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">ID: {s.conductorId.slice(-4)}</span>
                          <span className="text-[10px] text-muted-foreground">Placa: {s.vehiculoId.slice(-4)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${GRAVEDAD_VARIANTS[s.gravedad] || 'bg-slate-500'} text-[10px]`}>
                          {s.gravedad}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-bold">
                          {s.estadoInvestigacion || 'Abierta'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon"><MoreVertical className="size-4" /></Button>
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
