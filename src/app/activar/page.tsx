
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFirestore, useAuth } from '@/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, CheckCircle2, Lock, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

function ActivationForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invitation, setInvitacion] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadInvitation() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const invRef = doc(firestore, 'invitaciones', token);
        const invSnap = await getDoc(invRef);
        if (invSnap.exists() && !invSnap.data().usada) {
          setInvitacion(invSnap.data());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadInvitation();
  }, [token, firestore]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation || password.length < 6) return;

    setSubmitting(true);
    try {
      let uid = '';
      try {
        // 1. Intentar crear usuario en Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, invitation.email, password);
        uid = userCredential.user.uid;
      } catch (authError: any) {
        // Si el correo ya existe, intentamos iniciar sesión para verificar que es el dueño
        if (authError.code === 'auth/email-already-in-use') {
          const userCredential = await signInWithEmailAndPassword(auth, invitation.email, password);
          uid = userCredential.user.uid;
        } else {
          throw authError;
        }
      }

      // 2. Crear/Actualizar perfil raíz (Security Lookup)
      await setDoc(doc(firestore, 'usuarios', uid), {
        id: uid,
        empresaId: invitation.empresaId,
        rol: invitation.rol,
        nombreCompleto: invitation.nombreCompleto,
        email: invitation.email,
        fechaActualizacion: new Date().toISOString(),
        estado: 'Activo'
      }, { merge: true });

      // 3. Crear perfil dentro de la empresa
      await setDoc(doc(firestore, 'empresas', invitation.empresaId, 'usuarios', uid), {
        id: uid,
        empresaId: invitation.empresaId,
        rol: invitation.rol,
        nombreCompleto: invitation.nombreCompleto,
        email: invitation.email,
        fechaCreacion: new Date().toISOString(),
        estado: 'Activo'
      }, { merge: true });

      // 4. Marcar invitación como usada
      await updateDoc(doc(firestore, 'invitaciones', token!), {
        usada: true,
        fechaActivacion: new Date().toISOString(),
        usuarioUid: uid
      });

      setSuccess(true);
      toast({ title: "Cuenta Activada", description: "Bienvenido a RoadWise 360." });
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (error: any) {
      console.error(error);
      const message = error.code === 'auth/wrong-password' 
        ? "El correo ya está registrado pero la contraseña es incorrecta." 
        : error.message;
      toast({ variant: "destructive", title: "Error de Activación", description: message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>;

  if (!invitation && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background-dark">
        <Card className="max-w-md w-full bg-surface-dark border-border-dark text-white text-center">
          <CardHeader>
            <AlertTriangle className="size-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Link Inválido</CardTitle>
            <CardDescription>Esta invitación ha expirado o ya fue utilizada.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/login')} className="w-full">Ir al Login</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background-dark">
        <Card className="max-w-md w-full bg-surface-dark border-border-dark text-white text-center">
          <CardHeader>
            <CheckCircle2 className="size-16 text-emerald-500 mx-auto mb-4" />
            <CardTitle>¡Configuración Exitosa!</CardTitle>
            <CardDescription>Redirigiendo a tu tablero principal...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background-dark">
      <Card className="max-w-md w-full bg-surface-dark border-border-dark text-white">
        <CardHeader className="text-center">
          <div className="size-12 bg-primary rounded-xl flex items-center justify-center text-white mx-auto mb-4">
            <Shield className="size-8" />
          </div>
          <CardTitle>Activar Cuenta PESV</CardTitle>
          <CardDescription>Bienvenido {invitation.nombreCompleto}. Estás activando el acceso para la empresa con ID: {invitation.empresaId}</CardDescription>
        </CardHeader>
        <form onSubmit={handleActivate}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Correo Electrónico</Label>
              <Input value={invitation.email} disabled className="bg-background-dark border-border-dark opacity-70 text-white" />
            </div>
            <div className="space-y-2">
              <Label>Crea tu Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 size-4 text-text-secondary" />
                <Input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres" 
                  className="pl-10 bg-background-dark border-border-dark text-white"
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={submitting} className="w-full font-bold">
              {submitting ? 'Activando...' : 'Activar y Entrar'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function ActivarPage() {
  return (
    <Suspense fallback={<div className="p-20 text-white">Cargando activador...</div>}>
      <ActivationForm />
    </Suspense>
  );
}
