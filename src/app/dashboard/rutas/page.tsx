
'use client';

import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Map, MapPin, Plus, Navigation, AlertTriangle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function RutasPage() {
  const firestore = useFirestore();
  const { profile } = useUser();

  const rutasRef = useMemoFirebase(() => {
    if (!firestore || !profile?.empresaId) return null;
    return query(collection(firestore, 'empresas', profile.empresaId, 'rutas'));
  }, [firestore, profile?.empresaId]);

  const { data: rutas, isLoading } = useCollection(rutasRef);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Rutas y Puntos Críticos</h1>
          <p className="text-text-secondary mt-1">Planificación de desplazamientos seguros (Paso 6 del PESV)</p>
        </div>
        <Button className="font-bold shadow-lg shadow-primary/20 bg-primary">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Ruta
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-surface-dark border-border-dark min-h-[400px] flex items-center justify-center relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 opacity-20 pointer-events-none grayscale">
              <img src="https://picsum.photos/seed/map/1200/800" alt="Map Placeholder" className="w-full h-full object-cover" />
            </div>
            <div className="text-center z-10 p-10 bg-surface-dark/80 backdrop-blur rounded-xl border border-border-dark max-w-md shadow-2xl">
              <Map className="size-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white">Mapa Interactivo de Rutas</h3>
              <p className="text-sm text-text-secondary mt-2">Visualice los puntos críticos reportados y las zonas de alta accidentalidad en tiempo real.</p>
              <Button variant="outline" className="mt-6 font-bold text-white border-border-dark hover:bg-white/10">Abrir Visor de Mapas</Button>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-black text-text-secondary uppercase tracking-widest px-1">Rutas Autorizadas</h3>
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-surface-dark rounded-xl border border-border-dark" />)}
            </div>
          ) : rutas?.length === 0 ? (
            <Card className="bg-surface-dark border-border-dark border-dashed">
              <CardContent className="p-10 text-center text-text-secondary italic">No hay rutas registradas para esta empresa.</CardContent>
            </Card>
          ) : (
            rutas?.map(ruta => (
              <Card key={ruta.id} className="bg-surface-dark border-border-dark hover:border-primary/50 transition-colors cursor-pointer group shadow-lg">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-white group-hover:text-primary transition-colors">{ruta.nombre}</h4>
                    <Badge variant="secondary" className="text-[10px]">{ruta.estadoRuta}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <Navigation className="size-3" />
                      {ruta.distanciaKm} km
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <Clock className="size-3" />
                      {ruta.tiempoEstimadoMin} min
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-amber-500 bg-amber-500/10 p-1.5 rounded">
                    <AlertTriangle className="size-3" />
                    {ruta.puntosCriticos?.length || 0} Puntos Críticos detectados
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
