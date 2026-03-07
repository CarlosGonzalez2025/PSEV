'use client';

import { useState } from 'react';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword, signInAnonymously, sendPasswordResetEmail } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Shield, Lock, Mail, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error: any) {
      const code = error?.code;
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Correo o contraseña incorrectos. Verifica tus datos.');
      } else if (code === 'auth/too-many-requests') {
        setError('Demasiados intentos. Espera unos minutos e intenta de nuevo.');
      } else {
        setError('Error de red. Verifica tu conexión e intenta de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Por favor, ingresa tu correo electrónico para enviar el link de recuperación.');
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Correo enviado",
        description: "Se ha enviado un enlace a tu correo para restablecer tu contraseña.",
      });
      setError('');
    } catch (error: any) {
      setError('No se pudo enviar el correo. Verifica que la dirección sea correcta.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      await signInAnonymously(auth);
      router.push('/dashboard');
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo iniciar sesión anónima.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-dark p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-16 bg-primary rounded-2xl shadow-lg shadow-primary/30 mb-4">
            <Shield className="size-9 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">RoadWise 360</h1>
          <p className="text-[11px] text-text-secondary font-bold uppercase tracking-[0.25em] mt-1">
            Gestión Integral PESV & SG-SST
          </p>
        </div>

        <div className="bg-surface-dark border border-border-dark rounded-2xl shadow-2xl p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white">Iniciar sesión</h2>
            <p className="text-sm text-text-secondary mt-0.5">
              Accede a tu panel de gestión de seguridad vial
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-3 py-2.5"
              >
                <AlertCircle className="size-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-xs font-bold text-text-secondary uppercase tracking-wider"
              >
                Correo electrónico
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-secondary pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@empresa.com"
                  autoComplete="email"
                  className="pl-10 bg-background-dark border-border-dark text-white placeholder:text-slate-600 focus:border-primary/50 h-11"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-xs font-bold text-text-secondary uppercase tracking-wider"
                >
                  Contraseña
                </Label>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="text-[11px] text-primary hover:underline font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 rounded"
                  tabIndex={0}
                  disabled={isLoading}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-secondary pointer-events-none" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pl-10 bg-background-dark border-border-dark text-white placeholder:text-slate-600 focus:border-primary/50 h-11"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              className="w-full font-bold h-11 mt-2 shadow-lg shadow-primary/20"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <><Loader2 className="mr-2 size-4 animate-spin" /> Verificando...</>
              ) : (
                'Iniciar sesión'
              )}
            </Button>
          </form>

          <div className="relative my-5">
            <Separator className="bg-border-dark" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface-dark px-3 text-[10px] text-text-secondary uppercase tracking-widest font-bold select-none">
              o
            </span>
          </div>

          <Button
            variant="outline"
            className="w-full text-text-secondary hover:text-white text-xs uppercase font-bold tracking-widest border-border-dark bg-transparent hover:bg-white/5 h-10"
            onClick={handleDemoLogin}
            type="button"
            disabled={isLoading}
          >
            Entrar como invitado (Demo)
          </Button>

          <p className="text-center text-[10px] text-text-secondary/40 mt-5 flex items-center justify-center gap-1.5">
            <Lock className="size-3" />
            Conexión cifrada SSL · Datos protegidos por Firebase
          </p>
        </div>

        <div className="mt-6 text-center space-y-1.5">
          <p className="text-[10px] text-text-secondary/50 uppercase font-bold tracking-[0.2em]">
            © {new Date().getFullYear()} RoadWise 360 - Todos los derechos reservados
          </p>
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-[10px] text-text-secondary/50 uppercase font-bold tracking-widest">
              Desarrollado por
            </span>
            <a
              href="https://www.datenova.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-black text-primary hover:underline flex items-center gap-1 focus:outline-none focus:ring-1 focus:ring-primary/50 rounded"
            >
              DATENOVA <ExternalLink className="size-2.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
