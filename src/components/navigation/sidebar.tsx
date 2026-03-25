'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  Flame,
  ClipboardList,
  Truck,
  Handshake,
  Building2,
  ClipboardCheck,
  FileArchive,
  Megaphone,
  ShieldCheck,
  BarChartBig,
  Settings,
  Users,
  UserCheck,
  Map,
  FileText,
  AlertTriangle,
  Activity,
  ListTodo,
  HardHat,
  GraduationCap,
  Wrench,
  Fuel,
  ShieldAlert,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useUser } from "@/firebase";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Inicio" },

  { label: "Planear (Fase 1)", isTitle: true },
  { href: "/dashboard/liderazgo", icon: UserCheck, label: "Liderazgo y Recursos" },
  { href: "/dashboard/diagnostico", icon: ClipboardList, label: "Diagnóstico PESV" },
  { href: "/dashboard/riesgos", icon: AlertTriangle, label: "Matriz de Riesgos" },
  { href: "/dashboard/rutas", icon: Map, label: "Rutas y Puntos Críticos" },
  { href: "/dashboard/programas-riesgo", icon: ShieldCheck, label: "Programas de Seguridad" },
  { href: "/dashboard/politica", icon: FileText, label: "Política y Metas" },

  { label: "Hacer (Fase 2)", isTitle: true },
  { href: "/dashboard/vehiculos", icon: Truck, label: "Gestión de Flota" },
  { href: "/dashboard/conductores", icon: Users, label: "Talento Humano" },
  { href: "/dashboard/contratistas", icon: Handshake, label: "Gestión de Contratistas" },
  { href: "/dashboard/inspecciones", icon: ClipboardCheck, label: "Inspecciones Diarias" },
  { href: "/dashboard/infraestructura", icon: Building2, label: "Infraestructura Física" },
  { href: "/dashboard/mantenimiento", icon: Wrench, label: "Mantenimiento" },
  { href: "/dashboard/viajes", icon: Activity, label: "Planificación Viajes" },
  { href: "/dashboard/emergencias", icon: Flame, label: "Emergencias Viales" },
  { href: "/dashboard/documental", icon: FileArchive, label: "Retención Documental" },
  { href: "/dashboard/plan-trabajo", icon: ListTodo, label: "Plan de Trabajo" },
  { href: "/dashboard/formacion", icon: GraduationCap, label: "Plan de Formación" },
  { href: "/dashboard/combustible", icon: Fuel, label: "Eficiencia Energética" },

  { label: "Verificar (Fase 3)", isTitle: true },
  { href: "/dashboard/siniestros", icon: AlertTriangle, label: "Siniestralidad" },
  { href: "/dashboard/indicadores", icon: BarChartBig, label: "Indicadores SISI" },
  { href: "/dashboard/auditorias", icon: Shield, label: "Auditorías Internas" },

  { label: "Actuar (Fase 4)", isTitle: true },
  { href: "/dashboard/comunicacion", icon: Megaphone, label: "Campañas y Boletines" },
  { href: "/dashboard/revision-gerencial", icon: ShieldCheck, label: "Revisión Gerencial" },

  { isSeparator: true },
  { href: "/dashboard/configuracion", icon: Settings, label: "Configuración" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, profile } = useUser();
  const userAvatar = PlaceHolderImages.find(p => p.id === "user-avatar-1");

  return (
    <aside className="hidden md:flex w-72 flex-col justify-between border-r bg-card p-4 overflow-y-auto custom-scrollbar border-border-dark">
      <div className="flex flex-col gap-4">
        <div className="flex gap-3 items-center px-2 py-4 border-b border-border-dark">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-foreground text-lg font-black leading-none tracking-tight font-headline">RoadWise 360</h1>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1">por DateNova</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1 mt-2">
          {profile?.rol === 'Superadmin' && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group mb-4",
                pathname === "/admin"
                  ? "bg-red-500 text-white font-bold"
                  : "bg-red-500/10 text-red-500 hover:bg-red-500/20"
              )}
            >
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <p className="text-sm">Panel Maestro SaaS</p>
            </Link>
          )}

          {navItems.map((item, index) => {
            if (item.isTitle) {
              return (
                <div key={index} className="px-3 pt-6 pb-2">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{item.label}</p>
                </div>
              );
            }
            if (item.isSeparator) {
              return <div key={index} className="my-4 border-t border-border-dark" />;
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
                {item.icon && <item.icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-primary-foreground" : "text-primary")} />}
                <p className="text-sm">{item.label}</p>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-2 mt-8">
        <div className="flex items-center gap-3 px-3 py-4 border border-border-dark bg-secondary/20 rounded-xl">
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
            <p className="text-foreground text-sm font-bold leading-none truncate">
              {profile?.rol === 'Superadmin' ? 'Super Admin' : profile?.nombreCompleto || 'Usuario'}
            </p>
            <p className="text-muted-foreground text-[10px] font-medium leading-none mt-1 truncate">
              {profile?.rol === 'Superadmin' ? 'DateNova Global' : `Empresa: ${profile?.empresaId || 'Sin asignar'}`}
            </p>
          </div>
        </div>
        <div className="px-2 pt-4">
          <a
            href="https://www.datenova.io"
            target="_blank"
            className="flex items-center justify-between group px-3 py-2 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors"
          >
            <span className="text-[10px] font-black text-primary tracking-widest">WWW.DATENOVA.IO</span>
            <ExternalLink className="size-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>
      </div>
    </aside>
  );
}
