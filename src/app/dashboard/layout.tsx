'use client';

import type { ReactNode } from "react";
import { Sidebar } from "@/components/navigation/sidebar";
import { Header } from "@/components/navigation/header";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useUser } from "@/firebase";
import { Building2, AlertTriangle, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { profile } = useUser();

  // Si el usuario no tiene perfil pero está logueado, es un estado inconsistente o Superadmin
  const noCompanyAccess = !profile?.empresaId && profile?.rol !== 'Superadmin';

  return (
    <AuthGuard>
      <div className="flex h-screen w-full bg-background dark:bg-background-dark overflow-hidden text-foreground">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-y-auto">
          <Header />
          <main className="flex-1 p-6 bg-background dark:bg-background-dark">
            <div className="max-w-7xl mx-auto flex flex-col min-h-full">
              <div className="flex-1">
                {noCompanyAccess ? (
                  <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                    <div className="p-4 bg-amber-500/10 rounded-full text-amber-500">
                      <AlertTriangle size={48} />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Sin Empresa Asignada</h2>
                    <p className="text-text-secondary max-w-md">
                      Tu cuenta no está vinculada a ninguna empresa. Contacta al soporte para activar tu acceso al sistema RoadWise 360.
                    </p>
                    {profile?.rol === 'Superadmin' && (
                      <Link href="/admin">
                        <button className="bg-primary text-white px-6 py-2 rounded-lg font-bold">Ir al Panel Admin</button>
                      </Link>
                    )}
                  </div>
                ) : children}
              </div>
              
              <footer className="mt-12 pt-8 border-t border-border-dark flex flex-col md:flex-row justify-between items-center gap-4 pb-8">
                <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                  © {new Date().getFullYear()} RoadWise 360 - Todos los derechos reservados
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-text-secondary uppercase font-bold tracking-widest">Desarrollado por</span>
                  <a 
                    href="https://www.datenova.io" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] font-black text-primary hover:underline"
                  >
                    DATENOVA <ExternalLink className="size-3" />
                  </a>
                </div>
              </footer>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
