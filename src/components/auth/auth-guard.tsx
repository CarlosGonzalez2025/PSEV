
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDocFromServer } from 'firebase/firestore';
import { Loader2, ShieldAlert, Terminal, Info } from 'lucide-react';
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

      console.group("🔍 DIAGNÓSTICO DE SEGURIDAD ROADWISE");
      console.log("📅 Fecha/Hora:", new Date().toISOString());
      console.log("👤 Usuario Auth:", user.email, `(UID: ${user.uid})`);

      // Superadmin bypass
      if (user.uid === 'I9Al3kS46rcTAbylTHgufUFke8b2' || user.email === 'info@datenova.io') {
        console.log("🚀 Acceso concedido: PERFIL SUPERADMIN");
        console.groupEnd();
        setIsValidatingMembership(false);
        return;
      }

      // Verificación de Perfil Raíz (Passport)
      if (!profile) {
        console.error("❌ ERROR: No se encontró perfil en /usuarios/" + user.uid);
        setMembershipError({
          title: "Perfil Inexistente",
          message: "Tu cuenta de acceso no tiene un perfil vinculado en la base de datos global."
        });
        console.groupEnd();
        setIsValidatingMembership(false);
        return;
      }

      console.log("📄 Datos de Perfil (Passport):", profile);

      if (!profile.empresaId || profile.empresaId === 'system') {
        console.warn("⚠️ ADVERTENCIA: Perfil sin empresaId asignado.");
        setMembershipError({
          title: "Sin Empresa Asignada",
          message: "Tu perfil existe pero no estás vinculado a ninguna organización."
        });
        console.groupEnd();
        setIsValidatingMembership(false);
        return;
      }

      if (profile.estado !== 'Activo') {
        console.error("❌ ERROR: El estado del usuario no es 'Activo'. Actual:", profile.estado);
        setMembershipError({
          title: "Cuenta Inactiva",
          message: "Tu acceso ha sido restringido por el administrador de la empresa."
        });
        console.groupEnd();
        setIsValidatingMembership(false);
        return;
      }

      // Verificación de Membresía Local (Visa)
      try {
        const memRef = doc(firestore, 'empresas', profile.empresaId, 'usuarios', user.uid);
        const memSnap = await getDocFromServer(memRef);
        
        if (!memSnap.exists()) {
          console.error(`❌ ERROR CRÍTICO: Falta registro de membresía en /empresas/${profile.empresaId}/usuarios/${user.uid}`);
          setMembershipError({
            title: "Error de Sincronización",
            message: "Inconsistencia detectada. Tu perfil global existe pero tu membresía local en la empresa está ausente.",
            detail: { root: profile, local: "missing" }
          });
        } else {
          const visaData = memSnap.data();
          console.log("🎫 Datos de Membresía (Visa):", visaData);
          
          if (visaData?.estado !== 'Activo') {
            console.error("❌ ERROR: Tu membresía local no está activa.");
            setMembershipError({
              title: "Membresía Inactiva",
              message: "Tu registro dentro de la empresa no está en estado 'Activo'."
            });
          } else {
            console.log("✅ TODO CORRECTO: Membresía validada. Acceso concedido.");
          }
        }
      } catch (e: any) {
        console.error("🔥 Error durante la validación de Firestore:", e);
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
        <p className="text-text-secondary font-bold uppercase text-[10px] tracking-widest animate-pulse">Analizando Credenciales...</p>
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
            <p className="flex items-center gap-2"><Info className="size-3" /> Tip: Abre la consola (F12) para ver el reporte detallado.</p>
          </div>
          <Button variant="default" onClick={() => window.location.reload()} className="w-full font-bold h-12">
            Reintentar Validación
          </Button>
          <Button variant="ghost" onClick={() => router.push('/login')} className="w-full text-text-secondary">
            Cerrar Sesión
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
