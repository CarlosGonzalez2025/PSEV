'use client';

import { Bell, ClipboardCheck, FileText, LogOut, Plus, Settings, Truck, User, UserPlus } from "lucide-react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

import { useAuth, useUser } from "@/firebase";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNavigation } from "@/components/navigation/sidebar";

export function Header() {
  const router = useRouter();
  const auth = useAuth();
  const { profile } = useUser();
  const userAvatar = PlaceHolderImages.find((placeholder) => placeholder.id === "user-avatar-1");

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-card/90 px-4 py-4 backdrop-blur-sm dark:bg-background/90 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <MobileNavigation />
          <div className="min-w-0">
            <h1 className="truncate font-headline text-lg font-bold tracking-tight text-foreground sm:text-2xl">
              RoadWise 360
            </h1>
            <p className="hidden truncate text-sm text-muted-foreground sm:block">
              Gestión PESV • {profile?.rol === "Superadmin" ? "Global" : profile?.empresaId}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />

          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notificaciones"
              className="h-9 w-9 text-muted-foreground hover:text-foreground sm:h-10 sm:w-10"
            >
              <Bell className="h-5 w-5" />
            </Button>
            <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-red-500" />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="hidden border-border-dark font-bold lg:flex">
                <Plus className="mr-2 h-4 w-4" />
                Acción Rápida
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 border-border-dark bg-surface-dark text-foreground" align="end">
              <DropdownMenuLabel>Crear Nuevo...</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border-dark" />
              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/dashboard/vehiculos")}>
                <Truck className="mr-2 h-4 w-4 text-primary" />
                <span>Vehículo</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/dashboard/conductores")}>
                <UserPlus className="mr-2 h-4 w-4 text-primary" />
                <span>Conductor</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/dashboard/inspecciones")}>
                <ClipboardCheck className="mr-2 h-4 w-4 text-primary" />
                <span>Inspección Diaria</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/dashboard/siniestros")}>
                <FileText className="mr-2 h-4 w-4 text-red-500" />
                <span>Reportar Siniestro</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full sm:h-10 sm:w-10">
                <Avatar className="h-9 w-9 border-2 border-primary/20 sm:h-10 sm:w-10">
                  <AvatarImage src={userAvatar?.imageUrl} alt={profile?.nombreCompleto} />
                  <AvatarFallback className="bg-primary/10 font-bold text-primary">
                    {profile?.nombreCompleto?.split(" ").map((name) => name[0]).join("")}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 border-border-dark bg-surface-dark text-foreground" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold leading-none">{profile?.nombreCompleto}</p>
                  <p className="text-xs leading-none text-text-secondary">{profile?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border-dark" />
              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/dashboard/configuracion")}>
                <User className="mr-2 h-4 w-4" />
                <span>Mi Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/dashboard/configuracion")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border-dark" />
              <DropdownMenuItem
                className="cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-500"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
