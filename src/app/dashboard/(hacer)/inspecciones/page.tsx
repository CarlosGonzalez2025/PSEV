'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ClipboardCheck, Plus, CheckCircle2, XCircle, AlertCircle,
  Search, Printer, Check, X, ShieldAlert, ShieldCheck, ShieldX,
  FileText, PenTool
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { toast } from '@/hooks/use-toast';
import {
  DEFAULT_INSPECTION_TEMPLATE_KEY,
  INSPECTION_MODULE_CONFIG,
  resolveInspectionTemplate,
  resolveInspectionVehicle,
  supportsInspectionType,
} from '@/lib/inspection-config';

import { inspectionFormSchema, InspectionFormValues } from './schema';
import { TipoVehiculo } from '@/types/inspeccion';

import { SegmentoDocumental } from './components/SegmentoDocumental';
import { SegmentoSeguridadActiva } from './components/SegmentoSeguridadActiva';
import { SegmentoSeguridadPasiva } from './components/SegmentoSeguridadPasiva';
import { SegmentoIluminacion } from './components/SegmentoIluminacion';
import { SegmentoKitCarretera } from './components/SegmentoKitCarretera';
import { SegmentoCarroceria } from './components/SegmentoCarroceria';
import { SegmentosEspecificos } from './components/SegmentosEspecificos';

// ── Logic helpers ──────────────────────────────────────────

interface HallazgoData {
  segmento: string;
  item: string;
  descripcion: string;
  critico: boolean;
  bloqueante: boolean;
  accionInmediata?: string;
  responsable?: string;
}

function processInspectionValues(values: InspectionFormValues, tipoVehiculo: TipoVehiculo) {
  const hallazgos: HallazgoData[] = [];
  let bloqueantes = 0;
  let criticos = 0;

  const registrarHallazgo = (segmento: string, item: string, descripcion: string, bloqueante: boolean = false) => {
    hallazgos.push({ segmento, item, descripcion, critico: bloqueante, bloqueante });
    if (bloqueante) bloqueantes++;
    if (bloqueante) criticos++;
  };

  // Bloqueos Automáticos Resolución 40595
  if (!values.documental?.soat || !values.documental?.licencia) {
    registrarHallazgo('Documental', 'Documentos Mandatorios', 'SOAT o Licencia no válidos/vencidos', true);
  }

  if (values.seguridadActiva?.frenos.servicio === 'Malo' || values.seguridadActiva?.frenos.fugas === false) {
    registrarHallazgo('Seguridad Activa', 'Sistema de Frenos', 'Falla crítica / fugas en sistema de frenos', true);
  }

  if (values.seguridadActiva?.llantas.labrado === 'Liso') {
    registrarHallazgo('Seguridad Activa', 'Llantas / Rines', 'Labrado de llantas por debajo del límite seguro (Lisas)', true);
  }

  if (values.seguridadActiva?.motor.sinFugas === false) {
    registrarHallazgo('Seguridad Activa', 'Motor', 'Fugas de fluidos evidentes en el compartimiento del motor', true);
  }

  if (values.iluminacion?.stop === 'No funciona') {
    registrarHallazgo('Iluminación', 'Stop TR', 'Luz de stop trasero no funciona', true);
  }

  if (!values.kitCarretera?.extintor) {
    registrarHallazgo('Kit de Carretera', 'Extintor', 'Extintor ausente, despresurizado o vencido', true);
  }

  if (['MAQUINARIA', 'MINICARGADOR'].includes(tipoVehiculo) && values.seguridadPasiva?.rops === 'Malo') {
    registrarHallazgo('Seguridad Pasiva', 'ROPS', 'Estructura ROPS averiada en equipo autopropulsado', true);
  }

  // Hallazgos no bloqueantes (Observaciones)
  // Recursivamente podemos detectar valores 'Malo' o 'No funciona' para otras observaciones menores
  const scanObj = (obj: any, parent: string) => {
    if (!obj || typeof obj !== 'object') return;
    Object.entries(obj).forEach(([k, v]) => {
      if (typeof v === 'object' && v !== null) scanObj(v, k);
      else if (v === 'Malo' || v === 'No funciona' || v === 'Roto' || v === 'Faltan' || v === 'Sueltas') {
        const hKey = `${parent} -> ${k}`;
        // Para no duplicar alertas bloqueantes
        if (!hallazgos.some(h => h.item.includes(hKey) || h.descripcion.includes(v as string))) {
          hallazgos.push({ segmento: 'Inspección', item: hKey, descripcion: `Condición anormal: ${v}`, critico: false, bloqueante: false });
        }
      }
    });
  }
  scanObj(values, 'Formulario');

  const aprobadoParaCircular = bloqueantes === 0;
  const resultadoFinal = aprobadoParaCircular ? (hallazgos.length > 0 ? 'apto_con_observaciones' : 'apto') : 'no_apto';

  return { hallazgos, bloqueantes, criticos, aprobadoParaCircular, resultadoFinal };
}

// ── Form schema base defaults ──────────────────────────────
const defaultValues: Partial<InspectionFormValues> = {
  vehiculoId: '', conductorId: '', tipoInspeccion: 'preoperacional',
  kilometraje: 0, sede: '', operacion: '', observacionGeneral: '', declaracionJurada: false,
  documental: {
    tarjetaPropiedad: true, soat: true, soatVencimiento: '', rtm: true, rtmVencimiento: '',
    polizaRC: true, polizaRCVencimiento: '', licencia: true, licenciaCategoria: ''
  },
  seguridadActiva: {
    frenos: { servicio: 'Bueno', parqueo: 'Bueno', nivelLiquido: 'OK', fugas: true, pastillas: 'Bueno' },
    direccion: { juegoVolante: 'Bueno', nivelAceite: 'OK', fugas: true, terminales: 'Bueno', columna: 'Bueno' },
    suspension: { amortDelantero: 'Bueno', amortTrasero: 'Bueno', muelles: 'Bueno', bujes: 'Bueno' },
    llantas: { presionDI: 30, presionDD: 30, presionTI: 30, presionTD: 30, repuesto: 'OK', labrado: 'Bueno', sinDanios: true, tuercas: 'Bueno', rines: 'Bueno' },
    motor: { nivelAceite: 'OK', nivelRefrigerante: 'OK', nivelTransmision: 'OK', sinFugas: true, correas: 'Bueno', sinRuidos: true, humoEscape: 'Normal', filtroAire: 'Bueno' },
    electrico: { bateria: 'Bueno', testigos: 'Normal', velocimetro: 'Funciona', manometroAceite: 'Funciona', indicadorTemp: 'Normal' }
  },
  seguridadPasiva: {
    cinturonConductor: 'Bueno', parabrisas: 'Bueno', vidrios: 'Bueno', espejos: 'Completos y ajustados'
  },
  iluminacion: {
    lucesLow: 'Funciona', lucesHigh: 'Funciona', posDelantero: 'Funciona', stop: 'Funciona', reversa: 'Funciona', direccionales: 'Funciona', emergencia4V: 'Funciona', placa: 'Funciona', bocina: 'Funciona', limpiaparabrisas: 'Bueno'
  },
  kitCarretera: {
    extintor: true, extintorVencimiento: '', botiquin: true, botiquinVencimiento: '', conos: 2, chaleco: true, linterna: true, herramientas: true
  },
  carroceria: {
    puertas: 'Bueno', chasis: 'Bueno', guardafangos: 'Bueno', tanqueCombustible: 'Bueno', nivelCombustible: 100, escape: 'Bueno'
  }
};


// ── Component ──────────────────────────────────────────────

export default function InspeccionesPage() {
  const firestore = useFirestore();
  const { profile, user } = useUser();
  const [open, setOpen] = useState(false);
  const [selectedVehicleType, setSelectedVehicleType] = useState<TipoVehiculo>('LIVIANO');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState(DEFAULT_INSPECTION_TEMPLATE_KEY);
  const [isSaving, setIsSaving] = useState(false);

  // Data fetching
  const inspeccionesRef = useMemoFirebase(() => {
    if (!firestore || !profile?.empresaId) return null;
    return query(
      collection(firestore, 'empresas', profile.empresaId, 'inspeccionesPreoperacionales'),
      orderBy('fechaHora', 'desc'),
      limit(50),
    );
  }, [firestore, profile?.empresaId]);
  const { data: inspecciones, isLoading } = useCollection(inspeccionesRef);

  const vehiculosRef = useMemoFirebase(() => {
    if (!firestore || !profile?.empresaId) return null;
    return query(collection(firestore, 'empresas', profile.empresaId, 'vehiculos'));
  }, [firestore, profile?.empresaId]);
  const { data: vehiculos } = useCollection(vehiculosRef);

  const conductoresRef = useMemoFirebase(() => {
    if (!firestore || !profile?.empresaId) return null;
    return query(collection(firestore, 'empresas', profile.empresaId, 'conductores'));
  }, [firestore, profile?.empresaId]);
  const { data: conductores } = useCollection(conductoresRef);

  const form = useForm<InspectionFormValues>({
    resolver: zodResolver(inspectionFormSchema),
    defaultValues: defaultValues as any,
  });

  const watchVehiculo = form.watch('vehiculoId');
  const selectedInspectionTemplate = useMemo(
    () => resolveInspectionTemplate(selectedTemplateKey),
    [selectedTemplateKey]
  );

  useEffect(() => {
    const vehiculoSeleccionado = vehiculos?.find(v => v.placa === watchVehiculo);
    const resolvedVehicle = resolveInspectionVehicle(vehiculoSeleccionado?.tipoVehiculo, 'LIVIANO');

    setSelectedVehicleType(resolvedVehicle.internalType);
    setSelectedTemplateKey(resolvedVehicle.templateKey);
    return;

    if (watchVehiculo && vehiculos) {
      const v = vehiculos.find(v => v.placa === watchVehiculo);
      if (v) {
        const type = v.tipoVehiculo || "";
        const lowerType = type.toLowerCase();

        if (lowerType.includes('moto')) setSelectedVehicleType('MOTO');
        else if (lowerType.includes('tracto')) setSelectedVehicleType('TRACTO');
        else if (lowerType.includes('buseta') || lowerType.includes('bus')) setSelectedVehicleType('BUS');
        else if (lowerType.includes('micro')) setSelectedVehicleType('MINIBUS');
        else if (lowerType.includes('furgon') || lowerType.includes('van')) setSelectedVehicleType('FURGON');
        else if (lowerType.includes('rígido') || lowerType.includes('rigido') || lowerType.includes('volqueta')) setSelectedVehicleType('CAMION');
        else if (lowerType.includes('maquinaria') || lowerType.includes('amarilla')) setSelectedVehicleType('MAQUINARIA');
        else if (lowerType.includes('mini')) setSelectedVehicleType('MINICARGADOR');
        else if (lowerType.includes('ambulancia')) setSelectedVehicleType('AMBULANCIA');
        else if (lowerType.includes('grua') || lowerType.includes('izaje')) setSelectedVehicleType('GRUA');
        else if (lowerType.includes('golf') || lowerType.includes('electro')) setSelectedVehicleType('GOLF');
        else setSelectedVehicleType('LIVIANO'); // Fallback
      }
    }
  }, [watchVehiculo, vehiculos]);


  // ── Submit ─────────────────────────────────────────────

  async function onSubmit(values: InspectionFormValues) {
    if (!firestore || !profile?.empresaId || !user) return;

    setIsSaving(true);
    try {
      const colRef = collection(firestore, 'empresas', profile.empresaId, 'inspeccionesPreoperacionales');
      const vehiculo = vehiculos?.find(v => v.placa === values.vehiculoId);
      const conductor = conductores?.find(c => c.id === values.conductorId);
      const resolvedVehicle = resolveInspectionVehicle(vehiculo?.tipoVehiculo, selectedVehicleType);
      const inspectionTemplate = resolveInspectionTemplate(resolvedVehicle.templateKey);

      if (!supportsInspectionType(inspectionTemplate, values.tipoInspeccion)) {
        toast({
          variant: 'destructive',
          title: 'Plantilla no compatible',
          description: `La plantilla ${resolvedVehicle.templateKey} no permite inspecciones de tipo ${values.tipoInspeccion}.`,
        });
        return;
      }

      const { hallazgos, bloqueantes, criticos, aprobadoParaCircular, resultadoFinal } = processInspectionValues(values, selectedVehicleType);
      const fechaHora = new Date().toISOString();
      const [fecha, horaCompleta = ''] = fechaHora.split('T');
      const hora = horaCompleta.slice(0, 8);
      const consecutivo = `INSP-${Date.now().toString().slice(-6)}`;

      await addDocumentNonBlocking(colRef, {
        ...values,
        id_inspeccion: consecutivo,
        empresaId: profile.empresaId,
        placa: values.vehiculoId,
        tipo_vehiculo: selectedVehicleType,
        subtipo_vehiculo: vehiculo?.tipoVehiculo ?? '',
        nombre_conductor: conductor?.nombreCompleto ?? values.conductorId,
        documento_conductor: conductor?.numeroDocumento ?? '',
        inspector_id: user.uid,
        nombre_inspector: user.displayName ?? user.email,
        moduloOrigen: INSPECTION_MODULE_CONFIG.modulo,
        plantillaClave: resolvedVehicle.templateKey,
        plantillaVersion: INSPECTION_MODULE_CONFIG.version,
        referencia_normativa: inspectionTemplate?.referencia_normativa ?? [],
        resultado_final: resultadoFinal,
        aprobadoParaCircular,
        hallazgos,
        bloqueantes,
        criticos,
        // Legacy compat fields
        vehiculoId: values.vehiculoId,
        conductorId: conductor?.id ?? values.conductorId,
        tipoVehiculoEvaluado: selectedVehicleType,
        estadoGeneral: resultadoFinal === 'apto' ? 'Conforme' : 'No Conforme',
        consecutivo,
        fechaHora,
        fecha,
        hora,
        proyecto: values.operacion || '',
        ubicacion: values.sede,
        traceability: { creadoPor: user.email, timestamp: serverTimestamp() },
      });

      const msgMap: Record<string, { variant: 'default' | 'destructive'; title: string; desc: string }> = {
        apto: { variant: 'default', title: '✅ Vehículo APTO', desc: 'Todos los criterios superados. Apto para operar.' },
        apto_con_observaciones: { variant: 'default', title: '⚠️ APTO con observaciones', desc: `${hallazgos.length} hallazgo(s) registrado(s). Vehículo puede operar.` },
        no_apto: { variant: 'destructive', title: '🚫 Vehículo NO APTO', desc: `Falla bloqueante detectada. Vehículo fuera de servicio.` },
      };

      const msg = msgMap[resultadoFinal];
      toast({ variant: msg.variant, title: msg.title, description: msg.desc });

      setOpen(false);
      form.reset(defaultValues as any);
    } catch (e) {
      console.error("Save err:", e);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la inspección. ' + (e as any).message });
    } finally {
      setIsSaving(false);
    }
  }

  // ── KPIs ─────────────────────────────────────────
  const kpiApto = inspecciones?.filter(i => i.resultado_final === 'apto' || i.aprobadoParaCircular === true).length ?? 0;
  const kpiNoApto = inspecciones?.filter(i => i.resultado_final === 'no_apto' || i.aprobadoParaCircular === false).length ?? 0;
  const kpiObs = inspecciones?.filter(i => i.resultado_final === 'apto_con_observaciones').length ?? 0;

  // ── Badge helper ───────────────────────────────────────
  const resultadoBadge = (i: any) => {
    const r = i.resultado_final;
    if (r === 'apto' || (!r && i.aprobadoParaCircular === true))
      return <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[9px] font-black px-3">APTO</Badge>;
    if (r === 'apto_con_observaciones')
      return <Badge className="bg-amber-500/10 text-amber-400 border-none text-[9px] font-black px-3">OBSERVACIONES</Badge>;
    return <Badge className="bg-red-500/10 text-red-400 border-none text-[9px] font-black px-3">NO APTO</Badge>;
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight uppercase italic">Inspecciones Vehiculares (Paso 16)</h1>
          <p className="text-text-secondary mt-1 text-sm font-bold uppercase tracking-widest">Checklist Granular por Criterio — Res. 40595 · PESV Colombia</p>
        </div>

        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { form.reset(defaultValues as any); } }}>
          <DialogTrigger asChild>
            <Button className="font-black bg-primary uppercase h-11 px-8 shadow-lg shadow-primary/20 italic">
              <Plus className="size-5 mr-2" /> Nueva Inspección
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-5xl max-h-[95vh] bg-surface-dark border-border-dark text-foreground p-0 overflow-hidden flex flex-col">
            <DialogHeader className="p-6 bg-primary/10 border-b border-border-dark shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <DialogTitle className="text-xl font-black uppercase italic text-foreground flex items-center gap-2">
                    <ClipboardCheck className="size-6 text-primary" /> Inspección Reglamentaria
                  </DialogTitle>
                  <DialogDescription className="text-text-secondary font-bold text-[10px] uppercase">
                    Norma Dinámica Aplicada para: {selectedVehicleType}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit, (err) => {
                console.warn(err);
                toast({ variant: 'destructive', title: 'Errores de validación', description: 'Por favor complete todos los datos requeridos en rojo.' });
              })} className="flex flex-col h-full overflow-hidden">
                <div className="p-6 flex-1 overflow-y-auto space-y-8 bg-background-dark/20 custom-scrollbar">

                  {/* ── Header fields ── */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <FormField control={form.control} name="vehiculoId" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black text-text-secondary uppercase">Vehículo *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger className="bg-background-dark border-border-dark h-10"><SelectValue placeholder="Seleccione placa" /></SelectTrigger></FormControl>
                          <SelectContent className="bg-surface-dark border-border-dark text-foreground">
                            {vehiculos?.map(v => <SelectItem key={v.id} value={v.placa}>{v.placa} — {v.marca} {v.modelo}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="conductorId" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black text-text-secondary uppercase">Conductor *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger className="bg-background-dark border-border-dark h-10"><SelectValue placeholder="Conductor" /></SelectTrigger></FormControl>
                          <SelectContent className="bg-surface-dark border-border-dark text-foreground">
                            {conductores?.map(c => <SelectItem key={c.id} value={c.id}>{c.nombreCompleto}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="tipoInspeccion" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black text-text-secondary uppercase">Tipo Inspección</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger className="bg-background-dark border-border-dark h-10"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent className="bg-surface-dark border-border-dark text-foreground">
                            <SelectItem value="preoperacional">Preoperacional</SelectItem>
                            <SelectItem value="periodica">Periódica</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="kilometraje" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black text-text-secondary uppercase">Odómetro (km)</FormLabel>
                        <FormControl><Input type="number" {...field} className="bg-background-dark border-border-dark h-10" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="sede" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black text-text-secondary uppercase">Sede / Ubicación *</FormLabel>
                        <FormControl><Input {...field} placeholder="Ej: Planta Bogotá" className="bg-background-dark border-border-dark h-10" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="operacion" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black text-text-secondary uppercase">Operación / Proyecto</FormLabel>
                        <FormControl><Input {...field} placeholder="Ej: Ruta Norte" className="bg-background-dark border-border-dark h-10" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  {/* ── Segmentos modulares ── */}
                  <div className="space-y-6">
                    <SegmentoDocumental form={form} tipoVehiculo={selectedVehicleType} />
                    <SegmentoSeguridadActiva form={form} tipoVehiculo={selectedVehicleType} />
                    <SegmentoSeguridadPasiva form={form} tipoVehiculo={selectedVehicleType} />
                    <SegmentoIluminacion form={form} tipoVehiculo={selectedVehicleType} />
                    <SegmentoKitCarretera form={form} tipoVehiculo={selectedVehicleType} />
                    <SegmentoCarroceria form={form} tipoVehiculo={selectedVehicleType} />
                    <SegmentosEspecificos form={form} tipoVehiculo={selectedVehicleType} />
                  </div>

                  {/* ── Observación general ── */}
                  <FormField control={form.control} name="observacionGeneral" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black text-text-secondary uppercase">Observaciones Generales</FormLabel>
                      <FormControl><Textarea {...field} rows={2} placeholder="Notas adicionales de la inspección..." className="bg-background-dark border-border-dark resize-none text-[11px]" /></FormControl>
                    </FormItem>
                  )} />

                  {/* ── Declaración jurada ── */}
                  <div className="space-y-4 pt-2 bg-primary/5 p-5 rounded-2xl border border-primary/20">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] text-center italic">Declaración de Responsabilidad Legal</p>
                    <div className="h-24 border-2 border-dashed border-primary/20 rounded-xl flex flex-col items-center justify-center bg-background-dark/50 mb-3">
                      <PenTool className="size-5 text-primary/40 mb-1" />
                      <span className="text-[9px] font-black text-text-secondary uppercase italic">Espacio para firma digital del responsable</span>
                      <span className="text-[8px] font-bold text-text-secondary/60 mt-1 uppercase">Inspector: {user?.email}</span>
                    </div>
                    <FormField control={form.control} name="declaracionJurada" render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 bg-background-dark/30 p-3 rounded-lg border border-white/5">
                        <FormControl>
                          <input type="checkbox" checked={field.value} onChange={field.onChange} className="size-5 mt-0.5 accent-primary cursor-pointer" />
                        </FormControl>
                        <div>
                          <FormLabel className="text-[10px] font-bold text-text-secondary leading-tight uppercase italic cursor-pointer">
                            Certifico que he inspeccionado físicamente los elementos declarados y que el estado reportado corresponde a la realidad del vehículo en la fecha y hora de este registro.
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )} />
                  </div>
                </div>

                {/* ── Footer ── */}
                <div className="p-5 border-t border-border-dark bg-background-dark/80 backdrop-blur-md shrink-0">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="w-full bg-primary font-black uppercase h-12 shadow-2xl shadow-primary/30 italic text-sm tracking-widest rounded-xl hover:scale-[1.01] transition-transform active:scale-95"
                  >
                    {isSaving ? 'Evaluando bloqueos y Guardando...' : 'Finalizar Inspección (Algoritmo de Bloqueo)'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-surface-dark border-border-dark">
          <CardHeader className="pb-2 pt-4 px-4 text-[10px] font-black text-text-secondary uppercase tracking-widest">Total Inspecciones</CardHeader>
          <CardContent className="px-4 pb-4"><div className="text-3xl font-black text-foreground italic">{inspecciones?.length ?? 0}</div></CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2 pt-4 px-4 text-[10px] font-black text-emerald-500 uppercase tracking-widest">Aptos</CardHeader>
          <CardContent className="px-4 pb-4"><div className="text-3xl font-black text-emerald-400 italic">{kpiApto}</div></CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark border-l-4 border-l-amber-500">
          <CardHeader className="pb-2 pt-4 px-4 text-[10px] font-black text-amber-400 uppercase tracking-widest">Con observaciones</CardHeader>
          <CardContent className="px-4 pb-4"><div className="text-3xl font-black text-amber-400 italic">{kpiObs}</div></CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark border-l-4 border-l-red-500">
          <CardHeader className="pb-2 pt-4 px-4 text-[10px] font-black text-red-500 uppercase tracking-widest">No Aptos</CardHeader>
          <CardContent className="px-4 pb-4"><div className="text-3xl font-black text-red-500 italic">{kpiNoApto}</div></CardContent>
        </Card>
      </div>

      {/* Bitácora */}
      <Card className="bg-surface-dark border-border-dark overflow-hidden shadow-2xl">
        <CardHeader className="border-b border-white/5 bg-white/[0.02] flex flex-row items-center justify-between p-6">
          <div>
            <CardTitle className="text-lg font-black uppercase text-foreground italic">Bitácora de Inspecciones</CardTitle>
            <CardDescription className="text-text-secondary text-[10px] font-bold uppercase tracking-tighter">Evidencia Digital — Res. 40595 / Paso 16</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="text-[10px] font-black uppercase border-white/10 gap-2 h-9 italic text-primary border-primary/20">
              <Search className="size-3" /> Filtrar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border-dark bg-white/5">
                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 pl-6">Consecutivo</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Vehículo / Tipo</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Conductor</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Tipo insp.</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 text-center">Resultado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="py-20 text-center"><Skeleton className="h-10 w-full max-w-2xl mx-auto bg-white/5 rounded-xl" /></TableCell></TableRow>
              ) : (inspecciones ?? []).length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-20 text-center text-text-secondary text-xs font-bold uppercase">No hay inspecciones registradas aún.</TableCell></TableRow>
              ) : (inspecciones ?? []).map(i => (
                <TableRow key={i.id} className="border-border-dark hover:bg-white/[0.03] transition-colors">
                  <TableCell className="pl-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-foreground italic">{i.consecutivo}</span>
                      <span className="text-[9px] font-bold text-text-secondary uppercase">{new Date(i.fechaHora).toLocaleString('es-CO')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-foreground tracking-widest">{i.vehiculoId ?? i.placa}</span>
                      <span className="text-[9px] font-black text-primary uppercase italic">{i.tipoVehiculoEvaluado ?? i.tipo_vehiculo}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-foreground max-w-[150px] truncate">{i.nombre_conductor || i.conductorId}</span>
                      <span className="text-[9px] font-bold text-text-secondary uppercase truncate">ID: {i.documento_conductor || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-foreground capitalize">{i.tipoInspeccion}</span>
                      <span className="text-[9px] font-bold text-text-secondary uppercase">{i.kilometraje} KM</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {resultadoBadge(i)}
                    {Array.isArray(i.hallazgos) && i.hallazgos.length > 0 && (
                      <div className="mt-1 text-[8px] font-bold text-red-400">
                        {i.bloqueantes ? `${i.bloqueantes} BLOQUEANTES` : `${i.hallazgos.length} HALLAZGOS`}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
