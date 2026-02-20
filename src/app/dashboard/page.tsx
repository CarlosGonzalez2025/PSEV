
'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { KpiCard } from "@/components/dashboard/kpi-card";
import { BadgeCheck, AlertTriangle, Truck, Users, TrendingDown, TrendingUp, Calendar, Zap } from "lucide-react";
import { ComplianceChart } from "@/components/dashboard/compliance-chart";
import { MaintenanceProgress } from "@/components/dashboard/maintenance-progress";
import { AlertsWidget } from "@/components/dashboard/alerts-widget";
import { MapWidget } from "@/components/dashboard/map-widget";
import { Button } from "@/components/ui/button";

const MOCK_EMPRESA_ID = "demo-empresa-123";

export default function DashboardPage() {
  const firestore = useFirestore();

  const vehiculosQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'empresas', MOCK_EMPRESA_ID, 'vehiculos'), limit(50));
  }, [firestore]);

  const conductoresQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'empresas', MOCK_EMPRESA_ID, 'conductores'), limit(100));
  }, [firestore]);

  const { data: vehiculos } = useCollection(vehiculosQuery);
  const { data: conductores } = useCollection(conductoresQuery);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Panel de Control</h1>
          <p className="text-muted-foreground text-lg">Resumen estratégico de seguridad vial (Res. 40595)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="font-bold">
            <Calendar className="w-4 h-4 mr-2" />
            Octubre 2023
          </Button>
          <Button className="font-bold shadow-lg shadow-primary/20">
            <Zap className="w-4 h-4 mr-2" />
            Reporte SISI
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Nivel de Madurez"
          value="Avanzado"
          icon={BadgeCheck}
          badge="Auditado"
          badgeVariant="success"
          progress={85}
          progressText="85% implementado (Paso 20)"
          iconBgColor="bg-primary/10"
          iconColor="text-primary"
        />
        <KpiCard
          title="Tasa Siniestralidad"
          value="1.2%"
          icon={AlertTriangle}
          badge="-0.5%"
          trendIcon={TrendingDown}
          badgeVariant="success"
          progressText="Meta legal: < 2.0%"
          iconBgColor="bg-red-500/10"
          iconColor="text-red-500"
        />
        <KpiCard
          title="Disponibilidad Flota"
          value={`${vehiculos?.filter(v => v.estadoOperativo === 'Operativo').length || 0}`}
          subValue={`/${vehiculos?.length || 0}`}
          icon={Truck}
          badge="Operativa"
          badgeVariant="secondary"
          progressText="5 en mantenimiento correctivo"
          iconBgColor="bg-orange-500/10"
          iconColor="text-orange-500"
        />
        <KpiCard
          title="Talento Vial"
          value={`${conductores?.length || 0}`}
          icon={Users}
          badge="Habilitados"
          badgeVariant="success"
          progressText="100% con ARL Nivel V"
          iconBgColor="bg-purple-500/10"
          iconColor="text-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <ComplianceChart />
          <MaintenanceProgress />
        </div>
        <div className="flex flex-col gap-6">
          <AlertsWidget />
          <MapWidget />
        </div>
      </div>
    </div>
  );
}
