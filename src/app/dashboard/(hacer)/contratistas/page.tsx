'use client';

import { useState, useMemo, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import {
  collection, query, serverTimestamp, addDoc, updateDoc,
  doc, deleteDoc, where,
} from 'firebase/firestore';
import { ExcelBulkActions } from '@/components/shared/excel-bulk-actions';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form, FormControl, FormField, FormItem,
  FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Handshake, Plus, AlertCircle, CheckCircle2, Clock,
  UserPlus, Car, Users, TrendingUp, Copy, Trash2,
  MoreVertical, Search, ArrowRight, ShieldCheck, ShieldOff,
} from 'lucide-react';

// ── SCHEMAS ──────────────────────────────────────────────────────────────
const contractorSchema = z.object({
  razonSocialONombre: z.string().min(3, 'Razón social requerida'),
  nitCedula: z.string().min(5, 'NIT / Cédula inválido'),
  tipoVinculacion: z.enum([
    'Tercerización', 'Subcontratación', 'Outsourcing',
    'Intermediación laboral', 'Flota Fidelizada',
  ]),
  obligadoImplementarPESV: z.boolean().default(false),
});

const changeSchema = z.object({
  tipoDeCambio: z.enum([
    'Nueva ruta', 'Nuevas tecnologías/vehículos',
    'Nueva legislación', 'Nuevos clientes/servicios',
  ]),
  descripcionCambio: z.string().min(10, 'Descripción detallada requerida'),
  impactoSeguridadVial: z.enum(['Crítico', 'Alto', 'Medio', 'Bajo']),
  planMitigacion: z.string().min(10, 'Plan de mitigación requerido'),
  requiereActualizarMatrizRiesgos: z.boolean().default(false),
});

type ContractorForm = z.infer<typeof contractorSchema>;
type ChangeForm = z.infer<typeof changeSchema>;

// ── HELPERS ──────────────────────────────────────────────────────────────
function semaforoDot(estado: string) {
  if (estado === 'Aprobado') return 'bg-emerald-500';
  if (estado === 'Bloqueado/Rechazado') return 'bg-destructive';
  return 'bg-amber-500';
}

function estadoBadge(estado: string) {
  if (estado === 'Aprobado')
    return (
      <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] uppercase tracking-widest gap-1">
        <CheckCircle2 className="size-3" /> Operativo
      </Badge>
    );
  if (estado === 'Bloqueado/Rechazado')
    return (
      <Badge className="bg-destructive/10 text-destructive border-none text-[8px] uppercase tracking-widest gap-1">
        <AlertCircle className="size-3" /> Bloqueado
      </Badge>
    );
  return (
    <Badge className="bg-amber-500/10 text-amber-500 border-none text-[8px] uppercase tracking-widest gap-1">
      <Clock className="size-3" /> En Revisión
    </Badge>
  );
}

function impactoBadge(impacto: string): ReactNode {
  const cls: Record<string, string> = {
    Crítico: 'bg-purple-500/10 text-purple-400',
    Alto: 'bg-destructive/10 text-destructive',
    Medio: 'bg-amber-500/10 text-amber-500',
    Bajo: 'bg-emerald-500/10 text-emerald-500',
  };
  return (
    <Badge className={cn('border-none text-[8px] uppercase tracking-widest', cls[impacto] ?? cls['Bajo'])}>
      {impacto}
    </Badge>
  );
}

// ── PAGE ──────────────────────────────────────────────────────────────────
export default function ContratistasPage() {
  const firestore = useFirestore();
  const { profile } = useUser();

  const [search, setSearch] = useState('');
  const [isAddContractorOpen, setIsAddContractorOpen] = useState(false);
  const [isAddChangeOpen, setIsAddChangeOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── QUERIES ──────────────────────────────────────────────────────────
  const contratistasRef = useMemoFirebase(() => {
    if (!firestore || !profile?.empresaId) return null;
    return query(
      collection(firestore, 'contratistas'),
      where('empresaId', '==', profile.empresaId),
    );
  }, [firestore, profile?.empresaId]);
  const { data: rawContratistas, isLoading: loadingContratistas } = useCollection(contratistasRef);

  const cambiosRef = useMemoFirebase(() => {
    if (!firestore || !profile?.empresaId) return null;
    return query(
      collection(firestore, 'gestionCambiosViales'),
      where('empresaId', '==', profile.empresaId),
    );
  }, [firestore, profile?.empresaId]);
  const { data: rawCambios, isLoading: loadingCambios } = useCollection(cambiosRef);

  // ── CLIENT-SIDE SORT & FILTER ─────────────────────────────────────────
  const contratistas = useMemo(() => {
    if (!rawContratistas) return [];
    const sorted = [...rawContratistas].sort((a, b) =>
      String(a.razonSocialONombre ?? '').localeCompare(String(b.razonSocialONombre ?? '')),
    );
    if (!search.trim()) return sorted;
    const q = search.toLowerCase();
    return sorted.filter(
      c =>
        String(c.razonSocialONombre ?? '').toLowerCase().includes(q) ||
        String(c.nitCedula ?? '').toLowerCase().includes(q),
    );
  }, [rawContratistas, search]);

  const cambios = useMemo(() => {
    if (!rawCambios) return [];
    return [...rawCambios].sort((a, b) => {
      const ta = (a.creadoEn as { toDate?: () => Date } | null)?.toDate?.()?.getTime() ?? 0;
      const tb = (b.creadoEn as { toDate?: () => Date } | null)?.toDate?.()?.getTime() ?? 0;
      return tb - ta;
    });
  }, [rawCambios]);

  // ── COMPUTED STATS ────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const all = rawContratistas ?? [];
    const total = all.length;
    const aprobados = all.filter(c => c.estadoAprobacionGeneral === 'Aprobado').length;
    const bloqueados = all.filter(c => c.estadoAprobacionGeneral === 'Bloqueado/Rechazado').length;
    const tasa = total > 0 ? Math.round((aprobados / total) * 100) : 0;
    return { total, aprobados, bloqueados, revision: total - aprobados - bloqueados, tasa };
  }, [rawContratistas]);

  const kanban = useMemo(() => ({
    pendiente: cambios.filter(c => c.estado === 'Pendiente'),
    enCurso: cambios.filter(c => c.estado === 'En curso'),
    cerrado: cambios.filter(c => c.estado === 'Cerrado'),
  }), [cambios]);

  // ── FORMS ─────────────────────────────────────────────────────────────
  const contractorForm = useForm<ContractorForm>({
    resolver: zodResolver(contractorSchema),
    defaultValues: {
      razonSocialONombre: '',
      nitCedula: '',
      tipoVinculacion: 'Flota Fidelizada',
      obligadoImplementarPESV: false,
    },
  });

  const changeForm = useForm<ChangeForm>({
    resolver: zodResolver(changeSchema),
    defaultValues: {
      tipoDeCambio: 'Nueva ruta',
      descripcionCambio: '',
      impactoSeguridadVial: 'Bajo',
      planMitigacion: '',
      requiereActualizarMatrizRiesgos: false,
    },
  });

  // ── ACTIONS ───────────────────────────────────────────────────────────
  async function onContractorSubmit(values: ContractorForm) {
    if (!firestore || !profile?.empresaId) return;
    try {
      const token = Math.random().toString(36).substring(2, 18);
      await addDoc(collection(firestore, 'contratistas'), {
        ...values,
        empresaId: profile.empresaId,
        estadoAprobacionGeneral: 'Pendiente de revisión',
        indicadorCumplimiento: 0,
        numConductores: 0,
        numVehiculos: 0,
        portalToken: token,
        creadoEn: serverTimestamp(),
        actualizadoEn: serverTimestamp(),
      });
      setIsAddContractorOpen(false);
      contractorForm.reset();
      toast({ title: 'Contratista Vinculado', description: 'El aliado ha sido registrado exitosamente.' });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo vincular al contratista.' });
    }
  }

  async function handleImport(data: Record<string, unknown>[]) {
    if (!firestore || !profile?.empresaId) return;
    try {
      for (const item of data) {
        const token = Math.random().toString(36).substring(2, 18);
        await addDoc(collection(firestore, 'contratistas'), {
          razonSocialONombre: String(item.razonSocialONombre ?? item.razonSocial ?? 'Sin Nombre'),
          nitCedula: String(item.nitCedula ?? item.nit ?? ''),
          tipoVinculacion: String(item.tipoVinculacion ?? 'Flota Fidelizada'),
          obligadoImplementarPESV: item.obligadoImplementarPESV === 'Sí' || item.obligadoImplementarPESV === true,
          empresaId: profile.empresaId,
          estadoAprobacionGeneral: 'Pendiente de revisión',
          indicadorCumplimiento: 0,
          numConductores: 0,
          numVehiculos: 0,
          portalToken: token,
          creadoEn: serverTimestamp(),
          actualizadoEn: serverTimestamp(),
        });
      }
      toast({ title: 'Carga Masiva Completada', description: `Se importaron ${data.length} contratistas.` });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Error en la carga masiva.' });
    }
  }

  async function handleDeleteContratista(id: string) {
    if (!firestore) return;
    setDeletingId(id);
    try {
      await deleteDoc(doc(firestore, 'contratistas', id));
      toast({ title: 'Contratista Eliminado' });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar.' });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSetEstado(id: string, estado: string) {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'contratistas', id), {
        estadoAprobacionGeneral: estado,
        actualizadoEn: serverTimestamp(),
      });
      toast({ title: 'Estado actualizado' });
    } catch {
      toast({ variant: 'destructive', title: 'Error' });
    }
  }

  function copyPortalLink(contratistaId: string, token: string) {
    const url = `${window.location.origin}/portal/contratistas/${contratistaId}?token=${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Enlace Copiado', description: 'Link del portal enviado al portapapeles.' });
  }

  async function onChangeSubmit(values: ChangeForm) {
    if (!firestore || !profile?.empresaId) return;
    try {
      await addDoc(collection(firestore, 'gestionCambiosViales'), {
        ...values,
        empresaId: profile.empresaId,
        estado: 'Pendiente',
        creadoEn: serverTimestamp(),
        actualizadoEn: serverTimestamp(),
      });
      setIsAddChangeOpen(false);
      changeForm.reset();
      toast({ title: 'Cambio Registrado', description: 'El impacto en la Seguridad Vial ha sido evaluado.' });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo registrar el cambio.' });
    }
  }

  async function handleAdvanceChange(id: string, currentEstado: string) {
    if (!firestore) return;
    const next = currentEstado === 'Pendiente' ? 'En curso' : currentEstado === 'En curso' ? 'Cerrado' : null;
    if (!next) return;
    try {
      await updateDoc(doc(firestore, 'gestionCambiosViales', id), {
        estado: next,
        actualizadoEn: serverTimestamp(),
      });
      toast({ title: `Avanzado a "${next}"` });
    } catch {
      toast({ variant: 'destructive', title: 'Error' });
    }
  }

  async function handleDeleteChange(id: string) {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'gestionCambiosViales', id));
      toast({ title: 'Cambio eliminado' });
    } catch {
      toast({ variant: 'destructive', title: 'Error' });
    }
  }

  // ── RENDER ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border-dark bg-card p-6 shadow-xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent" />
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <Handshake className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase italic tracking-tight text-foreground">
                Gestión de Contratistas
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Control de terceros y evaluación de impactos viales — Paso 18
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <ExcelBulkActions
              data={rawContratistas ?? []}
              fileName="Contratistas_PESV"
              templateColumns={['razonSocialONombre', 'nitCedula', 'tipoVinculacion', 'obligadoImplementarPESV']}
              onImport={handleImport}
            />
            <Dialog open={isAddContractorOpen} onOpenChange={setIsAddContractorOpen}>
              <DialogTrigger asChild>
                <Button className="h-11 bg-primary px-6 font-black uppercase shadow-lg shadow-primary/20">
                  <UserPlus className="mr-2 size-5" /> Vincular Aliado
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md overflow-hidden border-border-dark bg-card p-0 text-foreground">
                <DialogHeader className="border-b border-border-dark bg-primary/10 p-6">
                  <DialogTitle className="text-xl font-black uppercase italic">
                    Vincular Nuevo Contratista
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Registre el aliado en el sistema para gestionar su cumplimiento.
                  </DialogDescription>
                </DialogHeader>
                <Form {...contractorForm}>
                  <form onSubmit={contractorForm.handleSubmit(onContractorSubmit)} className="space-y-4 p-6">
                    <FormField
                      control={contractorForm.control}
                      name="razonSocialONombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Razón Social / Nombre</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ej: Transportes El Camino S.A.S." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={contractorForm.control}
                      name="nitCedula"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>NIT / Cédula</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="900.123.456-7" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={contractorForm.control}
                      name="tipoVinculacion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Vinculación</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Tercerización">Tercerización</SelectItem>
                              <SelectItem value="Subcontratación">Subcontratación</SelectItem>
                              <SelectItem value="Outsourcing">Outsourcing</SelectItem>
                              <SelectItem value="Intermediación laboral">Intermediación laboral</SelectItem>
                              <SelectItem value="Flota Fidelizada">Flota Fidelizada</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={contractorForm.control}
                      name="obligadoImplementarPESV"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>¿Obligado a implementar PESV?</FormLabel>
                          <Select
                            onValueChange={v => field.onChange(v === 'true')}
                            defaultValue={String(field.value)}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="true">Sí — Obligado por ley</SelectItem>
                              <SelectItem value="false">No — Exento</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="mt-4 h-12 w-full bg-primary font-black uppercase shadow-xl shadow-primary/20"
                    >
                      Registrar Contratista
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <Tabs defaultValue="contratistas" className="w-full">
        <TabsList className="mb-6 h-12 w-fit border border-border-dark bg-card p-1">
          <TabsTrigger
            value="contratistas"
            className="px-6 text-[10px] font-bold uppercase italic tracking-widest data-[state=active]:bg-primary"
          >
            Semáforo de Aliados
          </TabsTrigger>
          <TabsTrigger
            value="cambio"
            className="px-6 text-[10px] font-bold uppercase italic tracking-widest data-[state=active]:bg-primary"
          >
            Gestión del Cambio
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: SEMÁFORO DE ALIADOS ──────────────────────────────── */}
        <TabsContent value="contratistas" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card className="border-border-dark bg-card">
              <CardHeader className="pb-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Total Aliados
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-foreground">{stats.total}</div>
                <p className="mt-1 text-[10px] text-muted-foreground">contratistas activos</p>
              </CardContent>
            </Card>
            <Card className="border-border-dark bg-card">
              <CardHeader className="pb-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                  Tasa de Aprobación
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-emerald-500">{stats.tasa}%</div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${stats.tasa}%` }}
                  />
                </div>
              </CardContent>
            </Card>
            <Card className="border-border-dark bg-card">
              <CardHeader className="pb-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                  En Revisión
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-amber-500">{stats.revision}</div>
                <p className="mt-1 text-[10px] text-muted-foreground">documentos pendientes</p>
              </CardContent>
            </Card>
            <Card className="border-border-dark bg-card">
              <CardHeader className="pb-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-destructive">
                  Bloqueados
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-destructive">{stats.bloqueados}</div>
                <p className="mt-1 text-[10px] text-muted-foreground">operación suspendida</p>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card className="border-border-dark bg-card">
            <CardHeader className="border-b border-border-dark bg-white/[0.02] p-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9 text-xs"
                  placeholder="Buscar por nombre o NIT..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border-dark bg-white/[0.03]">
                    <TableHead className="w-6" />
                    <TableHead className="text-[10px] font-black uppercase">Contratista / NIT</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Vinculación</TableHead>
                    <TableHead className="text-center text-[10px] font-black uppercase">Flota</TableHead>
                    <TableHead className="text-center text-[10px] font-black uppercase">PESV</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Estado</TableHead>
                    <TableHead className="text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingContratistas ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i} className="border-border-dark">
                        <TableCell colSpan={7}>
                          <Skeleton className="h-8 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : contratistas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Handshake className="size-10 text-muted-foreground/20" />
                          <p className="text-sm italic text-muted-foreground">
                            No hay contratistas vinculados.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Usa el botón &quot;Vincular Aliado&quot; para registrar el primer tercero.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    contratistas.map(c => (
                      <TableRow key={c.id} className="border-border-dark hover:bg-white/[0.02]">
                        <TableCell className="pl-4">
                          <div
                            className={cn('size-2.5 rounded-full', semaforoDot(String(c.estadoAprobacionGeneral ?? '')))}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold uppercase italic text-foreground">
                              {String(c.razonSocialONombre ?? '—')}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {String(c.nitCedula ?? '—')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {String(c.tipoVinculacion ?? '—')}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Car className="size-3" />
                              {Number(c.numVehiculos) || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="size-3" />
                              {Number(c.numConductores) || 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {c.obligadoImplementarPESV ? (
                            <Badge className="border-none bg-primary/10 text-[8px] uppercase text-primary">
                              Obligado
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {estadoBadge(String(c.estadoAprobacionGeneral ?? 'Pendiente de revisión'))}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-foreground"
                              >
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="border-border-dark bg-card">
                              <DropdownMenuItem
                                className="cursor-pointer gap-2"
                                onClick={() => copyPortalLink(c.id, String(c.portalToken ?? ''))}
                              >
                                <Copy className="size-3.5" /> Copiar enlace portal
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-border-dark" />
                              <DropdownMenuItem
                                className="cursor-pointer gap-2 text-emerald-500 focus:text-emerald-500"
                                onClick={() => handleSetEstado(c.id, 'Aprobado')}
                              >
                                <ShieldCheck className="size-3.5" /> Aprobar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer gap-2 text-amber-500 focus:text-amber-500"
                                onClick={() => handleSetEstado(c.id, 'Pendiente de revisión')}
                              >
                                <Clock className="size-3.5" /> Poner en revisión
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                                onClick={() => handleSetEstado(c.id, 'Bloqueado/Rechazado')}
                              >
                                <ShieldOff className="size-3.5" /> Bloquear
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-border-dark" />
                              <DropdownMenuItem
                                className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                                disabled={deletingId === c.id}
                                onClick={() => handleDeleteContratista(c.id)}
                              >
                                <Trash2 className="size-3.5" /> Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 2: GESTIÓN DEL CAMBIO ────────────────────────────────── */}
        <TabsContent value="cambio" className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <TrendingUp className="size-6" />
              </div>
              <div>
                <h4 className="font-black uppercase italic tracking-tight text-foreground">
                  Kanban de Gestión del Cambio
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Evalúa el impacto de cambios internos o externos en el PESV antes de su ejecución.
                </p>
              </div>
            </div>
            <Dialog open={isAddChangeOpen} onOpenChange={setIsAddChangeOpen}>
              <DialogTrigger asChild>
                <Button className="h-10 bg-blue-600 px-6 text-xs font-bold uppercase shadow-lg shadow-blue-500/20 hover:bg-blue-500">
                  <Plus className="mr-2 size-4" /> Registrar Cambio
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg overflow-hidden border-border-dark bg-card p-0 text-foreground">
                <DialogHeader className="border-b border-border-dark bg-blue-500/10 p-6">
                  <DialogTitle className="text-xl font-black uppercase italic">
                    Evaluación de Gestión del Cambio
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Identifique riesgos asociados a nuevos procesos o legislación.
                  </DialogDescription>
                </DialogHeader>
                <Form {...changeForm}>
                  <form onSubmit={changeForm.handleSubmit(onChangeSubmit)} className="space-y-4 p-6">
                    <FormField
                      control={changeForm.control}
                      name="tipoDeCambio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Naturaleza del Cambio</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Nueva ruta">Nueva ruta</SelectItem>
                              <SelectItem value="Nuevas tecnologías/vehículos">
                                Nuevas tecnologías / vehículos
                              </SelectItem>
                              <SelectItem value="Nueva legislación">Nueva legislación</SelectItem>
                              <SelectItem value="Nuevos clientes/servicios">
                                Nuevos clientes / servicios
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={changeForm.control}
                      name="descripcionCambio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción del Cambio</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} placeholder="¿Qué cambió y por qué?" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={changeForm.control}
                      name="impactoSeguridadVial"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Impacto en Seguridad Vial</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Crítico">Crítico</SelectItem>
                              <SelectItem value="Alto">Alto</SelectItem>
                              <SelectItem value="Medio">Medio</SelectItem>
                              <SelectItem value="Bajo">Bajo</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={changeForm.control}
                      name="planMitigacion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plan de Mitigación</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={3}
                              placeholder="Acciones para prevenir riesgos derivados del cambio..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="mt-2 h-12 w-full bg-blue-600 font-black uppercase shadow-xl shadow-blue-500/20 hover:bg-blue-500"
                    >
                      Registrar Evaluación
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Kanban Board */}
          {loadingCambios ? (
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <KanbanColumn
                title="Identificado"
                color="amber"
                items={kanban.pendiente}
                onAdvance={handleAdvanceChange}
                onDelete={handleDeleteChange}
              />
              <KanbanColumn
                title="En Evaluación"
                color="blue"
                items={kanban.enCurso}
                onAdvance={handleAdvanceChange}
                onDelete={handleDeleteChange}
              />
              <KanbanColumn
                title="Controlado"
                color="emerald"
                items={kanban.cerrado}
                onAdvance={handleAdvanceChange}
                onDelete={handleDeleteChange}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── KANBAN COLUMN ─────────────────────────────────────────────────────────
type KanbanColor = 'amber' | 'blue' | 'emerald';

const COLUMN_STYLES: Record<KanbanColor, { border: string; badge: string; dot: string }> = {
  amber: { border: 'border-amber-500/30 bg-amber-500/5', badge: 'bg-amber-500/10 text-amber-500', dot: 'bg-amber-500' },
  blue: { border: 'border-blue-500/30 bg-blue-500/5', badge: 'bg-blue-500/10 text-blue-400', dot: 'bg-blue-500' },
  emerald: { border: 'border-emerald-500/30 bg-emerald-500/5', badge: 'bg-emerald-500/10 text-emerald-500', dot: 'bg-emerald-500' },
};

function KanbanColumn({
  title,
  color,
  items,
  onAdvance,
  onDelete,
}: {
  title: string;
  color: KanbanColor;
  items: Record<string, unknown>[];
  onAdvance: (id: string, estado: string) => void;
  onDelete: (id: string) => void;
}) {
  const s = COLUMN_STYLES[color];
  const isDone = color === 'emerald';

  return (
    <div className="flex flex-col gap-3">
      {/* Column header */}
      <div className={cn('flex items-center justify-between rounded-xl border p-3', s.border)}>
        <div className="flex items-center gap-2">
          <div className={cn('size-2 rounded-full', s.dot)} />
          <span className="text-xs font-black uppercase tracking-widest text-foreground">{title}</span>
        </div>
        <Badge className={cn('border-none text-[9px] font-bold', s.badge)}>{items.length}</Badge>
      </div>

      {/* Cards */}
      <div className="flex min-h-[120px] flex-col gap-2">
        {items.length === 0 ? (
          <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-border-dark">
            <p className="text-xs italic text-muted-foreground">Sin cambios</p>
          </div>
        ) : (
          items.map(cambio => {
            const id = String(cambio.id ?? '');
            const tipo = String(cambio.tipoDeCambio ?? '—');
            const descripcion = String(cambio.descripcionCambio ?? '—');
            const impacto = String(cambio.impactoSeguridadVial ?? 'Bajo');
            const plan = typeof cambio.planMitigacion === 'string' ? cambio.planMitigacion : null;
            const estado = String(cambio.estado ?? 'Pendiente');
            const fecha =
              (cambio.creadoEn as { toDate?: () => Date } | null)?.toDate?.()?.toLocaleDateString('es-CO') ?? '—';

            return (
              <Card key={id} className="border-border-dark bg-card transition-all hover:border-blue-500/20">
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <Badge
                      variant="outline"
                      className="shrink-0 border-blue-500/20 text-[8px] font-black uppercase text-blue-400"
                    >
                      {tipo}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => onDelete(id)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 p-3 pt-0">
                  <p className="line-clamp-3 text-xs font-medium leading-relaxed text-foreground">
                    {descripcion}
                  </p>
                  <div className="flex items-center justify-between">
                    {impactoBadge(impacto)}
                    <span className="text-[9px] text-muted-foreground">{fecha}</span>
                  </div>
                  {plan && (
                    <div className="rounded-lg bg-white/[0.03] p-2">
                      <p className="mb-1 text-[9px] font-black uppercase text-muted-foreground">
                        Plan de mitigación
                      </p>
                      <p className="line-clamp-2 text-[10px] text-foreground/70">{plan}</p>
                    </div>
                  )}
                  {!isDone && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-full gap-1 border border-border-dark text-[10px] font-bold uppercase hover:bg-white/5"
                      onClick={() => onAdvance(id, estado)}
                    >
                      Avanzar <ArrowRight className="size-3" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
