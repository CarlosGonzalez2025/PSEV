
'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, serverTimestamp, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Calendar as CalendarIcon,
    Plus,
    CheckCircle2,
    Clock,
    AlertCircle,
    MoreVertical,
    Trash2,
    ListTodo
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

export default function PlanTrabajoPage() {
    const firestore = useFirestore();
    const { profile } = useUser();
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [open, setOpen] = useState(false);

    const planRef = useMemoFirebase(() => {
        if (!firestore || !profile?.empresaId) return null;
        return collection(firestore, 'empresas', profile.empresaId, 'pesv_plan_trabajo');
    }, [firestore, profile?.empresaId]);

    const { data: actividades, isLoading } = useCollection(planRef);

    const handleAddActivity = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!firestore || !planRef) return;
        const formData = new FormData(e.currentTarget);
        try {
            await addDoc(planRef, {
                documentName: formData.get('nombre') as string,
                responsable: formData.get('responsable') as string,
                fechaProgramada: formData.get('fecha') as string,
                estado: "Programada",
                prioridad: formData.get('prioridad') as string,
                empresaId: profile?.empresaId,
                creadoEn: new Date().toISOString()
            });
            setOpen(false);
            toast({ title: "Actividad Programada", description: "Se ha añadido al cronograma anual." });
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la actividad." });
        }
    };

    const toggleStatus = async (id: string, currentStatus: string) => {
        if (!firestore || !profile?.empresaId) return;
        const docRef = doc(firestore, 'empresas', profile.empresaId, 'pesv_plan_trabajo', id);
        const newStatus = currentStatus === "Completada" ? "Programada" : "Completada";
        await updateDoc(docRef, {
            estado: newStatus,
            fechaEjecucion: newStatus === "Completada" ? new Date().toISOString() : null
        });
        toast({ title: "Estado Actualizado" });
    };

    const completedCount = actividades?.filter(a => a.estado === "Completada").length || 0;
    const totalCount = actividades?.length || 0;
    const progressValue = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase">Plan Anual de Trabajo</h1>
                    <p className="text-text-secondary mt-1">Cronograma de actividades y seguimiento de cumplimiento (Paso 9)</p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="font-bold shadow-lg shadow-primary/20 bg-primary">
                            <Plus className="w-4 h-4 mr-2" />
                            Nueva Actividad
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-surface-dark border-border-dark text-white">
                        <DialogHeader>
                            <DialogTitle>Programar Actividad</DialogTitle>
                            <DialogDescription className="text-text-secondary">Defina el responsable y la fecha de ejecución.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddActivity} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-text-secondary">Nombre de la Actividad</label>
                                <Input name="nombre" placeholder="Ej: Capacitación en Fatiga" className="bg-background-dark border-border-dark text-white" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-text-secondary">Responsable</label>
                                    <Input name="responsable" placeholder="Cargo o Nombre" className="bg-background-dark border-border-dark text-white" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-text-secondary">Fecha Programada</label>
                                    <Input type="date" name="fecha" className="bg-background-dark border-border-dark text-white" required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-text-secondary">Prioridad</label>
                                <select name="prioridad" className="w-full bg-background-dark border-border-dark text-white h-10 px-3 rounded-md border text-sm focus:ring-1 focus:ring-primary outline-none">
                                    <option value="Alta">Alta</option>
                                    <option value="Media">Media</option>
                                    <option value="Baja">Baja</option>
                                </select>
                            </div>
                            <Button type="submit" className="w-full font-bold bg-primary hover:bg-primary/90">Guardar en Calendario</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Lado Izquierdo: Resumen e Indicador */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="bg-surface-dark border-border-dark shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-white text-base font-bold flex items-center gap-2">
                                <ListTodo className="w-5 h-5 text-primary" /> Cumplimiento del Plan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div className="text-3xl font-black text-white">{completedCount}/{totalCount}</div>
                                <div className="text-sm font-bold text-primary">{progressValue.toFixed(1)}%</div>
                            </div>
                            <Progress value={progressValue} className="h-2" />
                            <p className="text-[10px] text-text-secondary italic">
                                *Este valor alimenta automáticamente el Indicador 5 del reporte trimestral SISI.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-surface-dark border-border-dark">
                        <CardContent className="p-4 flex justify-center">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                className="rounded-md border border-border-dark bg-background-dark text-white"
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Lado Derecho: Listado Detallado */}
                <div className="lg:col-span-8">
                    <Card className="bg-surface-dark border-border-dark shadow-2xl">
                        <CardHeader className="border-b border-border-dark">
                            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5 text-primary" /> Cronograma de Actividades
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border-dark bg-white/5">
                                        <TableHead className="text-white font-bold w-12"></TableHead>
                                        <TableHead className="text-white font-bold">Actividad</TableHead>
                                        <TableHead className="text-white font-bold">Responsable</TableHead>
                                        <TableHead className="text-white font-bold">Programado</TableHead>
                                        <TableHead className="text-white font-bold">Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {actividades?.map((act) => (
                                        <TableRow key={act.id} className="border-border-dark hover:bg-white/5 transition-colors">
                                            <TableCell>
                                                <button onClick={() => toggleStatus(act.id, act.estado)} className="focus:outline-none">
                                                    {act.estado === "Completada" ? (
                                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                    ) : (
                                                        <Clock className="w-5 h-5 text-amber-500" />
                                                    )}
                                                </button>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className={act.estado === "Completada" ? "text-text-secondary line-through" : "text-white font-bold"}>
                                                        {act.documentName}
                                                    </span>
                                                    <span className="text-[10px] text-text-secondary uppercase font-bold">{act.prioridad} Prioridad</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-text-secondary text-sm">{act.responsable}</TableCell>
                                            <TableCell className="text-white text-sm">{act.fechaProgramada}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={act.estado === "Completada" ? "bg-emerald-500/10 text-emerald-500 border-none" : "bg-amber-500/10 text-amber-500 border-none"}>
                                                    {act.estado}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {actividades?.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-10 text-text-secondary italic">
                                                No hay actividades programadas para el periodo actual.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
