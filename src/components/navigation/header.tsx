
'use client';

import { Button } from "@/components/ui/button";
import { Bell, Plus, FileText, UserPlus, Truck, ClipboardCheck, User, Settings, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@/firebase";
import { signOut } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export function Header() {
  const router = useRouter();
  const auth = useAuth();
  const { profile } = useUser();
  const userAvatar = PlaceHolderImages.find(p => p.id === "user-avatar-1");

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <header className="flex items-center justify-between px-6 py-5 bg-card/80 dark:bg-background/80 backdrop-blur-sm border-b sticky top-0 z-50">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight font-headline">RoadWise 360</h1>
        <p className="text-muted-foreground text-sm mt-1">Gestión PESV • {profile?.rol === 'Superadmin' ? 'Global' : profile?.empresaId}</p>
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
            <Button variant="outline" className="font-bold border-border-dark hidden sm:flex">
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarImage src={userAvatar?.imageUrl} alt={profile?.nombreCompleto} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {profile?.nombreCompleto?.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-surface-dark border-border-dark text-white" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-bold leading-none">{profile?.nombreCompleto}</p>
                <p className="text-xs leading-none text-text-secondary">{profile?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border-dark" />
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/dashboard/configuracion')}>
              <User className="mr-2 h-4 w-4" />
              <span>Mi Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/dashboard/configuracion')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configuración</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border-dark" />
            <DropdownMenuItem className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
