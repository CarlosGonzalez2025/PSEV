'use client';

import { useState } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Plus, Building2, UserPlus, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { redirect } from 'next/navigation';

export default function SuperAdminPage() {
  const { profile, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [loading, setLoading] = useState(false);

  // Datos para nueva empresa
  const [empresa, setEmpresa] = useState({
    nit: '',
    razonSocial: '',
    misionalidad: 'Transporte',
  });

  // Datos para el admin de esa empresa
  const [admin, setAdmin] = useState({
    uid: '', // El UID debe ser creado previamente en Auth o pegado aquí
    nombre: '',
    email: '',
  });

  if (isUserLoading) return <div className="p-10 text-white">Cargando...</div>;
  if (profile?.rol !== 'Superadmin') redirect('/dashboard');

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

      // 2. Crear perfil de usuario raíz (para lookup)
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

      toast({ title: "Tenant Creado", description: `La empresa ${empresa.razonSocial} ha sido configurada.` });
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
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4 border-b border-border-dark pb-6">
          <div className="size-12 bg-primary rounded-xl flex items-center justify-center text-white">
            <Shield className="size-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Panel Superadmin</h1>
            <p className="text-text-secondary">Gestión de Tenants y Multi-tenancy RoadWise 360</p>
          </div>
        </div>

        <form onSubmit={handleCreateTenant} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-surface-dark border-border-dark text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-5 text-primary" /> Datos de la Empresa
              </CardTitle>
              <CardDescription>Información legal del nuevo cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>NIT</Label>
                <Input 
                  value={empresa.nit} 
                  onChange={e => setEmpresa({...empresa, nit: e.target.value})} 
                  placeholder="Ej: 900.123.456-1" 
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
                  className="w-full bg-background-dark border border-border-dark rounded-md p-2 text-sm"
                >
                  <option value="Transporte">Transporte</option>
                  <option value="No Transporte">No Transporte</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface-dark border-border-dark text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="size-5 text-primary" /> Administrador Inicial
              </CardTitle>
              <CardDescription>Primer usuario con poder total en el tenant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>UID de Firebase (Manual)</Label>
                <Input 
                  value={admin.uid} 
                  onChange={e => setAdmin({...admin, uid: e.target.value})} 
                  placeholder="Pegue el UID desde la consola de Auth" 
                  className="bg-background-dark border-border-dark font-mono text-xs"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Nombre Completo</Label>
                <Input 
                  value={admin.nombre} 
                  onChange={e => setAdmin({...admin, nombre: e.target.value})} 
                  placeholder="Nombre del Admin" 
                  className="bg-background-dark border-border-dark"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  value={admin.email} 
                  onChange={e => setAdmin({...admin, email: e.target.value})} 
                  placeholder="email@empresa.com" 
                  className="bg-background-dark border-border-dark"
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full font-bold mt-4">
                {loading ? 'Procesando...' : 'Configurar Empresa'}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
