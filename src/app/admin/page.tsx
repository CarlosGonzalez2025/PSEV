'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Building2, AlertTriangle, Settings, Copy, Link as LinkIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { redirect } from 'next/navigation';

const SUPERADMIN_UID = 'I9Al3kS46rcTAbylTHgufUFke8b2';

export default function SuperAdminPage() {
  const { profile, user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [loading, setLoading] = useState(false);
  const [profileExists, setProfileExists] = useState<boolean | null>(null);
  const [invitationLink, setInvitacionLink] = useState<string | null>(null);

  const [empresa, setEmpresa] = useState({
    nit: '',
    razonSocial: '',
    misionalidad: 'Transporte',
  });

  const [admin, setAdmin] = useState({
    nombre: '',
    email: '',
  });

  useEffect(() => {
    async function checkProfile() {
      if (user?.uid === SUPERADMIN_UID) {
        const docRef = doc(firestore, 'usuarios', SUPERADMIN_UID);
        const docSnap = await getDoc(docRef);
        setProfileExists(docSnap.exists());
      }
    }
    if (user) checkProfile();
  }, [user, firestore]);

  if (isUserLoading) return <div className="p-10 text-white">Cargando privilegios...</div>;
  if (user?.uid !== SUPERADMIN_UID) redirect('/dashboard');

  const handleInitializeAdmin = async () => {
    setLoading(true);
    try {
      const userRef = doc(firestore, 'usuarios', SUPERADMIN_UID);
      await setDoc(userRef, {
        id: SUPERADMIN_UID,
        empresaId: 'system',
        rol: 'Superadmin',
        nombreCompleto: 'Super Admin DateNova',
        email: 'info@datnova.io',
        fechaCreacion: new Date().toISOString(),
        estado: 'Activo'
      });
      setProfileExists(true);
      toast({ title: "Perfil Inicializado", description: "Tu cuenta ahora tiene permisos globales de DateNova." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setInvitacionLink(null);

    try {
      const empresaId = empresa.nit.replace(/[^0-9]/g, '');
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // 1. Crear Empresa
      const empresaRef = doc(firestore, 'empresas', empresaId);
      await setDoc(empresaRef, {
        ...empresa,
        id: empresaId,
        nivelPesv: 'Básico',
        estado: 'Activa',
        fechaRegistro: new Date().toISOString()
      });

      // 2. Crear Invitación
      const invRef = doc(firestore, 'invitaciones', token);
      await setDoc(invRef, {
        id: token,
        email: admin.email,
        nombreCompleto: admin.nombre,
        empresaId: empresaId,
        rol: 'Admin',
        token: token,
        usada: false,
        fechaCreacion: new Date().toISOString()
      });

      const activationUrl = `${window.location.origin}/activar?token=${token}`;
      setInvitacionLink(activationUrl);

      toast({ title: "Empresa Registrada", description: "Se ha generado el token de activación." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-dark p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-dark pb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="size-12 bg-primary rounded-xl flex items-center justify-center text-white">
              <Shield className="size-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Panel Maestro SaaS</h1>
              <p className="text-text-secondary uppercase text-[10px] font-bold tracking-widest">Plataforma DateNova</p>
            </div>
          </div>
          
          {!profileExists && (
            <Card className="bg-red-500/10 border-red-500/50 text-white animate-pulse">
              <CardContent className="p-4 flex items-center gap-4">
                <AlertTriangle className="text-red-500" />
                <div className="text-sm">
                  <p className="font-bold">Perfil de Sistema Faltante</p>
                  <Button onClick={handleInitializeAdmin} disabled={loading} size="sm" variant="destructive" className="mt-2 font-bold uppercase text-[10px]">
                    Inicializar Mi Perfil
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleCreateTenant} className="space-y-6">
              <Card className="bg-surface-dark border-border-dark text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg uppercase font-black">
                    <Building2 className="size-5 text-primary" /> Datos del Nuevo Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">NIT de la Empresa</Label>
                    <Input 
                      value={empresa.nit} 
                      onChange={e => setEmpresa({...empresa, nit: e.target.value})} 
                      placeholder="900123456" 
                      className="bg-background-dark border-border-dark text-white placeholder:text-slate-600"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Razón Social</Label>
                    <Input 
                      value={empresa.razonSocial} 
                      onChange={e => setEmpresa({...empresa, razonSocial: e.target.value})} 
                      placeholder="Nombre Legal" 
                      className="bg-background-dark border-border-dark text-white placeholder:text-slate-600"
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Administrador Inicial (Nombre)</Label>
                    <Input 
                      value={admin.nombre} 
                      onChange={e => setAdmin({...admin, nombre: e.target.value})} 
                      placeholder="Nombre del responsable" 
                      className="bg-background-dark border-border-dark text-white placeholder:text-slate-600"
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Correo de Activación</Label>
                    <Input 
                      type="email"
                      value={admin.email} 
                      onChange={e => setAdmin({...admin, email: e.target.value})} 
                      placeholder="admin@cliente.com" 
                      className="bg-background-dark border-border-dark text-white placeholder:text-slate-600"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full md:col-span-2 font-bold h-11 uppercase tracking-widest">
                    {loading ? 'Procesando...' : 'Registrar Empresa e Invitar'}
                  </Button>
                </CardContent>
              </Card>
            </form>

            {invitationLink && (
              <Card className="bg-emerald-500/10 border-emerald-500/50 text-white">
                <CardHeader>
                  <CardTitle className="text-emerald-400 flex items-center gap-2 text-md uppercase font-bold">
                    <LinkIcon className="size-5" /> Link de Activación Generado
                  </CardTitle>
                  <CardDescription className="text-text-secondary">
                    Copia este link y envíalo al cliente para que active su cuenta y asigne su contraseña.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input readOnly value={invitationLink} className="bg-background-dark border-border-dark font-mono text-xs text-white" />
                    <Button variant="secondary" onClick={() => {
                      navigator.clipboard.writeText(invitationLink);
                      toast({ title: "Copiado", description: "Link listo para enviar." });
                    }}>
                      <Copy className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="bg-surface-dark border-border-dark text-white">
              <CardHeader>
                <CardTitle className="text-xs uppercase font-black tracking-widest flex items-center gap-2 text-primary">
                  <Settings className="size-4" /> Resumen Operativo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <p className="text-text-secondary leading-relaxed font-medium">
                  Este flujo garantiza el aislamiento de datos por tenant. Al activar la cuenta, el usuario se convierte en el Administrador oficial de su propia organización dentro de la red DateNova.
                </p>
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-2">
                  <span className="font-black text-primary text-[10px] uppercase tracking-widest">Soporte Técnico</span>
                  <p className="text-[10px] text-text-secondary leading-normal">
                    Como Superadmin, tienes visibilidad global para auditoría y soporte comercial. Todos los logs se centralizan bajo www.datenova.io.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
