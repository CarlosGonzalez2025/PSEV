
'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { doc, setDoc, getDoc, collection, query, orderBy, where } from 'firebase/firestore';
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
  Search,
  Mail,
  UserPlus,
  Trash2,
  Key
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { redirect } from 'next/navigation';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SUPERADMIN_UID = 'I9Al3kS46rcTAbylTHgufUFke8b2';

export default function SuperAdminPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [loading, setLoading] = useState(false);
  const [profileExists, setProfileExists] = useState<boolean | null>(null);
  const [invitationLink, setInvitationLink] = useState<string | null>(null);
  const [selectedEmpresa, setSelectedEmpresa] = useState<any>(null);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isInviteUserOpen, setIsInviteUserOpen] = useState(false);

  const [empresa, setEmpresa] = useState({
    nit: '',
    razonSocial: '',
    misionalidad: 'Transporte',
  });

  const [admin, setAdmin] = useState({
    nombre: '',
    email: '',
  });

  const [newUser, setNewUser] = useState({
    nombre: '',
    email: '',
    rol: 'Lider_PESV'
  });

  // Cargar lista de empresas existentes
  const empresasRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'empresas'), orderBy('fechaRegistro', 'desc'));
  }, [firestore]);

  const { data: empresas, isLoading: loadingEmpresas } = useCollection(empresasRef);

  // Cargar usuarios de la empresa seleccionada
  const usuariosEmpresaRef = useMemoFirebase(() => {
    if (!firestore || !selectedEmpresa?.id) return null;
    return collection(firestore, 'empresas', selectedEmpresa.id, 'usuarios');
  }, [firestore, selectedEmpresa?.id]);

  const { data: usuariosEmpresa } = useCollection(usuariosEmpresaRef);

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
    setInvitationLink(null);

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
      setInvitationLink(activationUrl);

      toast({ title: "Empresa Registrada", description: "Se ha generado el token de activación." });
      setEmpresa({ nit: '', razonSocial: '', misionalidad: 'Transporte' });
      setAdmin({ nombre: '', email: '' });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteAdditionalUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpresa) return;
    setLoading(true);

    try {
      const token = Math.random().toString(36).substring(2, 15);
      const invRef = doc(firestore, 'invitaciones', token);
      await setDoc(invRef, {
        id: token,
        email: newUser.email,
        nombreCompleto: newUser.nombre,
        empresaId: selectedEmpresa.id,
        rol: newUser.rol,
        token: token,
        usada: false,
        fechaCreacion: new Date().toISOString()
      });

      const activationUrl = `${window.location.origin}/activar?token=${token}`;
      setInvitationLink(activationUrl);
      setIsInviteUserOpen(false);
      setNewUser({ nombre: '', email: '', rol: 'Lider_PESV' });
      
      toast({ title: "Usuario Invitado", description: "Link de activación generado exitosamente." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado", description: "Link copiado al portapapeles." });
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
                  <CardTitle className="flex items-center gap-2 text-lg uppercase font-black text-white">
                    <Plus className="size-5 text-primary" /> Registrar Nueva Empresa
                  </CardTitle>
                  <CardDescription className="text-text-secondary">Crea un nuevo inquilino y genera su acceso inicial.</CardDescription>
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
                        <SelectTrigger className="bg-background-dark border-border-dark text-white">
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
                    Copia este enlace y envíalo al cliente para que active su cuenta.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Input readOnly value={invitationLink} className="bg-background-dark border-border-dark font-mono text-xs text-white" />
                  <Button variant="secondary" size="icon" onClick={() => copyToClipboard(invitationLink)}>
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
                  <CardTitle className="text-lg uppercase font-black text-white">Clientes Activos</CardTitle>
                  <CardDescription className="text-text-secondary">Total: {empresas?.length || 0} empresas registradas</CardDescription>
                </div>
                <div className="relative w-48">
                  <Search className="absolute left-2 top-2.5 size-3 text-text-secondary" />
                  <Input placeholder="Buscar NIT..." className="pl-7 h-8 bg-background-dark border-border-dark text-xs text-white" />
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
                            <CheckCircle2 className="size-3" /> {emp.estado}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="ml-auto text-primary font-bold text-[10px] h-7 uppercase tracking-widest hover:bg-primary hover:text-white"
                            onClick={() => {
                              setSelectedEmpresa(emp);
                              setIsManageOpen(true);
                            }}
                          >
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

      {/* Diálogo de Gestión de Empresa */}
      <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
        <DialogContent className="max-w-4xl bg-surface-dark border-border-dark text-white p-0 overflow-hidden">
          <DialogHeader className="p-6 border-b border-border-dark">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Building2 className="size-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black uppercase text-white">{selectedEmpresa?.razonSocial}</DialogTitle>
                <DialogDescription className="text-text-secondary">NIT: {selectedEmpresa?.nit} • Configuración de Tenant</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <Tabs defaultValue="overview" className="w-full">
            <div className="px-6 bg-background-dark/50">
              <TabsList className="bg-transparent border-none gap-6 h-12">
                <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 font-bold text-xs uppercase">Información</TabsTrigger>
                <TabsTrigger value="users" className="data-[state=active]:bg-transparent data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 font-bold text-xs uppercase">Usuarios ({usuariosEmpresa?.length || 0})</TabsTrigger>
                <TabsTrigger value="security" className="data-[state=active]:bg-transparent data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 font-bold text-xs uppercase">Seguridad</TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6 min-h-[400px]">
              <TabsContent value="overview" className="mt-0 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-primary tracking-widest">Datos Básicos</h4>
                    <div className="grid gap-2">
                      <div className="flex justify-between p-3 rounded bg-white/5 border border-border-dark">
                        <span className="text-xs text-text-secondary">Fecha Registro</span>
                        <span className="text-xs font-bold">{selectedEmpresa?.fechaRegistro?.split('T')[0]}</span>
                      </div>
                      <div className="flex justify-between p-3 rounded bg-white/5 border border-border-dark">
                        <span className="text-xs text-text-secondary">Misionalidad</span>
                        <span className="text-xs font-bold">{selectedEmpresa?.misionalidad}</span>
                      </div>
                      <div className="flex justify-between p-3 rounded bg-white/5 border border-border-dark">
                        <span className="text-xs text-text-secondary">Nivel PESV</span>
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">{selectedEmpresa?.nivelPesv}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-primary tracking-widest">Métricas de Uso</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-center">
                        <Truck className="size-5 text-primary mx-auto mb-2" />
                        <p className="text-2xl font-black">0</p>
                        <p className="text-[8px] font-bold text-text-secondary uppercase">Vehículos</p>
                      </div>
                      <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 text-center">
                        <Users className="size-5 text-purple-500 mx-auto mb-2" />
                        <p className="text-2xl font-black">0</p>
                        <p className="text-[8px] font-bold text-text-secondary uppercase">Conductores</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="users" className="mt-0 space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black uppercase text-primary tracking-widest">Usuarios Vinculados</h4>
                  <Button 
                    size="sm" 
                    className="h-8 font-bold text-[10px] uppercase tracking-widest"
                    onClick={() => setIsInviteUserOpen(true)}
                  >
                    <UserPlus className="size-3 mr-2" /> Agregar Usuario
                  </Button>
                </div>
                
                <div className="border border-border-dark rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-background-dark/50">
                      <tr>
                        <th className="px-4 py-3 text-[10px] font-black uppercase text-text-secondary">Nombre</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase text-text-secondary">Rol</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase text-text-secondary">Estado</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-dark">
                      {usuariosEmpresa?.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-10 text-center text-xs text-text-secondary italic">No hay usuarios activos para este cliente.</td>
                        </tr>
                      ) : (
                        usuariosEmpresa?.map(u => (
                          <tr key={u.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold">{u.nombreCompleto}</span>
                                <span className="text-[10px] text-text-secondary">{u.email}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary">{u.rol}</Badge>
                            </td>
                            <td className="px-4 py-3">
                              <span className="size-2 rounded-full bg-emerald-500 inline-block mr-2" />
                              <span className="text-xs">{u.estado}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button variant="ghost" size="icon" className="size-8 text-red-500 hover:bg-red-500/10">
                                <Trash2 className="size-4" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="security" className="mt-0 space-y-6">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-red-500 tracking-widest">Zona de Peligro</h4>
                  <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">Suspender Empresa</p>
                        <p className="text-xs text-text-secondary">Bloquea el acceso a todos los usuarios de este tenant.</p>
                      </div>
                      <Button variant="outline" className="border-red-500/50 text-red-500 hover:bg-red-500 text-xs font-bold uppercase tracking-widest h-8">Suspender</Button>
                    </div>
                    <div className="flex items-center justify-between border-t border-red-500/10 pt-4">
                      <div>
                        <p className="text-sm font-bold">Eliminar Datos</p>
                        <p className="text-xs text-text-secondary">Elimina permanentemente toda la información de la empresa.</p>
                      </div>
                      <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-xs font-bold uppercase tracking-widest h-8">Eliminar Todo</Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Invitar Usuario Adicional */}
      <Dialog open={isInviteUserOpen} onOpenChange={setIsInviteUserOpen}>
        <DialogContent className="bg-surface-dark border-border-dark text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="size-5 text-primary" /> Invitar Colaborador
            </DialogTitle>
            <DialogDescription className="text-text-secondary">
              Se generará un link para que el nuevo usuario de {selectedEmpresa?.razonSocial} active su cuenta.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInviteAdditionalUser} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Nombre Completo</Label>
              <Input 
                value={newUser.nombre}
                onChange={e => setNewUser({...newUser, nombre: e.target.value})}
                placeholder="Ej: Pedro Martínez"
                className="bg-background-dark border-border-dark text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Correo Electrónico</Label>
              <Input 
                type="email"
                value={newUser.email}
                onChange={e => setNewUser({...newUser, email: e.target.value})}
                placeholder="pedro@empresa.com"
                className="bg-background-dark border-border-dark text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Rol en la Empresa</Label>
              <Select 
                value={newUser.rol}
                onValueChange={v => setNewUser({...newUser, rol: v})}
              >
                <SelectTrigger className="bg-background-dark border-border-dark text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-surface-dark border-border-dark text-white">
                  <SelectItem value="Admin">Administrador</SelectItem>
                  <SelectItem value="Lider_PESV">Líder PESV</SelectItem>
                  <SelectItem value="Auditor">Auditor Interno</SelectItem>
                  <SelectItem value="Supervisor">Supervisor de Operaciones</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={loading} className="w-full font-bold uppercase tracking-widest mt-4">
              {loading ? 'Generando...' : 'Generar Link de Invitación'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
