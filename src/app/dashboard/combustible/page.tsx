'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Fuel, TrendingDown, Leaf, AlertTriangle, Plus, MapPin } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const MOCK_EMPRESA_ID = "demo-empresa-123";

export default function EficienciaEnergeticaPage() {
  const firestore = useFirestore();
  const consumosRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'empresas', MOCK_EMPRESA_ID, 'consumosCombustible'),
      orderBy('fecha', 'desc')
    );
  }, [firestore]);

  const { data: consumos, isLoading } = useCollection(consumosRef);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Eficiencia Energética</h1>
          <p className="text-text-secondary mt-1">Control de combustible y huella de carbono (Paso 14 del PESV)</p>
        </div>
        <Button className="font-bold shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Registrar Carga
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-surface-dark border-border-dark border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Consumo Mes</p>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">1,245 <span className="text-sm font-normal text-text-secondary">Gal</span></div>
            <p className="text-[10px] text-emerald-500 mt-2 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> -2.5% vs mes anterior
            </p>
          </CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark">
          <CardHeader className="pb-2">
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Eficiencia Flota</p>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">12.5 <span className="text-sm font-normal text-text-secondary">Km/Gal</span></div>
            <Progress value={75} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Huella de CO2</p>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">450 <span className="text-sm font-normal text-text-secondary">kg</span></div>
            <p className="text-[10px] text-primary mt-2 flex items-center gap-1">
              <Leaf className="w-3 h-3" /> 20 árboles compensados
            </p>
          </CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Desviaciones</p>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">3</div>
            <p className="text-[10px] text-red-500 mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Posible fuga detectada
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-surface-dark border-border-dark">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">Historial de Abastecimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 rounded-lg" />)}
                </div>
              ) : consumos?.length === 0 ? (
                <div className="text-center py-10 text-text-secondary italic">No hay registros de combustible recientes.</div>
              ) : (
                consumos?.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-transparent hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <Fuel className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{c.vehiculoId}</p>
                        <p className="text-[10px] text-text-secondary">{c.estacion}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">{c.cantidadGalones} Gal</p>
                        <p className="text-[10px] text-text-secondary font-mono">${c.costoTotal.toLocaleString()}</p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-white">{c.fecha}</p>
                        <p className="text-[10px] text-text-secondary">{c.kilometraje} km</p>
                      </div>
                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 text-[10px]">NORMAL</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface-dark border-border-dark overflow-hidden">
          <CardHeader className="pb-0">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" /> Estaciones Frecuentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 mt-4">
            <div className="h-64 bg-background-dark relative group">
              <img src="https://picsum.photos/seed/fuel/400/300" className="w-full h-full object-cover opacity-40 grayscale group-hover:grayscale-0 transition-all duration-500" data-ai-hint="city map" />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-dark to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 space-y-2">
                <div className="flex items-center justify-between p-2 bg-white/5 backdrop-blur-sm rounded border border-white/10">
                  <span className="text-xs text-white">Texaco Norte</span>
                  <span className="text-[10px] font-bold text-emerald-500">Mejor Precio</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/5 backdrop-blur-sm rounded border border-white/10">
                  <span className="text-xs text-white">Puma Av. Principal</span>
                  <span className="text-[10px] font-bold text-text-secondary">Estándar</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}