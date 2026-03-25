
'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Building2,
    MapPin,
    Plus,
    CheckCircle2,
    AlertTriangle,
    ClipboardList,
    TrafficCone
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

const INFRA_SECTIONS = [
    {
        id: "rutas",
        titulo: "Rutas Internas",
        items: ["Estado de la calzada", "Señalización horizontal", "Iluminación de patios"]
    },
    {
        id: "parqueo",
        titulo: "Zonas de Parqueo",
        items: ["Delimitación de cupos", "Separación peatonal", "Drenajes y limpieza"]
    },
    {
        id: "entorno",
        titulo: "Entorno Vial",
        items: ["Visibilidad de salidas", "Señalización externa", "Estado de andenes"]
    }
];

export default function InfraestructuraPage() {
    const firestore = useFirestore();
    const { profile } = useUser();

    const inspeccionesRef = useMemoFirebase(() => {
        if (!firestore || !profile?.empresaId) return null;
        return collection(firestore, 'empresas', profile.empresaId, 'pesv_inspecciones_infra');
    }, [firestore, profile?.empresaId]);

    const { data: inspecciones } = useCollection(inspeccionesRef);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Infraestructura Física</h1>
                    <p className="text-text-secondary mt-1">Gestión de vías internas y zonas de parqueo seguro (Paso 14)</p>
                </div>
                <Button className="font-bold shadow-lg shadow-primary/20 bg-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Inspección
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {INFRA_SECTIONS.map((section) => (
                    <Card key={section.id} className="bg-surface-dark border-border-dark">
                        <CardHeader>
                            <CardTitle className="text-foreground text-base font-bold flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-primary" /> {section.titulo}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {section.items.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors border border-transparent hover:border-border-dark">
                                    <span className="text-sm text-text-secondary">{item}</span>
                                    <Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-500 bg-emerald-500/5">CUMPLE</Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="bg-surface-dark border-border-dark border-dashed border-2">
                <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                        <TrafficCone className="w-5 h-5 text-amber-500" /> Plan de Mantenimiento de Infraestructura
                    </CardTitle>
                    <CardDescription>Acciones correctivas pendientes para garantizar vías seguras</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="bg-amber-500/10 p-6 rounded-xl border border-amber-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-foreground font-bold">Resane de calzada en Patio B</p>
                                <p className="text-xs text-text-secondary">Reportado en inspección del 01/03/2024</p>
                            </div>
                        </div>
                        <Button variant="outline" className="border-amber-500/20 text-amber-500 hover:bg-amber-500/10 font-bold">Ver Plan de Acción</Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-surface-dark border-border-dark">
                <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-primary" /> Historial de Inspecciones de Campo
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border-dark">
                                <TableHead className="text-foreground text-xs uppercase">Fecha</TableHead>
                                <TableHead className="text-foreground text-xs uppercase">Inspector</TableHead>
                                <TableHead className="text-foreground text-xs uppercase">Resultado</TableHead>
                                <TableHead className="text-foreground text-xs uppercase text-right">Evidencia</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {inspecciones?.map((insp) => (
                                <TableRow key={insp.id} className="border-border-dark">
                                    <TableCell className="text-foreground text-sm">{insp.fecha}</TableCell>
                                    <TableCell className="text-foreground text-sm">{insp.inspector}</TableCell>
                                    <TableCell>
                                        <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold text-[10px]">95% CUMPLIMIENTO</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" className="text-primary font-bold">Ver Fotos</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {inspecciones?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10 text-text-secondary italic">Sin registros de inspección física</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
