
'use client';

import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  AlertTriangle, 
  User, 
  Activity,
  Edit,
  Trash2,
  CheckCircle
} from "lucide-react";
import { useState } from 'react';

const RISK_LEVELS: Record<string, string> = {
  Bajo: "bg-green-500",
  Medio: "bg-yellow-500",
  Alto: "bg-orange-500",
  Extremo: "bg-red-500"
};

export default function RiesgosPage() {
  const firestore = useFirestore();
  const { profile } = useUser();
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);

  const riesgosRef = useMemoFirebase(() => {
    if (!firestore || !profile?.empresaId) return null;
    return query(collection(firestore, 'empresas', profile.empresaId, 'riesgosViales'));
  }, [firestore, profile?.empresaId]);

  const { data: riesgos, isLoading } = useCollection(riesgosRef);

  const selectedRisk = riesgos?.find(r => r.id === selectedRiskId);

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 overflow-hidden">
      {/* List Sidebar */}
      <aside className="w-80 flex flex-col border border-border-dark rounded-xl bg-surface-dark overflow-hidden">
        <div className="p-4 border-b border-border-dark space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-secondary" />
            <Input className="pl-9 h-9 bg-background-dark border-border-dark text-white" placeholder="Buscar riesgo..." />
          </div>
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Inventario de Riesgos</span>
            <Badge variant="secondary" className="text-[10px]">{riesgos?.length || 0} Total</Badge>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-white/5 animate-pulse rounded-xl" />)}
            </div>
          ) : riesgos?.length === 0 ? (
            <div className="text-center py-10 text-xs text-text-secondary italic">No hay riesgos registrados.</div>
          ) : (
            riesgos?.map((riesgo) => (
              <div 
                key={riesgo.id}
                onClick={() => setSelectedRiskId(riesgo.id)}
                className={`p-3 rounded-xl border-l-4 transition-all cursor-pointer shadow-sm ${
                  selectedRiskId === riesgo.id 
                    ? 'bg-primary/10 border-l-primary' 
                    : 'bg-white/5 border-l-transparent hover:border-l-primary/50'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold text-text-secondary">R-{riesgo.id.slice(0,4).toUpperCase()}</span>
                  <Badge className={`${RISK_LEVELS[riesgo.nivelRiesgo] || 'bg-slate-500'} text-[10px] h-5`}>
                    {riesgo.nivelRiesgo} ({riesgo.probabilidad * riesgo.severidad})
                  </Badge>
                </div>
                <h4 className="text-sm font-bold leading-snug line-clamp-2 text-white">{riesgo.descripcion}</h4>
                <div className="flex items-center gap-1.5 mt-2 text-text-secondary">
                  <Activity className="size-3" />
                  <span className="text-[10px] font-medium">{riesgo.factorRiesgo}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-border-dark">
          <Button className="w-full font-bold bg-primary text-white">
            <Plus className="size-4 mr-2" />
            Nuevo Riesgo
          </Button>
        </div>
      </aside>

      {/* Matrix Visualization */}
      <main className="flex-1 flex flex-col bg-background-dark rounded-xl border border-border-dark overflow-hidden">
        <div className="p-4 border-b border-border-dark bg-surface-dark flex justify-between items-center">
          <div className="flex gap-4">
            <div className="space-y-1 text-white">
              <label className="text-[10px] font-bold uppercase text-text-secondary">Ruta Asignada</label>
              <select className="bg-background-dark border border-border-dark rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary block">
                <option>Todas las rutas</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase text-text-secondary">Niveles:</span>
            {Object.entries(RISK_LEVELS).map(([label, color]) => (
              <div key={label} className="flex items-center gap-1">
                <div className={`size-2 rounded-full ${color}`}></div>
                <span className="text-[10px] font-medium text-white">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 overflow-auto bg-[radial-gradient(circle_at_center,_#ffffff05_1px,_transparent_1px)] bg-[size:24px_24px]">
          <div className="relative bg-surface-dark rounded-2xl shadow-2xl border border-border-dark p-8 w-full max-w-[600px] aspect-square">
            {/* Axis Labels */}
            <div className="absolute -left-12 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-black tracking-widest text-text-secondary uppercase">
              Probabilidad
            </div>
            <div className="absolute bottom-[-30px] left-1/2 -translate-x-1/2 text-[10px] font-black tracking-widest text-text-secondary uppercase">
              Severidad (Impacto)
            </div>

            {/* Matrix Grid 5x5 */}
            <div className="grid grid-cols-5 grid-rows-5 gap-1 h-full w-full">
              {[5, 4, 3, 2, 1].map((p) => (
                [1, 2, 3, 4, 5].map((s) => {
                  const score = p * s;
                  let bgColor = "bg-green-500/10 border-green-500/20";
                  if (score > 15) bgColor = "bg-red-500/10 border-red-500/20";
                  else if (score > 9) bgColor = "bg-orange-500/10 border-orange-500/20";
                  else if (score > 4) bgColor = "bg-yellow-500/10 border-yellow-500/20";

                  const riskInCell = riesgos?.filter(r => r.probabilidad === p && r.severidad === s);

                  return (
                    <div key={`${p}-${s}`} className={`relative border rounded flex items-center justify-center ${bgColor}`}>
                      <span className="absolute top-0.5 left-1 text-[8px] font-bold opacity-20 text-white">P{p}-S{s}</span>
                      <div className="flex flex-wrap gap-1 p-1">
                        {riskInCell?.map(r => (
                          <div 
                            key={r.id} 
                            onClick={() => setSelectedRiskId(r.id)}
                            className={`size-6 rounded-full flex items-center justify-center text-[10px] font-bold cursor-pointer transition-transform hover:scale-110 shadow-md ${
                              selectedRiskId === r.id ? 'bg-primary text-white ring-2 ring-white' : 'bg-white text-background-dark'
                            }`}
                          >
                            !
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Details Side */}
      <aside className="w-96 bg-surface-dark border border-border-dark rounded-xl shadow-xl overflow-y-auto flex flex-col">
        {selectedRisk ? (
          <>
            <div className="p-6 border-b border-border-dark space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-primary font-bold text-xs uppercase tracking-wider">Detalles del Riesgo</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="size-8 text-white"><Edit className="size-4" /></Button>
                  <Button variant="ghost" size="icon" className="size-8 text-destructive"><Trash2 className="size-4" /></Button>
                </div>
              </div>
              <h3 className="text-xl font-bold leading-tight text-white">{selectedRisk.descripcion}</h3>
              <div className="flex items-center gap-2">
                <Badge className={RISK_LEVELS[selectedRisk.nivelRiesgo]}>
                  Riesgo {selectedRisk.nivelRiesgo}
                </Badge>
                <span className="text-[10px] text-text-secondary uppercase font-bold">P{selectedRisk.probabilidad} x S{selectedRisk.severidad} = {selectedRisk.probabilidad * selectedRisk.severidad}</span>
              </div>
            </div>

            <div className="p-6 space-y-8 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-white/5 border-border-dark">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-bold uppercase text-text-secondary mb-1">Probabilidad</p>
                    <div className="text-2xl font-black text-white">{selectedRisk.probabilidad} <span className="text-sm font-normal text-text-secondary">/ 5</span></div>
                  </CardContent>
                </Card>
                <Card className="bg-white/5 border-border-dark">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-bold uppercase text-text-secondary mb-1">Severidad</p>
                    <div className="text-2xl font-black text-white">{selectedRisk.severidad} <span className="text-sm font-normal text-text-secondary">/ 5</span></div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-text-secondary flex items-center gap-2">
                  <Activity className="size-4 text-primary" />
                  Plan de Mitigación
                </h4>
                <div className="space-y-2">
                  {selectedRisk.accionesMitigacionIds?.length > 0 ? (
                    selectedRisk.accionesMitigacionIds.map((id: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-border-dark bg-white/5">
                        <CheckCircle className="size-4 text-primary mt-0.5" />
                        <span className="text-xs font-medium text-white">Acción vinculada en ejecución</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-text-secondary italic">No hay acciones de mitigación vinculadas.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border-dark bg-white/5">
              <Button variant="outline" className="w-full font-bold text-white border-border-dark hover:bg-white/10">
                Marcar como Resuelto
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center text-text-secondary">
            <AlertTriangle className="size-12 mb-4 opacity-20" />
            <p className="text-sm font-medium">Selecciona un riesgo de la lista o la matriz para ver el detalle.</p>
          </div>
        )}
      </aside>
    </div>
  );
}
