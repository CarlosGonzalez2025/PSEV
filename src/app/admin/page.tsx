'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { doc, setDoc, getDoc, collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Shield, 
  Building2, 
  AlertTriangle, 
  Settings, 
  Copy, 
  Link as LinkIcon, 
  Plus, 
  Globe, 
  Users, 
  Truck,
  CheckCircle2,
  ExternalLink,
  Search
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { redirect } from 'next/navigation';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  // Cargar lista de empresas existentes
  const empresasRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'empresas'), orderBy('fechaRegistro', 'desc'));
  }, [firestore]);

  const { data: empresas, isLoading: loadingEmpresas } = useCollection(empresasRef);

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
        nivelPesv: 'Básico', // Por defecto, se recalcula al entrar
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
      setEmpresa({ nit: '', razonSocial: '', misionalidad: 'Transporte' });
      setAdmin({ nombre: '', email: '' });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-dark p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-dark pb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="size-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Shield className="size-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Panel Maestro SaaS</h1>
              <p className="text-text-secondary uppercase text-[10px] font-bold tracking-widest flex items-center gap-2">
                <Globe className="size-3" /> Infraestructura Global DateNova
              </p>
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Formulario de Creación */}
          <div className="lg:col-span-5 space-y-6">
            <form onSubmit={handleCreateTenant} className="space-y-6">
              <Card className="bg-surface-dark border-border-dark text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg uppercase font-black">
                    <Plus className="size-5 text-primary" /> Registrar Nueva Empresa
                  </CardTitle>
                  <CardDescription className="text-text-secondary">Crea un nuevo tenant y genera la invitación para el admin.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">NIT Empresa</Label>
                      <Input 
                        value={empresa.nit} 
                        onChange={e => setEmpresa({...empresa, nit: e.target.value})} 
                        placeholder="900123456" 
                        className="bg-background-dark border-border-dark text-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Misionalidad</Label>
                      <Select 
                        onValueChange={(v) => setEmpresa({...empresa, misionalidad: v})} 
                        defaultValue={empresa.misionalidad}
                      >
                        <SelectTrigger className="bg-background-dark border-border-dark">
                          <SelectValue placeholder="Seleccione" />
                        </SelectTrigger>
                        <SelectContent className="bg-surface-dark border-border-dark text-white">
                          <SelectItem value="Transporte">Transporte</SelectItem>
                          <SelectItem value="No Transporte">No Transporte</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Razón Social</Label>
                    <Input 
                      value={empresa.razonSocial} 
                      onChange={e => setEmpresa({...empresa, razonSocial: e.target.value})} 
                      placeholder="Nombre Legal de la Compañía" 
                      className="bg-background-dark border-border-dark text-white"
                      required
                    />
                  </div>

                  <div className="pt-4 border-t border-border-dark mt-4">
                    <p className="text-[10px] font-black uppercase text-primary mb-4 tracking-widest">Administrador Inicial</p>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Nombre Completo</Label>
                        <Input 
                          value={admin.nombre} 
                          onChange={e => setAdmin({...admin, nombre: e.target.value})} 
                          placeholder="Responsable de la cuenta" 
                          className="bg-background-dark border-border-dark text-white"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Correo Electrónico</Label>
                        <Input 
                          type="email"
                          value={admin.email} 
                          onChange={e => setAdmin({...admin, email: e.target.value})} 
                          placeholder="admin@cliente.com" 
                          className="bg-background-dark border-border-dark text-white"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full font-bold h-11 uppercase tracking-widest mt-4">
                    {loading ? 'Procesando...' : 'Crear Empresa e Invitar'}
                  </Button>
                </CardContent>
              </Card>
            </form>

            {invitationLink && (
              <Card className="bg-emerald-500/10 border-emerald-500/50 text-white border-dashed">
                <CardHeader>
                  <CardTitle className="text-emerald-400 flex items-center gap-2 text-md uppercase font-bold">
                    <LinkIcon className="size-5" /> Link de Activación
                  </CardTitle>
                  <CardDescription className="text-emerald-500/70 text-xs">
                    Envía este link al cliente para que active su cuenta.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Input readOnly value={invitationLink} className="bg-background-dark border-border-dark font-mono text-xs text-white" />
                  <Button variant="secondary" size="icon" onClick={() => {
                    navigator.clipboard.writeText(invitationLink);
                    toast({ title: "Copiado", description: "Link copiado al portapapeles." });
                  }}>
                    <Copy className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Listado de Empresas */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="bg-surface-dark border-border-dark text-white h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg uppercase font-black">Clientes Activos</CardTitle>
                  <CardDescription className="text-text-secondary">Total: {empresas?.length || 0} empresas en red</CardDescription>
                </div>
                <div className="relative w-48">
                  <Search className="absolute left-2 top-2.5 size-3 text-text-secondary" />
                  <Input placeholder="Buscar NIT..." className="pl-7 h-8 bg-background-dark border-border-dark text-xs" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loadingEmpresas ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-20 bg-white/5 animate-pulse rounded-xl" />
                    ))
                  ) : empresas?.length === 0 ? (
                    <div className="text-center py-20 text-text-secondary italic border border-dashed border-border-dark rounded-xl">
                      No hay empresas registradas aún.
                    </div>
                  ) : (
                    empresas?.map((emp) => (
                      <div key={emp.id} className="p-4 bg-white/5 rounded-xl border border-border-dark hover:border-primary/30 transition-all group">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-4">
                            <div className="size-10 rounded bg-primary/10 flex items-center justify-center text-primary">
                              <Building2 className="size-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-white group-hover:text-primary transition-colors">{emp.razonSocial}</h4>
                              <p className="text-xs text-text-secondary">NIT: {emp.nit} • {emp.misionalidad}</p>
                            </div>
                          </div>
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold text-[10px]">
                            {emp.nivelPesv?.toUpperCase() || 'BÁSICO'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/5">
                          <div className="flex items-center gap-1.5 text-[10px] text-text-secondary font-bold uppercase">
                            <Users className="size-3" /> 0 Usuarios
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-text-secondary font-bold uppercase">
                            <Truck className="size-3" /> 0 Vehículos
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-text-secondary font-bold uppercase">
                            <CheckCircle2 className="size-3" /> {emp.estado}
                          </div>
                          <Button variant="ghost" size="sm" className="ml-auto text-primary font-bold text-[10px] h-7 uppercase tracking-widest">
                            Gestionar <ExternalLink className="size-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
