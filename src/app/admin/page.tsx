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
  Key,
  Check,
  Database,
  RefreshCw,
  FileCode
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
import { repairBrokenUsersAction, fixTenantRecordsAction } from '@/actions/usuarios/membership';

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
  const [copied, setCopied] = useState(false);
  
  // Estados para herramientas de mantenimiento
  const [maintenanceReport, setMaintenanceReport] = useState<{title: string, items: string[]} | null>(null);

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

  const empresasRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'empresas'), orderBy('fechaRegistro', 'desc'));
  }, [firestore]);

  const { data: empresas, isLoading: loadingEmpresas } = useCollection(empresasRef);

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

  if (isUserLoading) return <div className="p-10 text-white flex items-center gap-3"><RefreshCw className="animate-spin" /> Cargando privilegios...</div>;
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

  const runRepairUsers = async () => {
    setLoading(true);
    const res = await repairBrokenUsersAction();
    if (res.success) {
      setMaintenanceReport({ title: "Resultado: Reparación de Perfiles", items: res.log || [] });
      toast({ title: "Proceso Completado", description: res.message });
    } else {
      toast({ variant: "destructive", title: "Error", description: res.message });
    }
    setLoading(false);
  };

  const runFixRecords = async () => {
    setLoading(true);
    const res = await fixTenantRecordsAction();
    if (res.success) {
      setMaintenanceReport({ title: "Resultado: Sincronización de Registros", items: res.report || [] });
      toast({ title: "Sincronización Exitosa", description: res.message });
    } else {
      toast({ variant: "destructive", title: "Error", description: res.message });
    }
    setLoading(false);
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const empresaId = empresa.nit.replace(/[^0-9]/g, '');
      const token = Math.random().toString(36).substring(2, 15);
      const empresaRef = doc(firestore, 'empresas', empresaId);
      await setDoc(empresaRef, { ...empresa, id: empresaId, nivelPesv: 'Básico', estado: 'Activa', fechaRegistro: new Date().toISOString() });
      const invRef = doc(firestore, 'invitaciones', token);
      await setDoc(invRef, { id: token, email: admin.email, nombreCompleto: admin.nombre, empresaId: empresaId, rol: 'Admin', token: token, usada: false, fechaCreacion: new Date().toISOString() });
      setInvitationLink(`${window.location.origin}/activar?token=${token}`);
      toast({ title: "Empresa Registrada" });
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
      await setDoc(invRef, { id: token, email: newUser.email, nombreCompleto: newUser.nombre, empresaId: selectedEmpresa.id, rol: newUser.rol, token: token, usada: false, fechaCreacion: new Date().toISOString() });
      setInvitationLink(`${window.location.origin}/activar?token=${token}`);
      setNewUser({ nombre: '', email: '', rol: 'Lider_PESV' });
      toast({ title: "Usuario Invitado" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Copiado" });
    setTimeout(() => setCopied(false), 2000);
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

        <Tabs defaultValue="empresas" className="w-full">
          <TabsList className="bg-surface-dark border border-border-dark p-1 h-12 mb-8">
            <TabsTrigger value="empresas" className="data-[state=active]:bg-primary data-[state=active]:text-white font-bold px-6">
              <Building2 className="size-4 mr-2" /> Gestión de Clientes
            </TabsTrigger>
            <TabsTrigger value="infra" className="data-[state=active]:bg-primary data-[state=active]:text-white font-bold px-6">
              <Database className="size-4 mr-2" /> Infraestructura & Fix
            </TabsTrigger>
          </TabsList>

          <TabsContent value="empresas" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 space-y-6">
                <form onSubmit={handleCreateTenant} className="space-y-6">
                  <Card className="bg-surface-dark border-border-dark text-white">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg uppercase font-black">
                        <Plus className="size-5 text-primary" /> Registrar Nueva Empresa
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">NIT Empresa</Label>
                          <Input value={empresa.nit} onChange={e => setEmpresa({...empresa, nit: e.target.value})} placeholder="900123456" className="bg-background-dark border-border-dark text-white" required />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Misionalidad</Label>
                          <Select onValueChange={(v) => setEmpresa({...empresa, misionalidad: v})} defaultValue={empresa.misionalidad}>
                            <SelectTrigger className="bg-background-dark border-border-dark text-white"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-surface-dark border-border-dark text-white">
                              <SelectItem value="Transporte">Transporte</SelectItem>
                              <SelectItem value="No Transporte">No Transporte</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Razón Social</Label>
                        <Input value={empresa.razonSocial} onChange={e => setEmpresa({...empresa, razonSocial: e.target.value})} placeholder="Nombre Legal" className="bg-background-dark border-border-dark text-white" required />
                      </div>
                      <div className="pt-4 border-t border-border-dark">
                        <p className="text-[10px] font-black uppercase text-primary mb-4 tracking-widest">Administrador Inicial</p>
                        <div className="space-y-4">
                          <Input value={admin.nombre} onChange={e => setAdmin({...admin, nombre: e.target.value})} placeholder="Nombre Responsable" className="bg-background-dark border-border-dark text-white" required />
                          <Input type="email" value={admin.email} onChange={e => setAdmin({...admin, email: e.target.value})} placeholder="admin@cliente.com" className="bg-background-dark border-border-dark text-white" required />
                        </div>
                      </div>
                      <Button type="submit" disabled={loading} className="w-full font-bold h-11 uppercase tracking-widest mt-4">
                        {loading ? <RefreshCw className="animate-spin mr-2" /> : 'Crear Empresa e Invitar'}
                      </Button>
                    </CardContent>
                  </Card>
                </form>

                {invitationLink && (
                  <Card className="bg-emerald-500/10 border-emerald-500/50 text-white border-dashed">
                    <CardHeader><CardTitle className="text-emerald-400 text-sm font-bold uppercase">Link de Activación Generado</CardTitle></CardHeader>
                    <CardContent className="flex gap-2">
                      <Input readOnly value={invitationLink} className="bg-background-dark border-border-dark font-mono text-xs text-white" />
                      <Button variant="secondary" size="icon" onClick={() => copyToClipboard(invitationLink)}>{copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}</Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="lg:col-span-7 space-y-6">
                <Card className="bg-surface-dark border-border-dark text-white h-full">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg uppercase font-black">Clientes Activos</CardTitle>
                      <CardDescription className="text-text-secondary">Total: {empresas?.length || 0} registrados</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {loadingEmpresas ? (
                        Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-white/5 animate-pulse rounded-xl" />)
                      ) : (
                        empresas?.map((emp) => (
                          <div key={emp.id} className="p-4 bg-white/5 rounded-xl border border-border-dark hover:border-primary/30 transition-all group">
                            <div className="flex justify-between items-start">
                              <div className="flex gap-4">
                                <div className="size-10 rounded bg-primary/10 flex items-center justify-center text-primary"><Building2 className="size-5" /></div>
                                <div>
                                  <h4 className="font-bold text-white group-hover:text-primary">{emp.razonSocial}</h4>
                                  <p className="text-xs text-text-secondary">NIT: {emp.nit} • {emp.misionalidad}</p>
                                </div>
                              </div>
                              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold text-[10px]">{emp.nivelPesv?.toUpperCase() || 'BÁSICO'}</Badge>
                            </div>
                            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/5">
                              <Button variant="ghost" size="sm" className="ml-auto text-primary font-bold text-[10px] h-7 uppercase tracking-widest hover:bg-primary hover:text-white" onClick={() => { setSelectedEmpresa(emp); setIsManageOpen(true); }}>Gestionar <ExternalLink className="size-3 ml-1" /></Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="infra" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-surface-dark border-border-dark text-white">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 uppercase font-black"><Users className="text-primary" /> Reparar Membresías</CardTitle>
                  <CardDescription className="text-text-secondary text-xs">Sincroniza perfiles globales con subcolecciones de empresa para habilitar accesos.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={runRepairUsers} disabled={loading} className="w-full font-bold bg-white/5 border border-border-dark hover:bg-primary text-white">
                    {loading ? <RefreshCw className="animate-spin mr-2" /> : <RefreshCw className="mr-2 size-4" />}
                    Ejecutar Script de Perfiles
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-surface-dark border-border-dark text-white border-l-4 border-l-amber-500">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 uppercase font-black"><Database className="text-amber-500" /> Sincronizar Registros</CardTitle>
                  <CardDescription className="text-text-secondary text-xs">Estampa el empresaId en todos los vehículos, mantenimientos e inspecciones para cumplir con multi-tenancy.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={runFixRecords} disabled={loading} className="w-full font-bold bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500 text-white">
                    {loading ? <RefreshCw className="animate-spin mr-2" /> : <FileCode className="mr-2 size-4" />}
                    Ejecutar Sincronización Masiva
                  </Button>
                </CardContent>
              </Card>
            </div>

            {maintenanceReport && (
              <Card className="bg-surface-dark border-border-dark text-white border-dashed">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-md font-bold uppercase text-primary">{maintenanceReport.title}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setMaintenanceReport(null)} className="text-text-secondary">Cerrar</Button>
                </CardHeader>
                <CardContent>
                  <div className="bg-background-dark/50 p-4 rounded-xl max-h-60 overflow-y-auto space-y-2 font-mono text-[10px]">
                    {maintenanceReport.items.length === 0 ? (
                      <p className="text-text-secondary italic">No se encontraron inconsistencias. Todo está en orden.</p>
                    ) : (
                      maintenanceReport.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-emerald-400">
                          <CheckCircle2 className="size-3 shrink-0" /> {item}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Diálogos de Gestión existentes... */}
      <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
        <DialogContent className="max-w-4xl bg-surface-dark border-border-dark text-white p-0 overflow-hidden">
          <DialogHeader className="p-6 border-b border-border-dark">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Building2 className="size-6" /></div>
              <div>
                <DialogTitle className="text-xl font-black uppercase">{selectedEmpresa?.razonSocial}</DialogTitle>
                <DialogDescription className="text-text-secondary">Configuración de Tenant</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Tabs defaultValue="overview" className="w-full">
            <div className="px-6 bg-background-dark/50">
              <TabsList className="bg-transparent border-none gap-6 h-12">
                <TabsTrigger value="overview" className="rounded-none px-0 font-bold text-xs uppercase">Información</TabsTrigger>
                <TabsTrigger value="users" className="rounded-none px-0 font-bold text-xs uppercase">Usuarios ({usuariosEmpresa?.length || 0})</TabsTrigger>
              </TabsList>
            </div>
            <div className="p-6 min-h-[300px]">
              <TabsContent value="overview" className="mt-0">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-primary">Datos Básicos</h4>
                    <div className="grid gap-2 text-xs">
                      <div className="flex justify-between p-3 rounded bg-white/5"><span>NIT</span><span className="font-bold">{selectedEmpresa?.nit}</span></div>
                      <div className="flex justify-between p-3 rounded bg-white/5"><span>Misionalidad</span><span className="font-bold">{selectedEmpresa?.misionalidad}</span></div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="users" className="mt-0 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black uppercase text-primary">Usuarios Vinculados</h4>
                  <Button size="sm" className="h-8 font-bold text-[10px] uppercase" onClick={() => { setInvitationLink(null); setIsInviteUserOpen(true); }}><UserPlus className="size-3 mr-2" /> Agregar</Button>
                </div>
                <div className="border border-border-dark rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-background-dark/50"><tr><th className="p-3">Nombre</th><th className="p-3">Rol</th><th className="p-3">Estado</th></tr></thead>
                    <tbody>
                      {usuariosEmpresa?.map(u => (
                        <tr key={u.id} className="border-t border-border-dark">
                          <td className="p-3"><div><p className="font-bold">{u.nombreCompleto}</p><p className="text-text-secondary text-[10px]">{u.email}</p></div></td>
                          <td className="p-3"><Badge variant="outline" className="text-[10px]">{u.rol}</Badge></td>
                          <td className="p-3"><span className="size-2 rounded-full bg-emerald-500 inline-block mr-2" />{u.estado}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={isInviteUserOpen} onOpenChange={setIsInviteUserOpen}>
        <DialogContent className="bg-surface-dark border-border-dark text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tighter"><UserPlus className="size-5 text-primary" /> Invitar Colaborador</DialogTitle>
          </DialogHeader>
          {invitationLink ? (
            <div className="py-6 space-y-6 text-center">
              <CheckCircle2 className="size-16 text-emerald-500 mx-auto" />
              <div className="space-y-2">
                <Input readOnly value={invitationLink} className="bg-background-dark border-border-dark font-mono text-xs text-white" />
                <Button className="w-full font-bold bg-primary" onClick={() => copyToClipboard(invitationLink)}>Copiar Link</Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleInviteAdditionalUser} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-text-secondary">Nombre Completo</Label>
                <Input value={newUser.nombre} onChange={e => setNewUser({...newUser, nombre: e.target.value})} placeholder="Ej: Pedro Martínez" className="bg-background-dark border-border-dark text-white" required />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-text-secondary">Correo Electrónico</Label>
                <Input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="pedro@empresa.com" className="bg-background-dark border-border-dark text-white" required />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-text-secondary">Rol en la Empresa</Label>
                <Select value={newUser.rol} onValueChange={v => setNewUser({...newUser, rol: v})}>
                  <SelectTrigger className="bg-background-dark border-border-dark text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-surface-dark border-border-dark text-white">
                    <SelectItem value="Admin">Administrador</SelectItem>
                    <SelectItem value="Lider_PESV">Líder PESV</SelectItem>
                    <SelectItem value="Auditor">Auditor Interno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={loading} className="w-full font-bold uppercase tracking-widest mt-4 h-12 shadow-lg shadow-primary/20">Generar Invitación</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}