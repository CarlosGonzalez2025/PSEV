
'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileCheck,
  ClipboardList
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PASOS_AUDITORIA = [
  { paso: 1, nombre: "Líder del PESV", fase: "Planear" },
  { paso: 2, nombre: "Comité de Seguridad Vial", fase: "Planear" },
  { paso: 3, nombre: "Política de Seguridad Vial", fase: "Planear" },
  { paso: 4, nombre: "Liderazgo y Recursos", fase: "Planear" },
  { paso: 5, nombre: "Diagnóstico", fase: "Planear" },
  { paso: 6, nombre: "Caracterización de Vehículos", fase: "Planear" },
  { paso: 7, nombre: "Objetivos y Metas", fase: "Planear" },
  { paso: 8, nombre: "Programas de Gestión de Riesgos", fase: "Planear" },
  { paso: 9, nombre: "Plan Anual de Trabajo", fase: "Hacer" },
  { paso: 10, nombre: "Competencia y Formación", fase: "Hacer" },
  { paso: 11, nombre: "Responsabilidades PESV", fase: "Hacer" },
  { paso: 12, nombre: "Emergencias Viales", fase: "Hacer" },
  { paso: 13, nombre: "Investigación de Siniestros", fase: "Hacer" },
  { paso: 14, nombre: "Infraestructura Física", fase: "Hacer" },
  { paso: 15, nombre: "Mantenimiento Vehículos", fase: "Hacer" },
  { paso: 16, nombre: "Equipos de Seguridad", fase: "Hacer" },
  { paso: 17, nombre: "Rutas Seguras", fase: "Hacer" },
  { paso: 18, nombre: "Gestión de Contratistas", fase: "Hacer" },
  { paso: 19, nombre: "Retención Documental", fase: "Hacer" },
  { paso: 20, nombre: "Indicadores SISI", fase: "Verificar" },
  { paso: 21, nombre: "Registro de Siniestros", fase: "Verificar" },
  { paso: 22, nombre: "Auditoría Anual", fase: "Verificar" },
  { paso: 23, nombre: "Revisión por la Gerencia", fase: "Verificar" },
  { paso: 24, nombre: "Acciones de Mejora", fase: "Actuar" }
];

export default function AuditoriasPage() {
  const firestore = useFirestore();
  const { profile } = useUser();

  const auditoriasRef = useMemoFirebase(() => {
    if (!firestore || !profile?.empresaId) return null;
    return query(
      collection(firestore, 'empresas', profile.empresaId, 'auditorias'),
      orderBy('fechaProgramada', 'desc')
    );
  }, [firestore, profile?.empresaId]);

  const { data: auditorias, isLoading } = useCollection(auditoriasRef);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Auditoría Integral PESV</h1>
          <p className="text-text-secondary mt-1">Verificación técnica de los 24 pasos (Resolución 40595 de 2022)</p>
        </div>
        <Button className="font-bold shadow-lg shadow-primary/20 bg-primary">
          <Plus className="w-4 h-4 mr-2" />
          Iniciar Auditoría 2024
        </Button>
      </div>

      <Tabs defaultValue="historial" className="w-full">
        <TabsList className="bg-surface-dark border-border-dark">
          <TabsTrigger value="historial" className="data-[state=active]:bg-primary">Historial de Auditorías</TabsTrigger>
          <TabsTrigger value="checklist" className="data-[state=active]:bg-primary">Checklist de Referencia</TabsTrigger>
        </TabsList>

        <TabsContent value="historial" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-surface-dark border-border-dark">
              <CardHeader className="pb-2">
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Cumplimiento Global</p>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-foreground">88%</div>
                <Progress value={88} className="h-1.5 mt-2 bg-white/10" />
              </CardContent>
            </Card>
            <Card className="bg-surface-dark border-border-dark border-l-4 border-l-emerald-500">
              <CardHeader className="pb-2">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Pasos Cumplidos</p>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-foreground">21 / 24</div>
                <p className="text-[10px] text-text-secondary mt-2">Auditado Oct 2023</p>
              </CardContent>
            </Card>
            <Card className="bg-surface-dark border-border-dark border-l-4 border-l-red-500">
              <CardHeader className="pb-2">
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Hallazgos Abiertos</p>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-foreground">3</div>
                <p className="text-[10px] text-red-500 mt-2 flex items-center gap-1 font-bold">
                  <AlertCircle className="w-3 h-3" /> Requieren Plan de Acción
                </p>
              </CardContent>
            </Card>
            <Card className="bg-surface-dark border-border-dark">
              <CardHeader className="pb-2">
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Próxima Auditoría</p>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-black text-foreground">Dic 15, 2024</div>
                <Badge variant="outline" className="mt-2 text-[10px] border-primary/20 text-primary uppercase">Programada</Badge>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-surface-dark border-border-dark shadow-2xl overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-border-dark">
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" /> Ejecuciones Recientes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border-dark hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase text-text-secondary">Fecha</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-text-secondary">Auditor Responsable</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-text-secondary text-center">Score</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-text-secondary">Estado</TableHead>
                    <th className="text-right"></th>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i} className="animate-pulse border-border-dark">
                        <TableCell colSpan={5} className="h-12 bg-white/5" />
                      </TableRow>
                    ))
                  ) : auditorias?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-text-secondary italic">No se han registrado auditorías en este periodo.</TableCell>
                    </TableRow>
                  ) : (
                    auditorias?.map(aud => (
                      <TableRow key={aud.id} className="border-border-dark hover:bg-white/5 transition-colors">
                        <TableCell className="text-foreground text-sm font-bold">{aud.fechaProgramada?.split('T')[0]}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="size-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">A1</div>
                            <span className="text-sm text-text-secondary">{aud.auditor || 'Auditor Externo'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-black text-emerald-500">{aud.puntuacionObtenida}%</span>
                            <div className="w-16 bg-white/10 h-1 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full" style={{ width: `${aud.puntuacionObtenida}%` }}></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={aud.estado === 'Ejecutada' ? 'bg-emerald-500/10 text-emerald-500 border-none' : 'bg-primary/10 text-primary border-none text-[10px]'}>
                            {aud.estado?.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/10">Descargar PDF</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist" className="mt-6">
          <Card className="bg-surface-dark border-border-dark">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" /> Estructura de Verificación (24 Pasos)
              </CardTitle>
              <CardDescription>Criterios de evaluación basados en la Resolución 40595</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20">
                <Table>
                  <TableHeader className="sticky top-0 bg-surface-dark z-10 shadow-sm">
                    <TableRow className="border-border-dark">
                      <TableHead className="w-16 text-foreground text-center">Paso</TableHead>
                      <TableHead className="text-foreground">Requisito</TableHead>
                      <TableHead className="text-foreground">Fase de Ciclo</TableHead>
                      <TableHead className="text-foreground text-right">Módulo Vinculado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {PASOS_AUDITORIA.map((p) => (
                      <TableRow key={p.paso} className="border-border-dark group hover:bg-white/[0.02]">
                        <TableCell className="text-center font-black text-primary text-sm">{p.paso}</TableCell>
                        <TableCell className="text-xs text-foreground group-hover:text-primary transition-colors">{p.nombre}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[9px] uppercase border-border-dark text-text-secondary">{p.fase}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-7 text-[10px] text-text-secondary italic">Ir al Módulo</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
