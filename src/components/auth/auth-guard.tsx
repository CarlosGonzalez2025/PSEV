
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { AlertTriangle, Loader2, ShieldAlert, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logPermissionErrorAction } from '@/actions/usuarios/membership';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isValidatingMembership, setIsValidatingMembership] = useState(true);
  const [membershipError, setMembershipError] = useState<{title: string, message: string, detail?: any} | null>(null);

  useEffect(() => {
    async function validateMembership() {
      if (isUserLoading) return;
      
      if (!user) {
        router.push('/login');
        return;
      }

      console.group("🔍 DIAGNÓSTICO DE MEMBRESÍA");
      console.log("Usuario Autenticado:", user.email);
      console.log("UID:", user.uid);

      // Superadmin se salta validaciones de empresa
      if (user.uid === 'I9Al3kS46rcTAbylTHgufUFke8b2' || user.email === 'info@datnova.io') {
        console.log("Acceso como SUPERADMIN detectado.");
        console.groupEnd();
        setIsValidatingMembership(false);
        return;
      }

      if (!profile) {
        console.error("ERROR: No se encontró perfil en /usuarios/" + user.uid);
        setMembershipError({
          title: "Perfil Inexistente",
          message: "Tu cuenta de acceso no tiene un perfil vinculado en la base de datos global."
        });
        console.groupEnd();
        setIsValidatingMembership(false);
        return;
      }

      console.log("Perfil Firestore encontrado:", profile);

      if (!profile.empresaId || profile.empresaId === 'system') {
        console.warn("ADVERTENCIA: Usuario sin empresaId asignado.");
        setMembershipError({
          title: "Sin Empresa Asignada",
          message: "Tu perfil existe pero no estás vinculado a ninguna organización."
        });
        console.groupEnd();
        setIsValidatingMembership(false);
        return;
      }

      if (profile.estado !== 'Activo') {
        console.error("ERROR: El estado del usuario es: " + profile.estado);
        setMembershipError({
          title: "Cuenta Inactiva",
          message: "Tu acceso ha sido restringido por el administrador de la empresa."
        });
        console.groupEnd();
        setIsValidatingMembership(false);
        return;
      }

      // Validación final de membresía local
      try {
        const memRef = doc(firestore, 'empresas', profile.empresaId, 'usuarios', user.uid);
        const memSnap = await getDoc(memRef);
        
        if (!memSnap.exists()) {
          console.error("ERROR CRÍTICO: Perfil raíz existe pero NO existe registro en /empresas/" + profile.empresaId + "/usuarios/" + user.uid);
          setMembershipError({
            title: "Error de Sincronización",
            message: "Inconsistencia de multi-tenancy. Tu perfil global no coincide con el registro de tu empresa.",
            detail: { root: profile, local: "missing" }
          });
        } else {
          console.log("Membresía validada correctamente. Acceso concedido.");
          setMembershipError(null);
        }
      } catch (e: any) {
        console.error("Error en validación de Firestore:", e);
        // Intentar registrar el error para el superadmin
        logPermissionErrorAction({
          uid: user.uid,
          email: user.email,
          error: e.message,
          profile
        });
      } finally {
        console.groupEnd();
        setIsValidatingMembership(false);
      }
    }

    validateMembership();
  }, [user, profile, isUserLoading, router, firestore]);

  if (isUserLoading || isValidatingMembership) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-8 space-y-4 flex-col bg-background-dark">
        <Loader2 className="animate-spin text-primary size-10" />
        <p className="text-text-secondary font-bold uppercase text-[10px] tracking-widest animate-pulse">Verificando Credenciales...</p>
      </div>
    );
  }

  if (membershipError) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-8 bg-background-dark">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="size-24 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 mx-auto">
            <ShieldAlert size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{membershipError.title}</h2>
            <p className="text-text-secondary text-sm leading-relaxed">{membershipError.message}</p>
          </div>
          <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-left font-mono text-[10px] text-primary space-y-1">
            <p className="flex items-center gap-2"><Terminal className="size-3" /> UID: {user?.uid}</p>
            <p className="flex items-center gap-2"><Terminal className="size-3" /> Empresa: {profile?.empresaId || 'N/A'}</p>
            <p className="flex items-center gap-2"><Terminal className="size-3" /> Estado: {profile?.estado || 'N/A'}</p>
          </div>
          <Button variant="default" onClick={() => router.push('/login')} className="w-full font-bold h-12">
            Cerrar Sesión y Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
