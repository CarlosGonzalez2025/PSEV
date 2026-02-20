'use client';

import { Button } from "@/components/ui/button";
import { Bell, Plus, FileText, UserPlus, Truck, ClipboardCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

export function Header() {
  const router = useRouter();

  return (
    <header className="flex items-center justify-between px-6 py-5 bg-card/80 dark:bg-background/80 backdrop-blur-sm border-b sticky top-0 z-50">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight font-headline">Dashboard Principal</h1>
        <p className="text-muted-foreground text-sm mt-1">Resumen de indicadores y cumplimiento Res. 40595</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Button variant="ghost" size="icon" aria-label="Notificaciones" className="text-muted-foreground hover:text-white">
            <Bell className="w-5 h-5" />
          </Button>
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-card"></span>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="font-bold shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" />
              Acción Rápida
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-surface-dark border-border-dark text-white">
            <DropdownMenuLabel>Crear Nuevo...</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border-dark" />
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/dashboard/vehiculos')}>
              <Truck className="mr-2 h-4 w-4 text-primary" />
              <span>Vehículo</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/dashboard/conductores')}>
              <UserPlus className="mr-2 h-4 w-4 text-primary" />
              <span>Conductor</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/dashboard/inspecciones')}>
              <ClipboardCheck className="mr-2 h-4 w-4 text-primary" />
              <span>Inspección Diaria</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/dashboard/siniestros')}>
              <FileText className="mr-2 h-4 w-4 text-red-500" />
              <span>Reportar Siniestro</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
