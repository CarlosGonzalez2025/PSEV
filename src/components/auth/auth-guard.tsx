'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, getDoc } from 'firebase/firestore';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isValidatingMembership, setIsValidatingMembership] = useState(true);
  const [membershipError, setMembershipError] = useState<string | null>(null);

  useEffect(() => {
    async function validateMembership() {
      if (isUserLoading) return;
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Si es Superadmin con UID maestro, omitir validación de empresa
      if (user.uid === 'I9Al3kS46rcTAbylTHgufUFke8b2' || user.email === 'info@datnova.io') {
        setIsValidatingMembership(false);
        return;
      }

      if (!profile) {
        setMembershipError("Tu perfil global no ha sido configurado.");
        setIsValidatingMembership(false);
        return;
      }

      if (!profile.empresaId) {
        setMembershipError("No tienes una empresa asignada.");
        setIsValidatingMembership(false);
        return;
      }

      // Validar fuente primaria (Membresía en subcolección de empresa)
      try {
        const membershipRef = doc(firestore, 'empresas', profile.empresaId, 'usuarios', user.uid);
        const membershipSnap = await getDoc(membershipRef);
        
        if (!membershipSnap.exists()) {
          setMembershipError("Configuración de membresía incompleta (Error de Multi-tenancy).");
        } else {
          setMembershipError(null);
        }
      } catch (e) {
        setMembershipError("Error al verificar permisos de acceso.");
      } finally {
        setIsValidatingMembership(false);
      }
    }

    validateMembership();
  }, [user, profile, isUserLoading, router, firestore]);

  if (isUserLoading || isValidatingMembership) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-8 space-y-4 flex-col bg-background-dark">
        <Loader2 className="animate-spin text-primary size-10" />
        <p className="text-text-secondary font-bold uppercase text-[10px] tracking-widest">Validando Seguridad Vial...</p>
      </div>
    );
  }

  if (membershipError) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-8 bg-background-dark">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="size-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto">
            <AlertTriangle size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Acceso Restringido</h2>
            <p className="text-text-secondary">{membershipError}</p>
          </div>
          <div className="pt-4 border-t border-border-dark flex flex-col gap-2">
            <p className="text-[10px] text-text-secondary uppercase font-bold">Contacta al Administrador de tu Empresa</p>
            <Button variant="outline" onClick={() => router.push('/login')} className="w-full">
              Volver al Inicio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}