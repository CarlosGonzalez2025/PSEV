
'use client';

import { useState } from 'react';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { doc, setDoc, collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Shield, 
  Building2, 
  Globe, 
  Users, 
  CheckCircle2, 
  Plus,
  RefreshCw,
  Database,
  Search,
  Zap,
  Activity
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { redirect } from 'next/navigation';
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  repairMultitenancyAction, 
  fixTenantRecordsAction, 
  getUserDiagnosticAction 
} from '@/actions/usuarios/membership';

const SUPERADMIN_UID = 'I9Al3kS46rcTAbylTHgufUFke8b2';

export default function SuperAdminPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [loading, setLoading] = useState(false);
  const [diagEmail, setDiagEmail] = useState('');
  const [diagResult, setDiagResult] = useState<any>(null);
  const [maintenanceReport, setMaintenanceReport] = useState<{title: string, items: string[]} | null>(null);

  const [empresa, setEmpresa] = useState({ nit: '', razonSocial: '', misionalidad: 'Transporte' });
  const [admin, setAdmin] = useState({ nombre: '', email: '' });
  const [invitationLink, setInvitationLink] = useState<string | null>(null);

  const { data: empresas } = useCollection(
    useMemoFirebase(() => query(collection(firestore, 'empresas'), orderBy('fechaRegistro', 'desc')), [firestore])
  );

  if (isUserLoading) return <div className="p-10 text-white animate-pulse">Cargando privilegios...</div>;
  if (user?.uid !== SUPERADMIN_UID) redirect('/dashboard');

  const runDiagnostic = async () => {
    if (!diagEmail) return;
    setLoading(true);
    const res = await getUserDiagnosticAction(diagEmail);
    setDiagResult(res);
    setLoading(false);
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const empresaId = empresa.nit.replace(/[^0-9]/g, '');
      const token = Math.random().toString(36).substring(2, 15);
      
      // Crear Empresa
      await setDoc(doc(firestore, 'empresas', empresaId), { 
        ...empresa, 
        id: empresaId, 
        nivelPesv: 'Básico', 
        estado: 'Activa', 
        fechaRegistro: new Date().toISOString() 
      });

      // Crear Invitación
      await setDoc(doc(firestore, 'invitaciones', token), { 
        id: token, 
        email: admin.email, 
        nombreCompleto: admin.nombre, 
        empresaId: empresaId, 
        rol: 'Admin', 
        token: token, 
        usada: false, 
        fechaCreacion: new Date().toISOString() 
      });

      setInvitationLink(`${window.location.origin}/activar?token=${token}`);
      toast({ title: "Empresa Registrada e Invitación Generada" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-dark p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center border-b border-border-dark pb-6">
          <div className="flex items-center gap-4">
            <div className="size-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg"><Shield className="size-8" /></div>
            <div>
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Panel Maestro SaaS</h1>
              <p className="text-text-secondary text-[10px] font-bold tracking-widest flex items-center gap-2"><Globe className="size-3" /> INFRAESTRUCTURA GLOBAL DATENOVA</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="empresas" className="w-full">
          <TabsList className="bg-surface-dark border border-border-dark p-1 h-12 mb-8">
            <TabsTrigger value="empresas" className="font-bold px-6">Clientes</TabsTrigger>
            <TabsTrigger value="infra" className="font-bold px-6">Infraestructura</TabsTrigger>
            <TabsTrigger value="diagnostico" className="font-bold px-6">Diagnóstico</TabsTrigger>
          </TabsList>

          <TabsContent value="empresas" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <Card className="lg:col-span-5 bg-surface-dark border-border-dark text-white shadow-xl">
                <CardHeader><CardTitle className="uppercase font-black flex items-center gap-2 text-primary"><Plus /> Nuevo Cliente</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateTenant} className="space-y-4">
                    <Input value={empresa.nit} onChange={e => setEmpresa({...empresa, nit: e.target.value})} placeholder="NIT Empresa" className="bg-background-dark border-border-dark" required />
                    <Input value={empresa.razonSocial} onChange={e => setEmpresa({...empresa, razonSocial: e.target.value})} placeholder="Razón Social" className="bg-background-dark border-border-dark" required />
                    <div className="pt-4 border-t border-border-dark space-y-4">
                      <p className="text-[10px] font-black text-primary uppercase">Administrador Inicial</p>
                      <Input value={admin.nombre} onChange={e => setAdmin({...admin, nombre: e.target.value})} placeholder="Nombre Completo" className="bg-background-dark border-border-dark" required />
                      <Input type="email" value={admin.email} onChange={e => setAdmin({...admin, email: e.target.value})} placeholder="Email de acceso" className="bg-background-dark border-border-dark" required />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full font-black uppercase h-12">Crear Empresa e Invitar</Button>
                  </form>
                  {invitationLink && (
                    <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-mono break-all text-emerald-400">
                      LINK DE ACTIVACIÓN: {invitationLink}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-7 bg-surface-dark border-border-dark text-white">
                <CardHeader><CardTitle className="uppercase font-black">Clientes Activos</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {empresas?.map(emp => (
                    <div key={emp.id} className="p-4 bg-white/5 rounded-xl border border-border-dark flex justify-between items-center hover:border-primary/50 transition-colors">
                      <div><p className="font-bold">{emp.razonSocial}</p><p className="text-[10px] text-text-secondary uppercase">ID: {emp.id}</p></div>
                      <Badge className="bg-primary/20 text-primary border-primary/30 uppercase">{emp.misionalidad}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="infra" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-surface-dark border-border-dark text-white border-l-4 border-l-primary shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-lg uppercase font-black flex items-center gap-2"><Users className="text-primary" /> Reparar Membresías</CardTitle>
                  <CardDescription>Sincroniza perfiles globales con subcolecciones de empresa (Passport + Visa).</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={async () => { setLoading(true); const r = await repairMultitenancyAction(); setMaintenanceReport({title: "Reparación Multi-tenant", items: r.log || []}); setLoading(false); }} disabled={loading} className="w-full font-black uppercase h-12"><RefreshCw className="mr-2 size-4" /> Ejecutar Sincronización</Button>
                </CardContent>
              </Card>
              <Card className="bg-surface-dark border-border-dark text-white border-l-4 border-l-amber-500 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-lg uppercase font-black flex items-center gap-2"><Database className="text-amber-500" /> Aislamiento de Registros</CardTitle>
                  <CardDescription>Asegura que cada vehículo y mantenimiento tenga su empresaId estampado.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={async () => { setLoading(true); const r = await fixTenantRecordsAction(); setMaintenanceReport({title: "Aislamiento Operativo", items: r.report || []}); setLoading(false); }} disabled={loading} className="w-full font-black uppercase h-12 bg-amber-500 hover:bg-amber-600 text-black"><Activity className="mr-2 size-4" /> Estampar EmpresaId</Button>
                </CardContent>
              </Card>
            </div>
            
            {maintenanceReport && (
              <Card className="bg-surface-dark border-border-dark text-white border-dashed">
                <CardHeader className="flex justify-between items-center"><CardTitle className="text-xs font-bold uppercase text-primary">{maintenanceReport.title}</CardTitle><Button variant="ghost" size="sm" onClick={() => setMaintenanceReport(null)}>Cerrar</Button></CardHeader>
                <CardContent>
                  <div className="bg-black/40 p-4 rounded-xl max-h-60 overflow-y-auto space-y-2 font-mono text-[10px]">
                    {maintenanceReport.items.map((it, idx) => <div key={idx} className="flex gap-2 text-emerald-400"><CheckCircle2 className="size-3" /> {it}</div>)}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="diagnostico">
            <Card className="bg-surface-dark border-border-dark text-white shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 uppercase font-black"><Zap className="text-amber-500" /> Analizador de Consistencia</CardTitle>
                <CardDescription>Verifica si un usuario tiene Passport y Visa correctamente configurados.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4">
                  <Input value={diagEmail} onChange={e => setDiagEmail(e.target.value)} placeholder="correo@ejemplo.com" className="bg-background-dark border-border-dark" />
                  <Button onClick={runDiagnostic} disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-black font-black uppercase"><Search className="mr-2 size-4" /> Diagnosticar</Button>
                </div>

                {diagResult && diagResult.success && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95">
                    <Card className="bg-background-dark border-border-dark">
                      <CardHeader><CardTitle className="text-[10px] font-black uppercase text-primary">Passport (/usuarios)</CardTitle></CardHeader>
                      <CardContent><pre className="text-[9px] bg-black/40 p-3 rounded-lg overflow-auto">{JSON.stringify(diagResult.data.rootProfile, null, 2)}</pre></CardContent>
                    </Card>
                    <Card className="bg-background-dark border-border-dark">
                      <CardHeader><CardTitle className="text-[10px] font-black uppercase text-primary">Visa (/empresas/ID/usuarios)</CardTitle></CardHeader>
                      <CardContent>
                        <pre className={`text-[9px] p-3 rounded-lg overflow-auto ${!diagResult.data.isConsistent ? 'bg-red-500/10 text-red-400' : 'bg-black/40 text-emerald-400'}`}>
                          {JSON.stringify(diagResult.data.membershipRecord, null, 2)}
                        </pre>
                        {!diagResult.data.isConsistent && <p className="mt-2 text-xs font-bold text-red-500 uppercase">Inconsistencia Detectada - Ejecutar Reparación</p>}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
