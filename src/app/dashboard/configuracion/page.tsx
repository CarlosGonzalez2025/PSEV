
'use client';

import { useState } from 'react';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Lock, ShieldCheck, Save, Loader2, Key } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function ConfiguracionPage() {
  const { profile, user } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();

  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    nombreCompleto: profile?.nombreCompleto || '',
  });

  const [passwords, setPassWords] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || loading) return;

    setLoading(true);
    try {
      // Actualizar en tabla raíz
      const rootRef = doc(firestore, 'usuarios', profile.id);
      await updateDoc(rootRef, {
        nombreCompleto: profileData.nombreCompleto
      });

      // Actualizar en tabla de empresa
      const companyUserRef = doc(firestore, 'empresas', profile.empresaId, 'usuarios', profile.id);
      await updateDoc(companyUserRef, {
        nombreCompleto: profileData.nombreCompleto
      });

      toast({ title: "Perfil Actualizado", description: "Tus datos han sido guardados correctamente." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "Las contraseñas no coinciden." });
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast({ variant: "destructive", title: "Error", description: "La contraseña debe tener al menos 6 caracteres." });
      return;
    }

    setLoading(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, passwords.newPassword);
        setPassWords({ newPassword: '', confirmPassword: '' });
        toast({ title: "Contraseña Actualizada", description: "Tu seguridad ha sido reforzada." });
      }
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        toast({ variant: "destructive", title: "Re-autenticación Requerida", description: "Por seguridad, cierra sesión e ingresa de nuevo para cambiar tu contraseña." });
      } else {
        toast({ variant: "destructive", title: "Error", description: error.message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Configuración de Usuario</h1>
        <p className="text-text-secondary mt-1">Gestiona tu perfil personal y ajustes de seguridad.</p>
      </div>

      <Tabs defaultValue="perfil" className="w-full">
        <TabsList className="bg-surface-dark border border-border-dark p-1 h-12 w-full justify-start gap-2">
          <TabsTrigger value="perfil" className="data-[state=active]:bg-primary data-[state=active]:text-white font-bold px-6">
            <User className="size-4 mr-2" /> Mi Perfil
          </TabsTrigger>
          <TabsTrigger value="seguridad" className="data-[state=active]:bg-primary data-[state=active]:text-white font-bold px-6">
            <Lock className="size-4 mr-2" /> Seguridad
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="mt-6">
          <Card className="bg-surface-dark border-border-dark text-white">
            <CardHeader>
              <CardTitle className="text-lg">Información del Perfil</CardTitle>
              <CardDescription className="text-text-secondary">Actualiza tu nombre y visualiza tus datos de acceso.</CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdateProfile}>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-text-secondary uppercase text-[10px] font-bold tracking-widest">Correo Electrónico</Label>
                    <Input value={profile?.email} disabled className="bg-background-dark border-border-dark opacity-50 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-text-secondary uppercase text-[10px] font-bold tracking-widest">Rol Asignado</Label>
                    <Input value={profile?.rol} disabled className="bg-background-dark border-border-dark opacity-50 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-text-secondary uppercase text-[10px] font-bold tracking-widest">Nombre Completo</Label>
                  <Input 
                    value={profileData.nombreCompleto} 
                    onChange={e => setProfileData({nombreCompleto: e.target.value})}
                    placeholder="Tu nombre completo"
                    className="bg-background-dark border-border-dark text-white"
                    required
                  />
                </div>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 flex items-center gap-4">
                  <ShieldCheck className="text-primary size-6" />
                  <div className="text-xs">
                    <p className="font-bold">Empresa Vinculada</p>
                    <p className="text-text-secondary">{profile?.empresaId || 'Sistema Global'}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border-dark pt-6 mt-6">
                <Button type="submit" disabled={loading} className="font-bold bg-primary hover:bg-primary/90">
                  {loading ? <Loader2 className="animate-spin mr-2 size-4" /> : <Save className="mr-2 size-4" />}
                  Guardar Cambios
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="seguridad" className="mt-6">
          <Card className="bg-surface-dark border-border-dark text-white">
            <CardHeader>
              <CardTitle className="text-lg">Cambiar Contraseña</CardTitle>
              <CardDescription className="text-text-secondary">Establece una nueva clave de acceso para tu cuenta.</CardDescription>
            </CardHeader>
            <form onSubmit={handleChangePassword}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-text-secondary uppercase text-[10px] font-bold tracking-widest">Nueva Contraseña</Label>
                  <Input 
                    type="password"
                    value={passwords.newPassword}
                    onChange={e => setPassWords({...passwords, newPassword: e.target.value})}
                    placeholder="Mínimo 6 caracteres"
                    className="bg-background-dark border-border-dark text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-text-secondary uppercase text-[10px] font-bold tracking-widest">Confirmar Nueva Contraseña</Label>
                  <Input 
                    type="password"
                    value={passwords.confirmPassword}
                    onChange={e => setPassWords({...passwords, confirmPassword: e.target.value})}
                    placeholder="Repite tu nueva contraseña"
                    className="bg-background-dark border-border-dark text-white"
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t border-border-dark pt-6 mt-6">
                <Button type="submit" disabled={loading} variant="destructive" className="font-bold">
                  {loading ? <Loader2 className="animate-spin mr-2 size-4" /> : <Key className="mr-2 size-4" />}
                  Actualizar Contraseña
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
