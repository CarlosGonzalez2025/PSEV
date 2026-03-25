
'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { addDoc, collection, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Flame,
    Plus,
    FileText,
    History,
    CheckCircle2,
    AlertTriangle,
    Send,
    Upload
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
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function EmergenciasPage() {
    const firestore = useFirestore();
    const { profile } = useUser();
    const [activeTab, setActiveTab] = useState("protocolo");

    const simulacrosRef = useMemoFirebase(() => {
        if (!firestore || !profile?.empresaId) return null;
        return collection(firestore, 'empresas', profile.empresaId, 'pesv_simulacros');
    }, [firestore, profile?.empresaId]);

    const { data: simulacros } = useCollection(simulacrosRef);

    const handleAddSimulacro = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!firestore || !simulacrosRef) return;
        const formData = new FormData(e.currentTarget);
        try {
            await addDoc(simulacrosRef, {
                tipo: formData.get('tipo') as string,
                fecha: formData.get('fecha') as string,
                resultado: formData.get('resultado') as string,
                participantes: Number(formData.get('participantes')),
                empresaId: profile?.empresaId,
                registradoEn: new Date().toISOString()
            });
            e.currentTarget.reset();
            toast({ title: "Simulacro Registrado", description: "Evidencia guardada exitosamente." });
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: "No se pudo registrar el simulacro." });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase">Emergencias Viales (PPRAEV)</h1>
                    <p className="text-text-secondary mt-1">Protocolos de atención y registro de simulacros (Paso 12)</p>
                </div>
            </div>

            <Tabs defaultValue="protocolo" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="bg-surface-dark border-border-dark">
                    <TabsTrigger value="protocolo" className="data-[state=active]:bg-primary">Protocolo PPRAEV</TabsTrigger>
                    <TabsTrigger value="simulacros" className="data-[state=active]:bg-primary">Simulacros</TabsTrigger>
                    <TabsTrigger value="recursos" className="data-[state=active]:bg-primary">Recursos de Emergencia</TabsTrigger>
                </TabsList>

                <TabsContent value="protocolo" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-8 space-y-6">
                            <Card className="bg-surface-dark border-border-dark">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-primary" /> Cuerpo del Protocolo (Paso 12.1)
                                    </CardTitle>
                                    <CardDescription>Plan de Preparación, Respuesta y Atención a Emergencias Viales</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="p-6 border border-dashed border-border-dark rounded-xl bg-white/5 text-center">
                                        <Upload className="mx-auto w-10 h-10 text-text-secondary mb-4" />
                                        <p className="text-white font-bold">Cargar PPRAEV Actualizado</p>
                                        <p className="text-xs text-text-secondary mt-1">Formato PDF (Máx 10MB)</p>
                                        <Button variant="outline" className="mt-4 border-border-dark text-white hover:bg-white/10">Seleccionar Archivo</Button>
                                    </div>
                                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                                        <p className="text-xs text-primary font-bold">REQUISITOS LEGALES</p>
                                        <ul className="text-xs text-white mt-2 space-y-1 list-disc list-inside opacity-80">
                                            <li>Procedimientos ante choque, incendio o volcamiento.</li>
                                            <li>Números de emergencia (Policía, Cruz Roja, ARL).</li>
                                            <li>Protocolo de primer respondiente.</li>
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <aside className="lg:col-span-4">
                            <Card className="bg-surface-dark border-border-dark">
                                <CardHeader>
                                    <CardTitle className="text-white text-sm font-bold uppercase">Estado del Documento</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-text-secondary text-sm">Versión Actual</span>
                                        <Badge className="bg-primary/20 text-primary border-none">V1.0 (Borrador)</Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-text-secondary text-sm">Última Revisión</span>
                                        <span className="text-white text-sm">Pendiente</span>
                                    </div>
                                    <Button className="w-full bg-primary font-bold h-12 shadow-lg shadow-primary/20">
                                        <Send className="w-4 h-4 mr-2" /> Difundir a Conductores
                                    </Button>
                                </CardContent>
                            </Card>
                        </aside>
                    </div>
                </TabsContent>

                <TabsContent value="simulacros" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="bg-surface-dark border-border-dark">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Flame className="w-5 h-5 text-red-500" /> Registrar Simulacro (Anual)
                                </CardTitle>
                                <CardDescription>Evidencia obligatoria de entrenamiento (Paso 12.3)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleAddSimulacro} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-text-secondary uppercase">Tipo de Evento</label>
                                        <select name="tipo" className="w-full bg-background-dark border-border-dark text-white h-10 px-3 rounded-md border text-sm outline-none">
                                            <option value="Colisión">Simulacro de Colisión</option>
                                            <option value="Volcamiento">Simulacro de Volcamiento</option>
                                            <option value="Incendio">Simulacro de Incendio Vial</option>
                                            <option value="Primeros Auxilios">Práctica de Primeros Auxilios</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-text-secondary uppercase">Fecha</label>
                                            <Input type="date" name="fecha" className="bg-background-dark border-border-dark text-white" required />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-text-secondary uppercase">Participantes</label>
                                            <Input type="number" name="participantes" className="bg-background-dark border-border-dark text-white" required />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-text-secondary uppercase">Resultado / Observaciones</label>
                                        <textarea name="resultado" className="w-full bg-background-dark border-border-dark text-white p-3 rounded-md border text-sm h-20 outline-none" placeholder="¿Se cumplieron los tiempos de respuesta?" />
                                    </div>
                                    <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 font-bold">Guardar Registro</Button>
                                </form>
                            </CardContent>
                        </Card>

                        <Card className="bg-surface-dark border-border-dark">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <History className="w-5 h-5 text-primary" /> Historial de Simulacros
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border-dark">
                                            <TableHead className="text-white text-xs uppercase">Fecha</TableHead>
                                            <TableHead className="text-white text-xs uppercase">Tipo</TableHead>
                                            <TableHead className="text-white text-xs uppercase">Efectividad</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {simulacros?.map((sim) => (
                                            <TableRow key={sim.id} className="border-border-dark">
                                                <TableCell className="text-white text-sm">{sim.fecha}</TableCell>
                                                <TableCell className="text-white font-bold text-sm">{sim.tipo}</TableCell>
                                                <TableCell>
                                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold italic text-[10px]">EXITOSO</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {simulacros?.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-10 text-text-secondary italic">No hay registros</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="recursos" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="bg-surface-dark border-border-dark">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Checklist Botiquines (Res. 40595)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[
                                    "Vendajes limpios y apósitos",
                                    "Solución antiséptica",
                                    "Guantes de látex o nitrilo",
                                    "Tijeras trauma",
                                    "Esparadrapo micropore",
                                    "Manta térmica"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-2 rounded hover:bg-white/5 transition-colors group">
                                        <div className="size-5 rounded border border-emerald-500/50 flex items-center justify-center text-emerald-500">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-sm text-text-secondary group-hover:text-white">{item}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="bg-surface-dark border-border-dark">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-amber-500" /> Equipos de Prevención
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[
                                    "Extintores con carga vigente",
                                    "Conos o triángulos de señalización",
                                    "Chalecos reflectivos",
                                    "Herramientas básicas (Gato, Cruceta)",
                                    "Linterna con pilas funcionales"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-2 rounded hover:bg-white/5 transition-colors group">
                                        <div className="size-5 rounded border border-amber-500/50 flex items-center justify-center text-amber-500">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-sm text-text-secondary group-hover:text-white">{item}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
