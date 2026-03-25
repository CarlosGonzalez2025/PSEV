
'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    FileArchive,
    ShieldCheck,
    Database,
    History,
    Trash2,
    Clock,
    Download,
    AlertCircle
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const RETENTION_RULES = [
    { tipo: "Inspecciones Diarias", anos: 1, categoria: "Operativo" },
    { tipo: "Siniestros e Investigaciones", anos: 5, categoria: "Legal" },
    { tipo: "Plan de Mantenimiento", anos: 2, categoria: "Técnico" },
    { tipo: "Actas de Comité PESV", anos: 5, categoria: "Administrativo" },
    { tipo: "Registros de Capacitación", anos: 3, categoria: "Talento Humano" }
];

export default function DocumentalPage() {
    const { profile } = useUser();

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Retención Documental</h1>
                    <p className="text-text-secondary mt-1">Gestión del ciclo de vida de la información (Paso 19)</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-border-dark text-foreground hover:bg-white/10 font-bold">
                        <Download className="w-4 h-4 mr-2" /> Copia de Seguridad
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-6">
                    <Card className="bg-surface-dark border-border-dark">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center gap-2">
                                <Database className="w-5 h-5 text-primary" /> Tablas de Retención (Paso 19.1)
                            </CardTitle>
                            <CardDescription>Definición de tiempos mínimos de custodia por tipo de registro</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border-dark bg-white/5">
                                        <TableHead className="text-foreground font-bold">Tipo de Documento</TableHead>
                                        <TableHead className="text-foreground font-bold">Categoría</TableHead>
                                        <TableHead className="text-foreground font-bold text-center">Años de Retención</TableHead>
                                        <TableHead className="text-right"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {RETENTION_RULES.map((rule, i) => (
                                        <TableRow key={i} className="border-border-dark hover:bg-white/5">
                                            <TableCell className="text-foreground font-bold">{rule.tipo}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-[10px] border-border-dark text-text-secondary">{rule.categoria}</Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className="bg-primary/20 text-primary border-none font-bold">{rule.anos} Años</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="text-text-secondary"><History className="size-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card className="bg-surface-dark border-border-dark">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center gap-2">
                                <FileArchive className="w-5 h-5 text-amber-500" /> Archivo Histórico (Cloud Storage)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-xl border border-border-dark bg-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                            <ShieldCheck className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-foreground font-bold text-sm">Integridad de Archivos</p>
                                            <p className="text-xs text-text-secondary">Cifrado AES-256 habilitado en Firestore/Storage</p>
                                        </div>
                                    </div>
                                    <Badge className="bg-emerald-500">ACTIVO</Badge>
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-xl border border-border-dark bg-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-foreground font-bold text-sm">Purga Automática</p>
                                            <p className="text-xs text-text-secondary">Eliminar registros más antiguos de 5 años</p>
                                        </div>
                                    </div>
                                    <Switch />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <aside className="lg:col-span-4 space-y-6">
                    <Card className="bg-primary border-primary shadow-xl shadow-primary/20">
                        <CardHeader>
                            <CardTitle className="text-foreground text-base font-black flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5" /> Seguridad
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-xs text-foreground/80 leading-relaxed font-medium">
                                El software garantiza el acceso controlado mediante roles (Visa/Passport) para evitar la alteración de registros históricos.
                            </p>
                            <div className="pt-4 border-t border-white/20">
                                <div className="flex justify-between text-[10px] text-foreground/60 mb-1">
                                    <span>ALMACENAMIENTO TENANT</span>
                                    <span>45%</span>
                                </div>
                                <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-white h-full w-[45%]" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-surface-dark border-border-dark">
                        <CardHeader>
                            <CardTitle className="text-foreground text-sm font-bold flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-red-500" /> Registros en Riesgo
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <p className="text-xs text-red-400 font-bold">25 Inspecciones Vencidas</p>
                                <p className="text-[10px] text-text-secondary mt-1">Superan el periodo de 1 año. Se recomienda descarga a backup offline antes de purga.</p>
                            </div>
                            <Button className="w-full font-bold h-10 bg-white/5 hover:bg-white/10 text-foreground border-border-dark" variant="outline">
                                Gestionar Purga Manual
                            </Button>
                        </CardContent>
                    </Card>
                </aside>
            </div>
        </div>
    );
}
