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
      <div className="flex min-h-screen w-full overflow-hidden bg-background text-foreground dark:bg-background-dark">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 dark:bg-background-dark sm:p-6">
            <div className="mx-auto flex min-h-full w-full max-w-7xl min-w-0 flex-col">
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
              
              <footer className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border-dark pb-6 pt-6 text-center sm:mt-12 sm:pb-8 md:flex-row md:text-left">
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                  © {new Date().getFullYear()} RoadWise 360 - Todos los derechos reservados
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Desarrollado por</span>
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
