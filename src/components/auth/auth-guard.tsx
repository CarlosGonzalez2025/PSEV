'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isValidatingMembership, setIsValidatingMembership] = useState(true);
  const [membershipError, setMembershipError] = useState<{title: string, message: string} | null>(null);

  useEffect(() => {
    async function validateMembership() {
      if (isUserLoading) return;
      
      if (!user) {
        router.push('/login');
        return;
      }

      // 1. Caso Superadmin Maestro
      if (user.uid === 'I9Al3kS46rcTAbylTHgufUFke8b2' || user.email === 'info@datnova.io') {
        setIsValidatingMembership(false);
        return;
      }

      // 2. Verificar existencia de Perfil Root (Passport)
      if (!profile) {
        setMembershipError({
          title: "Perfil no configurado",
          message: "Tu cuenta de acceso existe pero no tiene un perfil asignado en el sistema PESV."
        });
        setIsValidatingMembership(false);
        return;
      }

      // 3. Verificar Empresa ID en Perfil
      if (!profile.empresaId) {
        setMembershipError({
          title: "Sin Empresa Asignada",
          message: "Tu perfil no está vinculado a ninguna organización activa en RoadWise 360."
        });
        setIsValidatingMembership(false);
        return;
      }

      // 4. Validar integridad de Membresía Local (Doble Verificación)
      try {
        const membershipRef = doc(firestore, 'empresas', profile.empresaId, 'usuarios', user.uid);
        const membershipSnap = await getDoc(membershipRef);
        
        if (!membershipSnap.exists()) {
          setMembershipError({
            title: "Error de Multi-tenancy",
            message: "Inconsistencia detectada: Estás en el sistema global pero no en la base de datos de tu empresa. Contacta al Superadmin."
          });
        } else {
          setMembershipError(null);
        }
      } catch (e) {
        console.error("AuthGuard Validation Error:", e);
        setMembershipError({
          title: "Error de Seguridad",
          message: "No se pudieron validar tus permisos de acceso al tenant."
        });
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
        <p className="text-text-secondary font-bold uppercase text-[10px] tracking-widest animate-pulse">Autenticando Actor Vial...</p>
      </div>
    );
  }

  if (membershipError) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-8 bg-background-dark">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="size-24 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 mx-auto shadow-2xl shadow-red-500/20">
            <ShieldAlert size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{membershipError.title}</h2>
            <p className="text-text-secondary text-sm leading-relaxed">{membershipError.message}</p>
          </div>
          <div className="pt-6 border-t border-border-dark flex flex-col gap-3">
            <p className="text-[10px] text-text-secondary uppercase font-black tracking-widest">Soporte Técnico DateNova</p>
            <Button variant="default" onClick={() => router.push('/login')} className="w-full font-bold h-12">
              Regresar al Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}