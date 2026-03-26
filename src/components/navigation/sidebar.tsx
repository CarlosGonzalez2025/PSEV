'use client';

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BarChartBig,
  Building2,
  ClipboardCheck,
  ClipboardList,
  ExternalLink,
  FileArchive,
  FileText,
  Flame,
  Fuel,
  GraduationCap,
  Handshake,
  HardHat,
  LayoutDashboard,
  ListTodo,
  Map,
  Megaphone,
  Menu,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Truck,
  UserCheck,
  UserCog,
  Users,
  Wrench,
} from "lucide-react";

import { useUser } from "@/firebase";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type NavItem = {
  href?: string;
  icon?: typeof LayoutDashboard;
  isSeparator?: boolean;
  isTitle?: boolean;
  label: string;
  roles?: Array<"Superadmin" | "Admin" | "Usuario" | "RRHH" | "Lider_PESV" | "Gestor_Flota" | "Conductor" | "Auditor">;
};

const navItems: NavItem[] = [
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

  { label: "", isSeparator: true },
  { href: "/dashboard/usuarios", icon: UserCog, label: "Usuarios del Sistema", roles: ["Superadmin", "Admin", "RRHH"] },
  { href: "/dashboard/configuracion", icon: Settings, label: "Configuración" },
];

function SidebarContent({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const { profile } = useUser();
  const userAvatar = PlaceHolderImages.find((placeholder) => placeholder.id === "user-avatar-1");

  const renderNavLink = (item: NavItem, key: string) => {
    if (!item.href) return null;

    const isActive = pathname === item.href;
    const link = (
      <Link
        key={key}
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 group",
          isActive
            ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20"
            : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
        )}
      >
        {item.icon ? (
          <item.icon
            className={cn(
              "h-5 w-5 shrink-0 transition-transform group-hover:scale-110",
              isActive ? "text-primary-foreground" : "text-primary"
            )}
          />
        ) : null}
        <span className="min-w-0 truncate">{item.label}</span>
      </Link>
    );

    return mobile ? (
      <SheetClose asChild key={key}>
        {link}
      </SheetClose>
    ) : (
      link
    );
  };

  return (
    <div className="flex h-full flex-col justify-between gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 border-b border-border-dark px-2 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
            <Shield className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-headline text-lg font-black leading-none tracking-tight text-foreground">
              RoadWise 360
            </h1>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              por DateNova
            </p>
          </div>
        </div>

        <nav className="mt-2 flex flex-col gap-1">
          {profile?.rol === "Superadmin"
            ? renderNavLink(
                {
                  href: "/admin",
                  icon: ShieldAlert,
                  label: "Panel Maestro SaaS",
                },
                "admin-panel"
              )
            : null}

          {navItems.map((item, index) => {
            if (item.isTitle) {
              return (
                <div key={`title-${index}`} className="px-3 pb-2 pt-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {item.label}
                  </p>
                </div>
              );
            }

            if (item.isSeparator) {
              return <div key={`separator-${index}`} className="my-4 border-t border-border-dark" />;
            }

            if (item.roles && profile?.rol && !item.roles.includes(profile.rol)) {
              return null;
            }

            return renderNavLink(item, `nav-${index}`);
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 rounded-xl border border-border-dark bg-secondary/20 px-3 py-4">
          {userAvatar ? (
            <div className="relative shrink-0">
              <Image
                src={userAvatar.imageUrl}
                alt={userAvatar.description}
                width={40}
                height={40}
                className="rounded-full border-2 border-primary/20"
                data-ai-hint={userAvatar.imageHint}
              />
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-green-500" />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-full bg-muted" />
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-none text-foreground">
              {profile?.rol === "Superadmin" ? "Super Admin" : profile?.nombreCompleto || "Usuario"}
            </p>
            <p className="mt-1 truncate text-[10px] font-medium leading-none text-muted-foreground">
              {profile?.rol === "Superadmin" ? "DateNova Global" : `Empresa: ${profile?.empresaId || "Sin asignar"}`}
            </p>
          </div>
        </div>

        <div className="px-2 pt-2">
          <a
            href="https://www.datenova.io"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2 transition-colors hover:bg-primary/10"
          >
            <span className="text-[10px] font-black tracking-widest text-primary">WWW.DATENOVA.IO</span>
            <ExternalLink className="h-3 w-3 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
          </a>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-border-dark bg-card p-4 md:flex">
      <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
        <SidebarContent />
      </div>
    </aside>
  );
}

export function MobileNavigation() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 border-border-dark bg-card text-foreground md:hidden"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[88vw] max-w-[22rem] border-r border-border-dark bg-card p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Menú de navegación</SheetTitle>
          <SheetDescription>Accede a los módulos principales del dashboard RoadWise 360.</SheetDescription>
        </SheetHeader>
        <div className="h-full overflow-y-auto p-4 custom-scrollbar">
          <SidebarContent mobile />
        </div>
      </SheetContent>
    </Sheet>
  );
}
