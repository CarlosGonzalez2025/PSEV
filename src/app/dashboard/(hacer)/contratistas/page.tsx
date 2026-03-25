
'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, serverTimestamp, addDoc, updateDoc, doc, orderBy } from 'firebase/firestore';
import { ExcelBulkActions } from '@/components/shared/excel-bulk-actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Handshake,
    Plus,
    ShieldCheck,
    AlertTriangle,
    FileCheck,
    Search,
    MoreVertical,
    ExternalLink,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    Clock,
    UserPlus,
    Car,
    FileText,
    TrendingUp,
    ArrowRightLeft
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- ESQUEMAS ---
const contractorSchema = z.object({
    razonSocial: z.string().min(3, "Razón social requerida"),
    nit: z.string().min(5, "NIT inválido"),
    tipoVinculacion: z.enum(["Tercerización", "Subcontratación", "Outsourcing", "Intermediación laboral", "Flota Fidelizada"]),
    obligadoPESV: z.enum(["Sí", "No"]),
});

const changeSchema = z.object({
    tipoCambio: z.enum(["Nueva ruta", "Nuevas tecnologías/vehículos", "Nueva legislación", "Nuevos clientes/servicios"]),
    descripcion: z.string().min(10, "Descripción detallada requerida"),
    impacto: z.enum(["Alto", "Medio", "Bajo"]),
    actualizaMatriz: z.boolean().default(false),
});

export default function ContratistasPage() {
    const firestore = useFirestore();
    const { profile } = useUser();
    const [isAddContractorOpen, setIsAddContractorOpen] = useState(false);
    const [isAddChangeOpen, setIsAddChangeOpen] = useState(false);

    // --- QUERIES ---
    const contratistasRef = useMemoFirebase(() => {
        if (!firestore || !profile?.empresaId) return null;
        return query(collection(firestore, 'empresas', profile.empresaId, 'pesv_contratistas'), orderBy('razonSocial'));
    }, [firestore, profile?.empresaId]);
    const { data: contratistas, isLoading: loadingContratistas } = useCollection(contratistasRef);

    const cambiosRef = useMemoFirebase(() => {
        if (!firestore || !profile?.empresaId) return null;
        return query(collection(firestore, 'empresas', profile.empresaId, 'gestion_cambios'), orderBy('createdAt', 'desc'));
    }, [firestore, profile?.empresaId]);
    const { data: cambios, isLoading: loadingCambios } = useCollection(cambiosRef);

    // --- FORMS ---
    const contractorForm = useForm<z.infer<typeof contractorSchema>>({
        resolver: zodResolver(contractorSchema),
        defaultValues: { razonSocial: "", nit: "", tipoVinculacion: "Flota Fidelizada", obligadoPESV: "No" }
    });

    const changeForm = useForm<z.infer<typeof changeSchema>>({
        resolver: zodResolver(changeSchema),
        defaultValues: { tipoCambio: "Nueva ruta", descripcion: "", impacto: "Bajo", actualizaMatriz: false }
    });

    // --- ACTIONS ---
    async function onContractorSubmit(values: z.infer<typeof contractorSchema>) {
        if (!firestore || !profile?.empresaId) return;
        try {
            await addDoc(collection(firestore, 'empresas', profile.empresaId, 'pesv_contratistas'), {
                ...values,
                estadoAprobacion: "Pendiente",
                indicadorCumplimiento: 0,
                numConductores: 0,
                numVehiculos: 0,
                createdAt: serverTimestamp()
            });
            setIsAddContractorOpen(false);
            contractorForm.reset();
            toast({ title: "Contratista Vinculado", description: "Se ha enviado la invitación al Portal de Aliados." });
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "No se pudo vincular al contratista." });
        }
    }

    async function handleImport(data: any[]) {
        if (!firestore || !profile?.empresaId) return;
        try {
            const colRef = collection(firestore, 'empresas', profile.empresaId, 'pesv_contratistas');
            for (const item of data) {
                await addDoc(colRef, {
                    razonSocial: item.razonSocial || "Sin Nombre",
                    nit: String(item.nit || ""),
                    tipoVinculacion: item.tipoVinculacion || "Flota Fidelizada",
                    obligadoPESV: item.obligadoPESV || "No",
                    estadoAprobacion: "Pendiente",
                    indicadorCumplimiento: 0,
                    numConductores: 0,
                    numVehiculos: 0,
                    createdAt: serverTimestamp()
                });
            }
            toast({ title: "Carga Masiva Completada", description: `Se han importado ${data.length} contratistas.` });
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "Error en la carga masiva." });
        }
    }

    async function onChangeSubmit(values: z.infer<typeof changeSchema>) {
        if (!firestore || !profile?.empresaId) return;
        try {
            await addDoc(collection(firestore, 'empresas', profile.empresaId, 'gestion_cambios'), {
                ...values,
                estado: "Evaluado",
                createdAt: serverTimestamp()
            });
            setIsAddChangeOpen(false);
            changeForm.reset();
            toast({ title: "Cambio Registrado", description: "Se ha evaluado el impacto en la Seguridad Vial." });
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "No se pudo registrar el cambio." });
        }
    }

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight uppercase italic">Gestión de Contratistas y Cambio</h1>
                    <p className="text-text-secondary mt-1">Control de terceros y evaluación de impactos viales (Paso 18)</p>
                </div>
                {profile?.nivelPESV !== 'Básico' && (
                    <div className="flex gap-2">
                        <ExcelBulkActions
                            data={contratistas || []}
                            fileName="Contratistas_PESV"
                            templateColumns={["razonSocial", "nit", "tipoVinculacion", "obligadoPESV"]}
                            onImport={handleImport}
                        />
                        <Dialog open={isAddContractorOpen} onOpenChange={setIsAddContractorOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-primary font-black uppercase h-11 px-6 shadow-lg shadow-primary/20">
                                    <UserPlus className="size-5 mr-2" /> Vincular Aliado
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md bg-surface-dark border-border-dark text-foreground p-0 overflow-hidden">
                                <DialogHeader className="p-6 bg-primary/10 border-b border-border-dark">
                                    <DialogTitle className="text-xl font-black uppercase italic">Vincular Nuevo Contratista</DialogTitle>
                                    <DialogDescription className="text-text-secondary">Envíe una invitación para el registro en el Portal de Autogestión.</DialogDescription>
                                </DialogHeader>
                                <Form {...contractorForm}>
                                    <form onSubmit={contractorForm.handleSubmit(onContractorSubmit)} className="p-6 space-y-4">
                                        <FormField control={contractorForm.control} name="razonSocial" render={({ field }) => (
                                            <FormItem><FormLabel>Razón Social / Nombre</FormLabel><FormControl><Input {...field} className="bg-background-dark" /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={contractorForm.control} name="nit" render={({ field }) => (
                                            <FormItem><FormLabel>NIT / Cédula</FormLabel><FormControl><Input {...field} className="bg-background-dark" /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={contractorForm.control} name="tipoVinculacion" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tipo de Vinculación</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger className="bg-background-dark"><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Tercerización">Tercerización</SelectItem>
                                                        <SelectItem value="Subcontratación">Subcontratación</SelectItem>
                                                        <SelectItem value="Outsourcing">Outsourcing</SelectItem>
                                                        <SelectItem value="Intermediación laboral">Intermediación laboral</SelectItem>
                                                        <SelectItem value="Flota Fidelizada">Flota Fidelizada</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )} />
                                        <FormField control={contractorForm.control} name="obligadoPESV" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>¿Obligado a implementar PESV?</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger className="bg-background-dark"><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent><SelectItem value="Sí">Sí</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
                                                </Select>
                                            </FormItem>
                                        )} />
                                        <Button type="submit" className="w-full bg-primary font-black uppercase h-12 mt-4 shadow-xl shadow-primary/20">Generar Invitación Portal</Button>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>

            <Tabs defaultValue="contratistas" className="w-full">
                <TabsList className="bg-surface-dark border-border-dark p-1 h-12 w-fit mb-6">
                    <TabsTrigger value="contratistas" className="data-[state=active]:bg-primary font-bold px-6 uppercase text-[10px] tracking-widest italic">Portal de Aliados</TabsTrigger>
                    <TabsTrigger value="cambio" className="data-[state=active]:bg-primary font-bold px-6 uppercase text-[10px] tracking-widest italic">Gestión del Cambio</TabsTrigger>
                </TabsList>

                <TabsContent value="contratistas" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="bg-surface-dark border-border-dark">
                            <CardHeader className="pb-2"><p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Contratistas Activos</p></CardHeader>
                            <CardContent><div className="text-3xl font-black text-foreground">{contratistas?.length || 0}</div></CardContent>
                        </Card>
                        <Card className="bg-surface-dark border-border-dark">
                            <CardHeader className="pb-2"><p className="text-[10px] font-black text-text-secondary uppercase tracking-widest text-emerald-500">Aprobación General</p></CardHeader>
                            <CardContent><div className="text-3xl font-black text-emerald-500">85%</div></CardContent>
                        </Card>
                        <Card className="bg-surface-dark border-border-dark">
                            <CardHeader className="pb-2"><p className="text-[10px] font-black text-text-secondary uppercase tracking-widest text-destructive">Terceros Bloqueados</p></CardHeader>
                            <CardContent><div className="text-3xl font-black text-destructive">2</div></CardContent>
                        </Card>
                        <Card className="bg-surface-dark border-border-dark border-l-4 border-l-primary">
                            <CardHeader className="pb-2"><p className="text-[10px] font-black text-primary uppercase tracking-widest">Portal Público</p></CardHeader>
                            <CardContent className="flex items-center justify-between">
                                <div className="text-sm font-bold text-foreground uppercase italic">Configurado</div>
                                <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10"><ExternalLink className="size-4" /></Button>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="bg-surface-dark border-border-dark">
                        <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                            <div className="flex items-center justify-between">
                                <div className="relative w-96">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-secondary" />
                                    <Input className="pl-9 bg-background-dark border-border-dark text-xs" placeholder="Buscar aliado por nombre o NIT..." />
                                </div>
                                <Button variant="outline" className="border-border-dark font-bold text-[10px] uppercase tracking-widest gap-2"><RefreshCw className="size-3" /> Sincronizar SISI</Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border-dark bg-white/5">
                                        <TableHead className="text-[10px] font-black uppercase">Contratista / NIT</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-center">Cumplimiento (%)</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-center">Operativos (V / C)</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase">Estado Aprobación</TableHead>
                                        <TableHead className="text-right"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loadingContratistas ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-10">Cargando...</TableCell></TableRow>
                                    ) : contratistas?.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-20 italic text-text-secondary">No hay contratistas vinculados.</TableCell></TableRow>
                                    ) : (
                                        contratistas?.map(c => (
                                            <TableRow key={c.id} className="border-border-dark hover:bg-white/5">
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-foreground uppercase italic">{c.razonSocial}</span>
                                                        <span className="text-[10px] font-bold text-text-secondary uppercase">{c.nit}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="inline-flex flex-col items-center gap-1">
                                                        <span className="text-xs font-black text-foreground">{c.indicadorCumplimiento || 0}%</span>
                                                        <Progress value={c.indicadorCumplimiento || 0} className="w-16 h-1 bg-white/5" indicatorClassName="bg-primary" />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex justify-center items-center gap-3">
                                                        <div className="flex items-center gap-1 text-[10px] font-bold text-text-secondary"><Car className="size-3" /> {c.numVehiculos || 0}</div>
                                                        <div className="flex items-center gap-1 text-[10px] font-bold text-text-secondary"><Users className="size-3" /> {c.numConductores || 0}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {c.estadoAprobacion === 'Aprobado' ? (
                                                        <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] uppercase tracking-widest gap-1"><CheckCircle2 className="size-3" /> Operativo</Badge>
                                                    ) : c.estadoAprobacion === 'Bloqueado' ? (
                                                        <Badge className="bg-destructive/10 text-destructive border-none text-[8px] uppercase tracking-widest gap-1"><AlertCircle className="size-3" /> Bloqueado</Badge>
                                                    ) : (
                                                        <Badge className="bg-amber-500/10 text-amber-500 border-none text-[8px] uppercase tracking-widest gap-1"><Clock className="size-3" /> En Revisión</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" className="text-text-secondary hover:text-foreground"><MoreVertical className="size-4" /></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="cambio" className="space-y-6">
                    <div className="flex justify-between items-center bg-blue-500/5 border border-blue-500/20 p-6 rounded-2xl">
                        <div className="flex gap-4">
                            <div className="size-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500"><TrendingUp className="size-6" /></div>
                            <div>
                                <h4 className="text-foreground font-black uppercase italic tracking-tight">Gestión del Cambio Vial</h4>
                                <p className="text-xs text-text-secondary mt-1">Evalúa el impacto de cambios internos/externos en el PESV antes de su ejecución.</p>
                            </div>
                        </div>
                        <Dialog open={isAddChangeOpen} onOpenChange={setIsAddChangeOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-blue-600 font-bold uppercase text-xs h-10 px-6 shadow-lg shadow-blue-500/20">
                                    <Plus className="size-4 mr-2" /> Evaluar Cambio
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md bg-surface-dark border-border-dark text-foreground p-0 overflow-hidden">
                                <DialogHeader className="p-6 bg-blue-500/10 border-b border-border-dark">
                                    <DialogTitle className="text-xl font-black uppercase italic">Evaluación de Gestión del Cambio</DialogTitle>
                                    <DialogDescription className="text-text-secondary">Identifique riesgos asociados a nuevos procesos o legislación.</DialogDescription>
                                </DialogHeader>
                                <Form {...changeForm}>
                                    <form onSubmit={changeForm.handleSubmit(onChangeSubmit)} className="p-6 space-y-4">
                                        <FormField control={changeForm.control} name="tipoCambio" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Naturaleza del Cambio</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger className="bg-background-dark"><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Nueva ruta">Nueva ruta</SelectItem>
                                                        <SelectItem value="Nuevas tecnologías/vehículos">Nuevas tecnologías/vehículos</SelectItem>
                                                        <SelectItem value="Nueva legislación">Nueva legislación</SelectItem>
                                                        <SelectItem value="Nuevos clientes/servicios">Nuevos clientes/servicios</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )} />
                                        <FormField control={changeForm.control} name="descripcion" render={({ field }) => (
                                            <FormItem><FormLabel>Descripción del Cambio</FormLabel><FormControl><Input {...field} className="bg-background-dark" /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={changeForm.control} name="impacto" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Impacto en la Seguridad Vial</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger className="bg-background-dark"><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent><SelectItem value="Alto">Alto</SelectItem><SelectItem value="Medio">Medio</SelectItem><SelectItem value="Bajo">Bajo</SelectItem></SelectContent>
                                                </Select>
                                            </FormItem>
                                        )} />
                                        <Button type="submit" className="w-full bg-blue-600 font-black uppercase h-12 mt-4 shadow-xl shadow-blue-500/20">Registrar Evaluación</Button>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {loadingCambios ? (
                            <Skeleton className="h-40 w-full" />
                        ) : cambios?.length === 0 ? (
                            <Card className="md:col-span-2 bg-surface-dark border-border-dark py-20 text-center border-dashed border-2">
                                <ArrowRightLeft className="size-12 text-foreground/5 mx-auto mb-4" />
                                <p className="text-text-secondary italic">No se han registrado cambios viales recientes.</p>
                            </Card>
                        ) : (
                            cambios?.map(cambio => (
                                <Card key={cambio.id} className="bg-surface-dark border-border-dark overflow-hidden hover:border-blue-500/30 transition-all">
                                    <CardHeader className="p-4 bg-white/5 flex flex-row items-center justify-between">
                                        <Badge variant="outline" className="text-[9px] uppercase font-black border-blue-500/30 text-blue-500">{cambio.tipoCambio}</Badge>
                                        <span className="text-[9px] font-bold text-text-secondary uppercase italic">{cambio.createdAt?.toDate().toLocaleDateString() || 'Hoy'}</span>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        <h5 className="font-bold text-foreground text-sm uppercase italic mb-2 tracking-tight">{cambio.descripcion}</h5>
                                        <div className="flex items-center gap-4 mt-4">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-text-secondary uppercase">Impacto Vial</span>
                                                <Badge className={cambio.impacto === 'Alto' ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-500'}>{cambio.impacto}</Badge>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-text-secondary uppercase">Estado</span>
                                                <Badge variant="outline" className="border-emerald-500/50 text-emerald-500 uppercase text-[9px]">{cambio.estado}</Badge>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
