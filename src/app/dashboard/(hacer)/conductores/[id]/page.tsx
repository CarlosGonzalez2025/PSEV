'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, query, where, orderBy } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  IdCard,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  Star,
  ClipboardList,
  User,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function InfoRow({ label, value, highlight }: { label: string; value?: string | number | null; highlight?: string }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
      <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-bold ${highlight || 'text-white'}`}>{value || '—'}</span>
    </div>
  );
}

export default function ConductorHojaVidaPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const firestore = useFirestore();
  const { profile } = useUser();

  const conductorRef = useMemoFirebase(() => {
    if (!firestore || !profile?.empresaId || !params.id) return null;
    return doc(firestore, 'empresas', profile.empresaId, 'conductores', params.id);
  }, [firestore, profile?.empresaId, params.id]);

  const { data: conductor, isLoading } = useDoc(conductorRef);

  const inspeccionesRef = useMemoFirebase(() => {
    if (!firestore || !profile?.empresaId || !conductor?.nombreCompleto) return null;
    return query(
      collection(firestore, 'empresas', profile.empresaId, 'inspecciones'),
      where('conductorId', '==', conductor.nombreCompleto),
      orderBy('fechaInspeccion', 'desc')
    );
  }, [firestore, profile?.empresaId, conductor?.nombreCompleto]);

  const { data: inspecciones } = useCollection(inspeccionesRef);

  const score = conductor?.scoringVial || 0;
  const licVence = conductor?.fechaVencimientoLicencia;
  const licExpired = licVence ? new Date(licVence) < new Date() : false;

  const scoreColor = score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-destructive';
  const scoreBarColor = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-destructive';

  const statsInspecciones = useMemo(() => {
    if (!inspecciones) return { total: 0, aptas: 0, noAptas: 0 };
    const aptas = inspecciones.filter(i => i.resultado_final === 'apto' || i.estadoGeneral === 'Aprobado').length;
    const noAptas = inspecciones.filter(i => i.resultado_final === 'no_apto' || i.estadoGeneral === 'No Aprobado').length;
    return { total: inspecciones.length, aptas, noAptas };
  }, [inspecciones]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!conductor) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle className="size-12 text-text-secondary" />
        <p className="text-text-secondary">Colaborador no encontrado.</p>
        <Button variant="outline" onClick={() => router.back()}>Volver</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-text-secondary hover:text-white">
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-white uppercase italic tracking-tight">{conductor.nombreCompleto}</h1>
          <p className="text-text-secondary text-sm">Hoja de Vida Vial — CC {conductor.cedula}</p>
        </div>
        <Badge className={licExpired ? 'bg-destructive/10 text-destructive border-none' : 'bg-emerald-500/10 text-emerald-500 border-none'}>
          {licExpired ? <><ShieldX className="size-3 mr-1" />Bloqueado</> : <><ShieldCheck className="size-3 mr-1" />Operativo</>}
        </Badge>
      </div>

      {/* Score + quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-surface-dark border-border-dark md:col-span-1 flex flex-col items-center justify-center py-6">
          <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2">Smart Scoring</p>
          <span className={`text-5xl font-black ${scoreColor}`}>{score}</span>
          <span className="text-text-secondary text-xs mt-1">/100</span>
          <Progress value={score} className="w-24 h-1.5 bg-white/5 mt-3" indicatorClassName={scoreBarColor} />
        </Card>
        <Card className="bg-surface-dark border-border-dark">
          <CardHeader className="pb-2"><p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Inspecciones</p></CardHeader>
          <CardContent><div className="text-3xl font-black text-white">{statsInspecciones.total}</div></CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark">
          <CardHeader className="pb-2"><p className="text-[10px] font-black text-text-secondary uppercase tracking-widest text-emerald-500">Aptas</p></CardHeader>
          <CardContent><div className="text-3xl font-black text-emerald-500">{statsInspecciones.aptas}</div></CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark">
          <CardHeader className="pb-2"><p className="text-[10px] font-black text-text-secondary uppercase tracking-widest text-destructive">No Aptas</p></CardHeader>
          <CardContent><div className="text-3xl font-black text-destructive">{statsInspecciones.noAptas}</div></CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="perfil">
        <TabsList className="bg-surface-dark border border-border-dark">
          <TabsTrigger value="perfil" className="gap-2"><User className="size-3.5" /> Perfil</TabsTrigger>
          <TabsTrigger value="documentos" className="gap-2"><IdCard className="size-3.5" /> Documentos</TabsTrigger>
          <TabsTrigger value="inspecciones" className="gap-2"><ClipboardList className="size-3.5" /> Inspecciones</TabsTrigger>
          <TabsTrigger value="scoring" className="gap-2"><Star className="size-3.5" /> Scoring Vial</TabsTrigger>
        </TabsList>

        {/* Perfil */}
        <TabsContent value="perfil">
          <Card className="bg-surface-dark border-border-dark">
            <CardContent className="pt-6 divide-y divide-white/5">
              <InfoRow label="Nombre Completo" value={conductor.nombreCompleto} />
              <InfoRow label="Cédula / ID" value={conductor.cedula} />
              <InfoRow label="Rol en la Vía" value={conductor.rolEnLaVia} highlight="text-primary" />
              <InfoRow label="Tipo de Contrato" value={conductor.tipoContrato} />
              <InfoRow label="Inscripción RUNT" value={conductor.inscripcionRUNT ? 'Registrado' : 'No registrado'} highlight={conductor.inscripcionRUNT ? 'text-emerald-500' : 'text-destructive'} />
              <InfoRow label="Estado" value={conductor.estado || 'Activo'} highlight="text-emerald-500" />
              <InfoRow label="Restricciones Médicas" value={conductor.restriccionesMedicas || 'Ninguna'} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documentos */}
        <TabsContent value="documentos">
          <Card className="bg-surface-dark border-border-dark">
            <CardContent className="pt-6 divide-y divide-white/5">
              <InfoRow label="Categoría de Licencia" value={conductor.categoriaLicencia} highlight="text-primary" />
              <InfoRow
                label="Vencimiento de Licencia"
                value={licVence || 'No registrado'}
                highlight={licExpired ? 'text-destructive' : 'text-emerald-500'}
              />
              <InfoRow label="Fecha Examen Médico" value={conductor.fechaExamenMedico || 'No registrado'} />
              <InfoRow label="Estado Médico" value="Apto" highlight="text-emerald-500" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inspecciones */}
        <TabsContent value="inspecciones">
          <Card className="bg-surface-dark border-border-dark overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border-dark bg-white/5">
                    <TableHead className="text-[10px] font-black uppercase">Fecha</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Vehículo</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Tipo</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-center">Resultado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!inspecciones || inspecciones.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-16 text-text-secondary italic">
                        Sin inspecciones registradas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    inspecciones.map(ins => {
                      const resultado = ins.resultado_final || ins.estadoGeneral;
                      const esApto = resultado === 'apto' || resultado === 'Aprobado';
                      const esNoApto = resultado === 'no_apto' || resultado === 'No Aprobado';
                      return (
                        <TableRow key={ins.id} className="border-border-dark hover:bg-white/5">
                          <TableCell className="text-sm text-white flex items-center gap-2">
                            <Calendar className="size-3.5 text-text-secondary" />
                            {ins.fechaInspeccion || '—'}
                          </TableCell>
                          <TableCell className="text-sm text-white">{ins.vehiculoId || ins.placaVehiculo || '—'}</TableCell>
                          <TableCell className="text-sm text-text-secondary capitalize">{ins.tipoInspeccion || '—'}</TableCell>
                          <TableCell className="text-center">
                            {esApto ? (
                              <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] uppercase gap-1">
                                <CheckCircle2 className="size-3" /> Apto
                              </Badge>
                            ) : esNoApto ? (
                              <Badge className="bg-destructive/10 text-destructive border-none text-[8px] uppercase gap-1">
                                <ShieldX className="size-3" /> No Apto
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-500/10 text-amber-500 border-none text-[8px] uppercase gap-1">
                                <ShieldAlert className="size-3" /> Con Obs.
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scoring Vial */}
        <TabsContent value="scoring">
          <Card className="bg-surface-dark border-border-dark">
            <CardContent className="pt-6 space-y-6">
              <div className="flex flex-col items-center gap-3 py-4">
                <span className={`text-7xl font-black ${scoreColor}`}>{score}</span>
                <span className="text-text-secondary text-sm uppercase tracking-widest">Puntaje Vial</span>
                <Progress value={score} className="w-48 h-2 bg-white/5" indicatorClassName={scoreBarColor} />
              </div>
              <div className="divide-y divide-white/5">
                <InfoRow label="Incidentes" value={conductor.incidentes ?? 0} highlight={conductor.incidentes > 0 ? 'text-destructive' : 'text-emerald-500'} />
                <InfoRow label="Multas" value={conductor.multas ?? 0} highlight={conductor.multas > 0 ? 'text-amber-500' : 'text-emerald-500'} />
                <InfoRow label="Asistencia a Capacitaciones" value={`${conductor.asistenciaCapacitaciones ?? 0}%`} highlight="text-primary" />
                <InfoRow label="Competencia Validada" value={conductor.competenciaValidada ? 'Sí' : 'No'} highlight={conductor.competenciaValidada ? 'text-emerald-500' : 'text-amber-500'} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
