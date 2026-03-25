
'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Megaphone,
    Plus,
    Mail,
    MessageSquare,
    Users,
    CheckCircle2,
    Image as ImageIcon,
    Send,
    Trash2
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

export default function ComunicacionPage() {
    const firestore = useFirestore();
    const { profile } = useUser();

    const campañasRef = useMemoFirebase(() => {
        if (!firestore || !profile?.empresaId) return null;
        return collection(firestore, 'empresas', profile.empresaId, 'pesv_comunicacion');
    }, [firestore, profile?.empresaId]);

    const { data: campañas } = useCollection(campañasRef);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Comunicación y Difusión</h1>
                    <p className="text-text-secondary mt-1">Gestión de campañas, boletines y evidencias de enterado (Paso 24)</p>
                </div>
                <Button className="font-bold shadow-lg shadow-primary/20 bg-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Campaña
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-surface-dark border-border-dark flex items-center p-6 gap-4">
                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Megaphone className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-foreground">{campañas?.length || 0}</p>
                        <p className="text-[10px] font-bold text-text-secondary uppercase">Campañas este año</p>
                    </div>
                </Card>
                <Card className="bg-surface-dark border-border-dark flex items-center p-6 gap-4">
                    <div className="size-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-foreground">85%</p>
                        <p className="text-[10px] font-bold text-text-secondary uppercase">Alcance promedio</p>
                    </div>
                </Card>
                <Card className="bg-surface-dark border-border-dark flex items-center p-6 gap-4">
                    <div className="size-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-foreground">12</p>
                        <p className="text-[10px] font-bold text-text-secondary uppercase">Boletines enviados</p>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8">
                    <Card className="bg-surface-dark border-border-dark">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-primary" /> Historial de Difusiones
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border-dark bg-white/5">
                                        <TableHead className="text-foreground font-bold">Campaña / Boletín</TableHead>
                                        <TableHead className="text-foreground font-bold">Medio</TableHead>
                                        <TableHead className="text-foreground font-bold text-center">Impacto</TableHead>
                                        <TableHead className="text-right"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {campañas?.map((c) => (
                                        <TableRow key={c.id} className="border-border-dark hover:bg-white/5 transition-colors text-sm">
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-foreground font-bold">{c.titulo}</span>
                                                    <span className="text-[10px] text-text-secondary">{c.fecha}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-[10px] border-primary/20 text-primary">{c.medio || 'App / Email'}</Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-foreground font-bold">{c.leidos || 0} / {c.total || 0}</span>
                                                    <div className="w-20 bg-white/10 h-1 rounded-full overflow-hidden">
                                                        <div className="bg-emerald-500 h-full" style={{ width: `${(c.leidos / c.total) * 100}%` }} />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="text-text-secondary hover:text-foreground"><Send className="size-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {campañas?.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-10 text-text-secondary italic">No hay campañas registradas.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                <aside className="lg:col-span-4 space-y-6">
                    <Card className="bg-surface-dark border-border-dark">
                        <CardHeader>
                            <CardTitle className="text-foreground text-sm font-bold uppercase">Canales Activos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-border-dark">
                                <div className="flex items-center gap-3">
                                    <Mail className="w-4 h-4 text-primary" />
                                    <span className="text-foreground text-xs font-bold">Email Corporativo</span>
                                </div>
                                <Badge className="bg-emerald-500">Sincronizado</Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-border-dark">
                                <div className="flex items-center gap-3">
                                    <MessageSquare className="w-4 h-4 text-emerald-500" />
                                    <span className="text-foreground text-xs font-bold">Push Notifications (App)</span>
                                </div>
                                <Badge className="bg-emerald-500">Sincronizado</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="bg-primary/10 p-6 rounded-2xl border border-primary/20 relative overflow-hidden">
                        <h3 className="text-primary font-black uppercase text-sm italic">Sugerencia IA</h3>
                        <p className="text-foreground text-sm mt-2 relative z-10">
                            La tasa de siniestralidad por distracción ha subido un 5%. Se recomienda lanzar la campaña: **"Celular en Silencio, Vida en Marcha"**.
                        </p>
                        <Button className="w-full mt-4 bg-primary text-white font-bold shadow-lg shadow-primary/20">
                            Crear Campaña Sugerida
                        </Button>
                        <Megaphone className="absolute -bottom-4 -right-4 w-20 h-20 text-primary/10 rotate-12" />
                    </div>
                </aside>
            </div>
        </div>
    );
}
