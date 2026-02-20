
'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Plus, Building2, UserPlus, CheckCircle2, AlertTriangle, Settings } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { redirect } from 'next/navigation';

const SUPERADMIN_UID = 'I9Al3kS46rcTAbylTHgufUFke8b2';

export default function SuperAdminPage() {
  const { profile, user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [loading, setLoading] = useState(false);
  const [profileExists, setProfileExists] = useState<boolean | null>(null);

  // Datos para nueva empresa
  const [empresa, setEmpresa] = useState({
    nit: '',
    razonSocial: '',
    misionalidad: 'Transporte',
  });

  // Datos para el admin de esa empresa
  const [admin, setAdmin] = useState({
    uid: '', 
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
        empresaId: 'system',
        rol: 'Superadmin',
        nombreCompleto: 'Super Admin Datnova',
        email: 'info@datnova.io',
        fechaCreacion: new Date().toISOString()
      });
      setProfileExists(true);
      toast({ title: "Perfil Inicializado", description: "Tu cuenta ahora tiene permisos globales en la base de datos." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin.uid) {
      toast({ variant: "destructive", title: "Error", description: "Se requiere el UID de Firebase Auth del nuevo administrador." });
      return;
    }

    setLoading(true);
    try {
      const empresaId = empresa.nit.replace(/[^0-9]/g, '');
      
      // 1. Crear documento de empresa
      const empresaRef = doc(firestore, 'empresas', empresaId);
      await setDoc(empresaRef, {
        ...empresa,
        id: empresaId,
        nivelPesv: 'Básico',
        estado: 'Activa',
        fechaRegistro: new Date().toISOString(),
        representanteLegalId: admin.uid,
        liderPesvId: admin.uid
      });

      // 2. Crear perfil de usuario raíz (para lookup y reglas de seguridad)
      const userRootRef = doc(firestore, 'usuarios', admin.uid);
      await setDoc(userRootRef, {
        empresaId: empresaId,
        rol: 'Admin',
        nombreCompleto: admin.nombre,
        email: admin.email,
        fechaCreacion: new Date().toISOString()
      });

      // 3. Crear perfil de usuario dentro de la empresa (según backend.json)
      const userCompanyRef = doc(firestore, 'empresas', empresaId, 'usuarios', admin.uid);
      await setDoc(userCompanyRef, {
        id: admin.uid,
        empresaId: empresaId,
        nombreCompleto: admin.nombre,
        email: admin.email,
        rol: 'Admin',
        estado: 'Activo',
        fechaCreacion: new Date().toISOString()
      });

      toast({ title: "Empresa Creada", description: `La empresa ${empresa.razonSocial} ha sido configurada correctamente.` });
      setEmpresa({ nit: '', razonSocial: '', misionalidad: 'Transporte' });
      setAdmin({ uid: '', nombre: '', email: '' });
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
              <p className="text-text-secondary">Gestión de Clientes y Configuración Global</p>
            </div>
          </div>
          
          {!profileExists && (
            <Card className="bg-red-500/10 border-red-500/50 text-white animate-pulse">
              <CardContent className="p-4 flex items-center gap-4">
                <AlertTriangle className="text-red-500" />
                <div className="text-sm">
                  <p className="font-bold">Perfil no detectado en base de datos.</p>
                  <p className="text-xs opacity-80">Necesitas inicializar tu perfil para que las reglas de seguridad funcionen.</p>
                </div>
                <Button onClick={handleInitializeAdmin} disabled={loading} size="sm" variant="destructive">
                  Inicializar Mi Perfil
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleCreateTenant} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-surface-dark border-border-dark text-white shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Building2 className="size-5 text-primary" /> Datos de la Empresa
                    </CardTitle>
                    <CardDescription className="text-text-secondary">Información legal del nuevo cliente</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>NIT (Será el ID de la empresa)</Label>
                      <Input 
                        value={empresa.nit} 
                        onChange={e => setEmpresa({...empresa, nit: e.target.value})} 
                        placeholder="Ej: 900123456" 
                        className="bg-background-dark border-border-dark"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Razón Social</Label>
                      <Input 
                        value={empresa.razonSocial} 
                        onChange={e => setEmpresa({...empresa, razonSocial: e.target.value})} 
                        placeholder="Nombre de la empresa" 
                        className="bg-background-dark border-border-dark"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Misionalidad</Label>
                      <select 
                        value={empresa.misionalidad}
                        onChange={e => setEmpresa({...empresa, misionalidad: e.target.value})}
                        className="w-full bg-background-dark border border-border-dark rounded-md p-2 text-sm text-white outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="Transporte">Transporte (Más de 19 veh / 50 cond)</option>
                        <option value="No Transporte">No Transporte (Más de 19 veh / 50 cond)</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-surface-dark border-border-dark text-white shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <UserPlus className="size-5 text-primary" /> Administrador Inicial
                    </CardTitle>
                    <CardDescription className="text-text-secondary">Usuario con control total del tenant</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>UID de Firebase Auth</Label>
                      <Input 
                        value={admin.uid} 
                        onChange={e => setAdmin({...admin, uid: e.target.value})} 
                        placeholder="ID del usuario en Authentication" 
                        className="bg-background-dark border-border-dark font-mono text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nombre Completo</Label>
                      <Input 
                        value={admin.nombre} 
                        onChange={e => setAdmin({...admin, nombre: e.target.value})} 
                        placeholder="Juan Valdez" 
                        className="bg-background-dark border-border-dark"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input 
                        value={admin.email} 
                        onChange={e => setAdmin({...admin, email: e.target.value})} 
                        placeholder="admin@empresa.com" 
                        className="bg-background-dark border-border-dark"
                        required
                      />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full font-bold mt-4">
                      {loading ? 'Creando Tenant...' : 'Registrar Empresa'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <Card className="bg-surface-dark border-border-dark text-white">
              <CardHeader>
                <CardTitle className="text-md flex items-center gap-2">
                  <Settings className="size-4" /> Resumen de Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between border-b border-border-dark pb-2">
                  <span className="text-text-secondary">Tu Rol:</span>
                  <span className="text-primary font-bold">{profile?.rol}</span>
                </div>
                <div className="flex justify-between border-b border-border-dark pb-2">
                  <span className="text-text-secondary">ID Sistema:</span>
                  <span className="text-white font-mono text-xs">{SUPERADMIN_UID.slice(0,8)}...</span>
                </div>
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-xs leading-relaxed text-text-secondary italic">
                    "Como Superadmin puedes crear empresas ilimitadas. Cada empresa tendrá su propio ecosistema de datos aislado por las reglas de seguridad de Firestore."
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
