
'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  IdCard,
  Award,
  AlertTriangle
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

const MOCK_EMPRESA_ID = "demo-empresa-123";

export default function ConductoresPage() {
  const firestore = useFirestore();

  const conductoresRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'empresas', MOCK_EMPRESA_ID, 'conductores')
    );
  }, [firestore]);

  const { data: conductores, isLoading } = useCollection(conductoresRef);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Talento Humano Vial</h1>
          <p className="text-muted-foreground mt-1">Directorio de conductores y actores viales (Paso 10 del PESV)</p>
        </div>
        <Button className="font-bold shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" />
          Registrar Conductor
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Conductores Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{conductores?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">En el sistema</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Licencias por Vencer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-500">3</div>
            <p className="text-xs text-muted-foreground mt-1">Próximos 30 días</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/5 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Cobertura Formación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-green-500">85%</div>
            <p className="text-xs text-muted-foreground mt-1">Meta: 90%</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                className="pl-10" 
                placeholder="Buscar por nombre, cédula o licencia..." 
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <th className="p-4 font-bold text-xs uppercase text-muted-foreground">Nombre</th>
                  <th className="p-4 font-bold text-xs uppercase text-muted-foreground">Identificación</th>
                  <th className="p-4 font-bold text-xs uppercase text-muted-foreground">Licencia</th>
                  <th className="p-4 font-bold text-xs uppercase text-muted-foreground">Desempeño</th>
                  <th className="p-4 font-bold text-xs uppercase text-muted-foreground">Vigencia Lic.</th>
                  <th className="p-4 text-right"></th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))
                ) : conductores?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No hay conductores registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  conductores?.map((c) => (
                    <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
                            {c.nombreCompleto?.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="font-bold text-sm">{c.nombreCompleto}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">{c.cedula}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-bold">{c.categoriaLicencia}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 w-32">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-primary">Score</span>
                            <span>{c.puntosGamificacion || 0}/100</span>
                          </div>
                          <Progress value={c.puntosGamificacion || 0} className="h-1" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Vigente</Badge>
                          <span className="text-[10px] text-muted-foreground">{c.fechaVencimientoLicencia}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
