'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  ClipboardList,
  Truck,
  ClipboardCheck,
  BarChartBig,
  Settings,
  Users,
  Map,
  FileText,
  AlertTriangle,
  Activity,
  HardHat,
  GraduationCap,
  Wrench,
  Fuel,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useUser } from "@/firebase";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Inicio" },
  
  { label: "Planear (Fase 1)", isTitle: true },
  { href: "/dashboard/diagnostico", icon: ClipboardList, label: "Diagnóstico PESV" },
  { href: "/dashboard/riesgos", icon: AlertTriangle, label: "Matriz de Riesgos" },
  { href: "/dashboard/rutas", icon: Map, label: "Rutas y Puntos Críticos" },
  { href: "/dashboard/politica", icon: FileText, label: "Política y Metas" },
  
  { label: "Hacer (Fase 2)", isTitle: true },
  { href: "/dashboard/vehiculos", icon: Truck, label: "Gestión de Flota" },
  { href: "/dashboard/conductores", icon: Users, label: "Talento Humano" },
  { href: "/dashboard/inspecciones", icon: ClipboardCheck, label: "Inspecciones Diarias" },
  { href: "/dashboard/mantenimiento", icon: Wrench, label: "Mantenimiento" },
  { href: "/dashboard/viajes", icon: Activity, label: "Planificación Viajes" },
  { href: "/dashboard/formacion", icon: GraduationCap, label: "Plan de Formación" },
  { href: "/dashboard/combustible", icon: Fuel, label: "Eficiencia Energética" },
  
  { label: "Verificar (Fase 3)", isTitle: true },
  { href: "/dashboard/siniestros", icon: AlertTriangle, label: "Siniestralidad" },
  { href: "/dashboard/indicadores", icon: BarChartBig, label: "Indicadores SISI" },
  { href: "/dashboard/auditorias", icon: Shield, label: "Auditorías Internas" },
  
  { label: "Actuar (Fase 4)", isTitle: true },
  { href: "/dashboard/planes-accion", icon: HardHat, label: "Planes de Acción" },
  
  { isSeparator: true },
  { href: "/dashboard/configuracion", icon: Settings, label: "Configuración" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const userAvatar = PlaceHolderImages.find(p => p.id === "user-avatar-1");

  return (
    <aside className="hidden md:flex w-72 flex-col justify-between border-r bg-card p-4 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col gap-4">
        <div className="flex gap-3 items-center px-2 py-4 border-b">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-foreground text-lg font-black leading-none tracking-tight font-headline">RoadWise 360</h1>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mt-1">Gestión PESV & SST</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1 mt-2">
          {navItems.map((item, index) => {
            if (item.isTitle) {
              return (
                <div key={index} className="px-3 pt-6 pb-2">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{item.label}</p>
                </div>
              );
            }
            if (item.isSeparator) {
              return <div key={index} className="my-4 border-t border-border" />;
            }
            const isActive = pathname === item.href;
            return (
              <Link
                key={index}
                href={item.href || "#"}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-primary-foreground" : "text-primary")} />
                <p className="text-sm">{item.label}</p>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex flex-col gap-2 mt-8">
        <div className="flex items-center gap-3 px-3 py-4 border-t border-border bg-secondary/20 rounded-xl">
          {userAvatar ? (
            <div className="relative">
              <Image
                src={userAvatar.imageUrl}
                alt={userAvatar.description}
                width={40}
                height={40}
                className="rounded-full border-2 border-primary/20"
                data-ai-hint={userAvatar.imageHint}
              />
              <div className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-card"></div>
            </div>
          ) : <div className="w-10 h-10 rounded-full bg-muted"></div>}
          <div className="flex flex-col overflow-hidden">
            <p className="text-foreground text-sm font-bold leading-none truncate">{user?.email === 'info@datnova.io' ? 'Super Admin' : 'Usuario Demo'}</p>
            <p className="text-muted-foreground text-[10px] font-medium leading-none mt-1 truncate">{user?.email || 'Sesión Anónima'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}