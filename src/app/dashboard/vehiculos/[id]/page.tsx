
'use client';

import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Truck, 
  Calendar, 
  Wrench, 
  ClipboardCheck, 
  AlertTriangle, 
  ArrowLeft, 
  Printer, 
  Fuel, 
  ShieldAlert,
  Activity,
  User,
  Info,
  MapPin
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function VehicleDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { profile } = useUser();

  // Documento del Vehículo
  const vehicleRef = useMemoFirebase(() => {
    if (!firestore || !profile?.empresaId || !id) return null;
    return doc(firestore, 'empresas', profile.empresaId, 'vehiculos', id as string);
  }, [firestore, profile?.empresaId, id]);

  const { data: vehicle, isLoading: loadingVehicle } = useDoc(vehicleRef);

  // Mantenimientos relacionados
  const mantenimientosRef = useMemoFirebase(() => {
    if (!firestore || !profile?.empresaId || !vehicle?.placa) return null;
    return query(
      collection(firestore, 'empresas', profile.empresaId, 'mantenimientos'),
      where('vehiculoId', '==', vehicle.placa),
      orderBy('fechaEjecucion', 'desc')
    );
  }, [firestore, profile?.empresaId, vehicle?.placa]);

  const { data: mantenimientos } = useCollection(mantenimientosRef);

  // Inspecciones relacionadas
  const inspeccionesRef = useMemoFirebase(() => {
    if (!firestore || !profile?.empresaId || !vehicle?.placa) return null;
    return query(
      collection(firestore, 'empresas', profile.empresaId, 'inspeccionesPreoperacionales'),
      where('vehiculoId', '==', vehicle.placa),
      orderBy('fechaHora', 'desc')
    );
  }, [firestore, profile?.empresaId, vehicle?.placa]);

  const { data: inspecciones } = useCollection(inspeccionesRef);

  if (loadingVehicle) return <div className="p-10 text-white animate-pulse">Cargando Hoja de Vida...</div>;
  if (!vehicle) return <div className="p-10 text-white text-center">Vehículo no encontrado.</div>;

  const checkVencimiento = (fechaStr: string) => {
    if (!fechaStr) return 'neutral';
    const hoy = new Date();
    const fecha = new Date(fechaStr);
    const diff = fecha.getTime() - hoy.getTime();
    const dias = diff / (1000 * 60 * 60 * 24);
    if (dias < 0) return 'vencido';
    if (dias < 30) return 'por-vencer';
    return 'vigente';
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="text-text-secondary hover:text-white" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 size-4" /> Volver a Flota
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" className="border-border-dark text-white">
            <Printer className="mr-2 size-4" /> Exportar Hoja de Vida
          </Button>
          <Button className="bg-primary font-bold">
            Editar Unidad
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-surface-dark border-border-dark overflow-hidden">
            <div className="bg-primary/10 p-8 flex flex-col items-center text-center border-b border-border-dark">
              <div className="size-20 rounded-2xl bg-primary flex items-center justify-center text-white mb-4 shadow-xl shadow-primary/20">
                <Truck className="size-10" />
              </div>
              <h2 className="text-3xl font-black text-white tracking-tighter">{vehicle.placa}</h2>
              <p className="text-primary font-bold uppercase text-xs tracking-widest">{vehicle.marca} {vehicle.modelo}</p>
              <Badge className="mt-4 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                {vehicle.estadoOperativo?.toUpperCase()}
              </Badge>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-text-secondary uppercase">Propietario</p>
                <p className="text-sm font-bold text-white flex items-center gap-2">
                  <User className="size-3 text-primary" /> {vehicle.propietario}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-text-secondary uppercase">Kilometraje Acumulado</p>
                <p className="text-xl font-black text-white">{vehicle.kilometrajeActual?.toLocaleString()} km</p>
              </div>
              <div className="pt-4 border-t border-border-dark grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-text-secondary uppercase">Tipo</p>
                  <p className="text-xs font-bold text-white">{vehicle.tipoVehiculo}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-text-secondary uppercase">Cilindraje</p>
                  <p className="text-xs font-bold text-white">{vehicle.cilindraje}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface-dark border-border-dark">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase text-primary tracking-widest">Documentos Legales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'SOAT', date: vehicle.soatVencimiento },
                { label: 'RTM', date: vehicle.rtmVencimiento },
                { label: 'Póliza Todo Riesgo', date: vehicle.polizaVencimiento }
              ].map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-border-dark">
                  <div>
                    <p className="text-[10px] font-bold text-text-secondary uppercase">{doc.label}</p>
                    <p className="text-xs font-bold text-white">{doc.date || 'N/A'}</p>
                  </div>
                  <Badge className={checkVencimiento(doc.date) === 'vencido' ? 'bg-red-500' : checkVencimiento(doc.date) === 'por-vencer' ? 'bg-amber-500' : 'bg-emerald-500'}>
                    {checkVencimiento(doc.date).toUpperCase()}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <div className="lg:col-span-8">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-surface-dark border border-border-dark p-1 h-12 w-full justify-start gap-2 mb-6">
              <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-white font-bold px-6">
                <Info className="size-4 mr-2" /> Resumen Técnico
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="data-[state=active]:bg-primary data-[state=active]:text-white font-bold px-6">
                <Wrench className="size-4 mr-2" /> Mantenimientos ({mantenimientos?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="inspections" className="data-[state=active]:bg-primary data-[state=active]:text-white font-bold px-6">
                <ClipboardCheck className="size-4 mr-2" /> Inspecciones ({inspecciones?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-surface-dark border-border-dark text-white">
                  <CardHeader><CardTitle className="text-sm font-black uppercase">Detalle del Motor y Chasis</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><p className="text-[10px] text-text-secondary font-bold uppercase">Nro Motor</p><p className="font-mono text-sm">{vehicle.numeroMotor}</p></div>
                      <div><p className="text-[10px] text-text-secondary font-bold uppercase">Nro VIN / Chasis</p><p className="font-mono text-sm">{vehicle.vin}</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><p className="text-[10px] text-text-secondary font-bold uppercase">Carrocería</p><p className="text-sm">{vehicle.carroceria}</p></div>
                      <div><p className="text-[10px] text-text-secondary font-bold uppercase">Modelo (Año)</p><p className="text-sm">{vehicle.modelo}</p></div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-surface-dark border-border-dark text-white">
                  <CardHeader><CardTitle className="text-sm font-black uppercase">Uso y Exposición</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                        <Activity className="size-5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-text-secondary font-bold uppercase">Kilometraje Promedio Mes</p>
                        <p className="text-lg font-black">{vehicle.kilometrajeMensualEstimado} km</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-border-dark">
                      <p className="text-xs text-text-secondary italic">Última actualización de datos: {vehicle.fechaRegistro?.split('T')[0]}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="maintenance" className="mt-0">
              <Card className="bg-surface-dark border-border-dark">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border-dark hover:bg-transparent">
                        <TableHead className="text-[10px] font-black uppercase text-text-secondary">Fecha</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-text-secondary">Tipo / Descripción</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-text-secondary">Taller / Responsable</TableHead>
                        <TableHead className="text-right text-[10px] font-black uppercase text-text-secondary">Costo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mantenimientos?.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center py-10 text-text-secondary italic">Sin registros de mantenimiento.</TableCell></TableRow>
                      ) : (
                        mantenimientos?.map((m: any) => (
                          <TableRow key={m.id} className="border-border-dark hover:bg-white/5">
                            <TableCell className="text-xs text-white">{m.fechaEjecucion}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <Badge className={`w-fit text-[9px] mb-1 ${m.tipo === 'Correctivo' ? 'bg-red-500' : 'bg-blue-500'}`}>{m.tipo?.toUpperCase()}</Badge>
                                <span className="text-sm font-bold text-white">{m.descripcion}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-xs text-white">{m.taller}</span>
                                <span className="text-[10px] text-text-secondary uppercase">{m.tecnicoResponsable}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono text-emerald-500 font-bold">${m.costo?.toLocaleString()}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inspections" className="mt-0">
              <Card className="bg-surface-dark border-border-dark">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border-dark hover:bg-transparent">
                        <TableHead className="text-[10px] font-black uppercase text-text-secondary">Fecha / Hora</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-text-secondary">Conductor</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-text-secondary">Kilometraje</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-text-secondary">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inspecciones?.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center py-10 text-text-secondary italic">Sin inspecciones recientes.</TableCell></TableRow>
                      ) : (
                        inspecciones?.map((i: any) => (
                          <TableRow key={i.id} className="border-border-dark hover:bg-white/5">
                            <TableCell className="text-xs text-white font-mono">{i.fechaHora?.replace('T', ' ')}</TableCell>
                            <TableCell className="text-sm text-white font-bold">{i.conductorId}</TableCell>
                            <TableCell className="text-xs text-text-secondary">{i.kilometraje?.toLocaleString()} km</TableCell>
                            <TableCell>
                              <Badge className={i.aprobadoParaCircular ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}>
                                {i.aprobadoParaCircular ? 'APTO' : 'NO APTO'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
