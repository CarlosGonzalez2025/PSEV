
'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Plus, 
  Truck, 
  Search, 
  Filter, 
  MoreVertical, 
  Calendar, 
  AlertCircle,
  FileCheck
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

// Mock para desarrollo inicial - En producción usaremos el empresaId del usuario autenticado
const MOCK_EMPRESA_ID = "demo-empresa-123";

export default function VehiculosPage() {
  const firestore = useFirestore();
  const [searchTerm, setSearchPlaceholder] = useState("");

  const vehiculosRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'empresas', MOCK_EMPRESA_ID, 'vehiculos')
    );
  }, [firestore]);

  const { data: vehiculos, isLoading } = useCollection(vehiculosRef);

  const getStatusBadge = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'operativo':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Operativo</Badge>;
      case 'en taller':
        return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">En Taller</Badge>;
      case 'bloqueado':
        return <Badge variant="destructive">Bloqueado</Badge>;
      default:
        return <Badge variant="secondary">{estado || 'N/A'}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Gestión de Flota</h1>
          <p className="text-muted-foreground mt-1">Inventario y estado de activos (Paso 16 del PESV)</p>
        </div>
        <Button className="font-bold shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" />
          Registrar Vehículo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Total Vehículos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{vehiculos?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Activos en plataforma</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/5 border-red-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Alertas Críticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-red-500">2</div>
            <p className="text-xs text-muted-foreground mt-1">Documentos vencidos</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-500/5 border-orange-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Mantenimientos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-orange-500">5</div>
            <p className="text-xs text-muted-foreground mt-1">Programados esta semana</p>
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
                placeholder="Buscar por placa, modelo o VIN..." 
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
              <Button variant="outline" size="sm">
                <FileCheck className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <th className="p-4 font-bold text-xs uppercase text-muted-foreground">Placa</th>
                  <th className="p-4 font-bold text-xs uppercase text-muted-foreground">Vehículo</th>
                  <th className="p-4 font-bold text-xs uppercase text-muted-foreground">Kilometraje</th>
                  <th className="p-4 font-bold text-xs uppercase text-muted-foreground">Estado</th>
                  <th className="p-4 font-bold text-xs uppercase text-muted-foreground">Próx. Mantenimiento</th>
                  <th className="p-4 text-right"></th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))
                ) : vehiculos?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No hay vehículos registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  vehiculos?.map((v) => (
                    <TableRow key={v.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono font-bold">{v.placa}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{v.marca} {v.modelo}</span>
                          <span className="text-[10px] text-muted-foreground">VIN: {v.vin?.slice(-6)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{v.kilometrajeActual?.toLocaleString()} km</TableCell>
                      <TableCell>{getStatusBadge(v.estadoOperativo)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>15 Nov 2023</span>
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
