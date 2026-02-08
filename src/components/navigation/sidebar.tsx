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
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Inicio" },
  { label: "Ciclo PHVA", isTitle: true },
  { href: "#", icon: ClipboardList, label: "Planear" },
  { href: "#", icon: Truck, label: "Hacer" },
  { href: "#", icon: ClipboardCheck, label: "Verificar" },
  { href: "#", icon: BarChartBig, label: "Actuar" },
  { isSeparator: true },
  { href: "#", icon: Settings, label: "Configuración" },
];

const userAvatar = PlaceHolderImages.find(p => p.id === "user-avatar-1");

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 flex-col justify-between border-r bg-card p-4">
      <div className="flex flex-col gap-4">
        <div className="flex gap-3 items-center px-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
            <Shield className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-foreground text-base font-bold leading-normal font-headline">SIG-SV</h1>
            <p className="text-muted-foreground text-xs font-normal leading-normal">Gestión Seguridad Vial</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1 mt-4">
          {navItems.map((item, index) => {
            if (item.isTitle) {
              return (
                <div key={index} className="px-3 pt-4 pb-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{item.label}</p>
                </div>
              );
            }
            if (item.isSeparator) {
              return <div key={index} className="my-2 border-t border-border" />;
            }
            return (
              <Link
                key={index}
                href={item.href || "#"}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  pathname === item.href
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground/80 hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <p className="text-sm">{item.label}</p>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 px-3 py-4 border-t border-border mt-2">
          {userAvatar ? (
            <Image
              src={userAvatar.imageUrl}
              alt={userAvatar.description}
              width={40}
              height={40}
              className="rounded-full"
              data-ai-hint={userAvatar.imageHint}
            />
          ) : <div className="w-10 h-10 rounded-full bg-muted"></div>}
          <div className="flex flex-col">
            <p className="text-foreground text-sm font-medium leading-none">Carlos R.</p>
            <p className="text-muted-foreground text-xs leading-none mt-1">Admin. Flota</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
