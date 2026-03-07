'use client';

import { useState } from 'react';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Shield, Lock, Mail, Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error de autenticación",
        description: "Credenciales inválidas o error de red.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      await signInAnonymously(auth);
      router.push('/dashboard');
    } catch (error) {
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-dark p-4">
      <Card className="w-full max-w-md border-border-dark bg-surface-dark shadow-2xl">
        <CardHeader className="text-center space-y-1">
          <div className="flex justify-center mb-4">
            <div className="size-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Shield className="size-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-black text-white tracking-tight uppercase">RoadWise 360</CardTitle>
          <CardDescription className="text-text-secondary font-bold text-[10px] uppercase tracking-widest">Gestión Integral PESV & SG-SST</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-3 size-4 text-text-secondary" />
                <Input 
                  type="email" 
                  placeholder="email@empresa.com" 
                  className="pl-10 bg-background-dark border-border-dark text-white placeholder:text-slate-600" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 size-4 text-text-secondary" />
                <Input 
                  type="password" 
                  placeholder="Contraseña" 
                  className="pl-10 bg-background-dark border-border-dark text-white placeholder:text-slate-600" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button className="w-full font-bold h-11" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Iniciar Sesión
            </Button>
            <Button variant="ghost" className="w-full text-text-secondary hover:text-white text-xs uppercase font-bold tracking-widest" onClick={handleDemoLogin} type="button">
              Entrar como Invitado
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <div className="mt-8 text-center space-y-2">
        <p className="text-[10px] text-text-secondary uppercase font-bold tracking-[0.2em]">
          Todos los derechos reservados © www.datenova.io
        </p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-[10px] text-text-secondary uppercase font-bold tracking-widest opacity-50">Desarrollado por</span>
          <a href="https://www.datenova.io" target="_blank" className="text-[10px] font-black text-primary hover:underline flex items-center gap-1">
            DATENOVA <ExternalLink className="size-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
