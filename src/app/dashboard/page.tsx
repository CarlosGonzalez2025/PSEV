import { KpiCard } from "@/components/dashboard/kpi-card";
import { BadgeCheck, AlertTriangle, Truck, Users, TrendingDown } from "lucide-react";
import { ComplianceChart } from "@/components/dashboard/compliance-chart";
import { MaintenanceProgress } from "@/components/dashboard/maintenance-progress";
import { AlertsWidget } from "@/components/dashboard/alerts-widget";
import { MapWidget } from "@/components/dashboard/map-widget";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Nivel de Obligatoriedad"
          value="Avanzado"
          icon={BadgeCheck}
          badge="Cumplimiento"
          badgeVariant="success"
          progress={85}
          progressText="85% implementado"
          iconBgColor="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-primary"
        />
        <KpiCard 
          title="Tasa de Siniestralidad"
          value="1.2%"
          icon={AlertTriangle}
          badge="-0.5%"
          trendIcon={TrendingDown}
          badgeVariant="success"
          progressText="vs mes anterior"
          iconBgColor="bg-red-100 dark:bg-red-900/30"
          iconColor="text-red-500"
        />
        <KpiCard 
          title="Flota Activa"
          value="45"
          subValue="/50"
          icon={Truck}
          badge="En ruta"
          badgeVariant="secondary"
          progressText="5 vehículos en mantenimiento"
          iconBgColor="bg-orange-100 dark:bg-orange-900/30"
          iconColor="text-orange-500"
        />
        <KpiCard 
          title="Conductores Habilitados"
          value="58"
          icon={Users}
          badge="Activos"
          badgeVariant="success"
          progressText="100% con ARL vigente"
          iconBgColor="bg-purple-100 dark:bg-purple-900/30"
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
