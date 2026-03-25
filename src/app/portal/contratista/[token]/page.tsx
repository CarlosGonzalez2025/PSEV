'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  getContratistaByToken, 
  addConductorContratistaAction, 
  addVehiculoContratistaAction,
  processDocumentWithOCR 
} from '@/actions/contratistas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileUpload } from '@/components/shared/file-upload';
import { Loader2, UserPlus, Car, Building2, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export default function PortalContratistaPage() {
  const { token } = useParams<{ token: string }>();
  const [contratista, setContratista] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState('empresa');

  // Estados para formularios
  const [conductorForm, setConductorForm] = useState({
    nombreConductor: '',
    cedula: '',
    licenciaConduccion: '',
    licenciaConduccionVigente: '',
    soporteSeguridadSocial: '',
    soporteSIMIT: '',
  });

  const [vehiculoForm, setVehiculoForm] = useState({
    placa: '',
    tipoVehiculo: '',
    documentoSOAT: '',
    vigenciaSOAT: '',
    documentoRTM: '',
    vigenciaRTM: '',
    soporteMantenimiento: '',
  });

  const [ocrLoading, setOcrLoading] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const res = await getContratistaByToken(token);
      if (res.success) {
        setContratista(res.data);
      } else {
        toast({
          title: "Error",
          description: res.error,
          variant: "destructive",
        });
      }
      setLoading(false);
    }
    loadData();
  }, [token]);

  const handleOCR = async (url: string, contentType: string, field: string, formType: 'conductor' | 'vehiculo') => {
    setOcrLoading(field);
    const res = await processDocumentWithOCR(url, contentType);
    setOcrLoading(null);

    if (res.success && res.data?.fechaVencimiento) {
      toast({
        title: "IA: Fecha detectada",
        description: `Se detectó la fecha ${res.data.fechaVencimiento} automáticamente.`,
      });
      
      if (formType === 'conductor') {
        setConductorForm(prev => ({ ...prev, [field]: res.data.fechaVencimiento }));
      } else {
        setVehiculoForm(prev => ({ ...prev, [field]: res.data.fechaVencimiento }));
      }
    }
  };

  const saveConductor = () => {
    startTransition(async () => {
      const res = await addConductorContratistaAction({
        ...conductorForm,
        contratistaId: contratista.id,
        empresaId: contratista.empresaId,
        licenciaConduccionVigente: new Date(conductorForm.licenciaConduccionVigente),
        estado: 'Pendiente'
      });
      if (res.success) {
        toast({ title: "Conductor registrado", description: "La información será verificada." });
        setConductorForm({ nombreConductor: '', cedula: '', licenciaConduccion: '', licenciaConduccionVigente: '', soporteSeguridadSocial: '', soporteSIMIT: '' });
      } else {
        toast({ title: "Error", description: res.error, variant: "destructive" });
      }
    });
  };

  const saveVehiculo = () => {
      startTransition(async () => {
        const res = await addVehiculoContratistaAction({
          ...vehiculoForm,
          contratistaId: contratista.id,
          empresaId: contratista.empresaId,
          vigenciaSOAT: new Date(vehiculoForm.vigenciaSOAT),
          vigenciaRTM: new Date(vehiculoForm.vigenciaRTM),
          estado: 'Pendiente'
        });
        if (res.success) {
          toast({ title: "Vehículo registrado", description: "La información será verificada." });
          setVehiculoForm({ placa: '', tipoVehiculo: '', documentoSOAT: '', vigenciaSOAT: '', documentoRTM: '', vigenciaRTM: '', soporteMantenimiento: '' });
        } else {
          toast({ title: "Error", description: res.error, variant: "destructive" });
        }
      });
    };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground font-medium">Cargando portal de autogestión...</p>
    </div>
  );

  if (!contratista) return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <AlertCircle className="w-16 h-16 text-destructive mb-4" />
      <h1 className="text-2xl font-bold mb-2">Acceso No Autorizado</h1>
      <p className="text-muted-foreground max-w-md">
        El link que estás intentando usar es inválido, ha expirado o el contratista ya no se encuentra activo en el sistema.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-10 px-6 shadow-lg">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Badge variant="secondary" className="mb-2 bg-white/20 text-white border-none">Portal de Contratistas</Badge>
            <h1 className="text-3xl font-bold tracking-tight">{contratista.nombreEmpresa}</h1>
            <p className="text-primary-foreground/80 mt-1">NIT: {contratista.nit} | Actualiza tu información operativa</p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10 text-sm">
            <Info className="w-5 h-5 opacity-70" />
            <div>
              <p className="font-semibold">Estado Actual</p>
              <p className={contratista.estado === 'Aprobado' ? 'text-green-300' : 'text-yellow-300'}>
                {contratista.estado === 'Aprobado' ? 'Cumple Requisitos' : 'Documentación Pendiente'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 -mt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md h-12 bg-card border shadow-sm">
            <TabsTrigger value="empresa" className="flex items-center gap-2"><Building2 className="w-4 h-4" /> Empresa</TabsTrigger>
            <TabsTrigger value="conductores" className="flex items-center gap-2"><UserPlus className="w-4 h-4" /> Conductores</TabsTrigger>
            <TabsTrigger value="vehiculos" className="flex items-center gap-2"><Car className="w-4 h-4" /> Vehículos</TabsTrigger>
          </TabsList>

          <TabsContent value="empresa">
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle>Información de la Organización</CardTitle>
                <CardDescription>Verifica los datos registrados por el cliente.</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6">
                 <div className="space-y-1">
                    <Label className="text-muted-foreground">Nombre Comercial</Label>
                    <p className="font-medium text-lg">{contratista.nombreEmpresa}</p>
                 </div>
                 <div className="space-y-1">
                    <Label className="text-muted-foreground">NIT / Identificación</Label>
                    <p className="font-medium text-lg">{contratista.nit}</p>
                 </div>
                 <div className="space-y-1">
                    <Label className="text-muted-foreground">Contacto Principal</Label>
                    <p className="font-medium">{contratista.contactoNombre}</p>
                 </div>
                 <div className="space-y-1">
                    <Label className="text-muted-foreground">Email de Notificación</Label>
                    <p className="font-medium">{contratista.email}</p>
                 </div>
              </CardContent>
              <CardFooter className="bg-muted/30 border-t mt-4 text-xs text-muted-foreground p-4">
                Si detectas algún error en esta información, por favor contacta al administrador del sistema Italcol.
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="conductores">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Formulario de registro */}
              <Card className="lg:col-span-2 shadow-lg">
                <CardHeader>
                  <CardTitle>Registrar Nuevo Conductor</CardTitle>
                  <CardDescription>Carga la documentación obligatoria para habilitar al conductor.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label>Nombre Completo</Label>
                       <Input value={conductorForm.nombreConductor} onChange={e => setConductorForm({...conductorForm, nombreConductor: e.target.value})} placeholder="Ej: Juan Pérez" />
                    </div>
                    <div className="space-y-2">
                       <Label>Cédula</Label>
                       <Input value={conductorForm.cedula} onChange={e => setConductorForm({...conductorForm, cedula: e.target.value})} placeholder="Número de identificación" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4 items-end">
                      <FileUpload 
                        label="Licencia de Conducción" 
                        path={`contratistas/${contratista.id}/conductores`}
                        onUploadComplete={(url, type) => {
                           setConductorForm({...conductorForm, licenciaConduccion: url});
                           handleOCR(url, type, 'licenciaConduccionVigente', 'conductor');
                        }}
                      />
                      <div className="space-y-2">
                        <Label className="flex justify-between items-center">
                          Vencimiento Licencia
                          {ocrLoading === 'licenciaConduccionVigente' && <Loader2 className="w-3 h-3 animate-spin"/>}
                        </Label>
                        <Input type="date" value={conductorForm.licenciaConduccionVigente} onChange={e => setConductorForm({...conductorForm, licenciaConduccionVigente: e.target.value})} />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <FileUpload 
                        label="Seguridad Social (Planilla)" 
                        path={`contratistas/${contratista.id}/conductores/ss`} 
                        onUploadComplete={url => setConductorForm({...conductorForm, soporteSeguridadSocial: url})}
                      />
                      <FileUpload 
                        label="Paz y Salvo SIMIT" 
                        path={`contratistas/${contratista.id}/conductores/simit`} 
                        onUploadComplete={url => setConductorForm({...conductorForm, soporteSIMIT: url})}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t pt-6 bg-muted/10">
                   <Button onClick={saveConductor} disabled={isPending || !conductorForm.soporteSeguridadSocial} className="w-full md:w-auto px-10">
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                      Guardar Conductor
                   </Button>
                </CardFooter>
              </Card>

              {/* Tips de Seguridad */}
              <div className="space-y-4">
                <Alert className="bg-primary/5 border-primary/20">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Instrucciones</AlertTitle>
                  <AlertDescription className="text-xs">
                    Cargue fotos claras de los documentos. Nuestra IA leerá las fechas automáticamente para ahorrarle tiempo.
                  </AlertDescription>
                </Alert>
                <div className="p-4 rounded-xl border bg-card shadow-sm text-sm italic text-muted-foreground">
                  "La seguridad vial es un compromiso de todos. Mantener los documentos al día garantiza que podamos operar sin interrupciones."
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="vehiculos">
             <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Registrar Nuevo Vehículo</CardTitle>
                  <CardDescription>Habilita la flota operativa cargando los soportes legales.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Placa</Label>
                        <Input value={vehiculoForm.placa} onChange={e => setVehiculoForm({...vehiculoForm, placa: e.target.value.toUpperCase()})} placeholder="ABC-123" />
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo de Vehículo</Label>
                        <Input value={vehiculoForm.tipoVehiculo} onChange={e => setVehiculoForm({...vehiculoForm, tipoVehiculo: e.target.value})} placeholder="Ej: Camión, Turbo, Moto" />
                      </div>
                   </div>

                   <div className="grid md:grid-cols-2 gap-x-6 gap-y-8">
                      {/* SOAT */}
                      <div className="space-y-2">
                        <FileUpload 
                          label="Documento SOAT" 
                          path={`contratistas/${contratista.id}/vehiculos/soat`}
                          onUploadComplete={(url, type) => {
                             setVehiculoForm({...vehiculoForm, documentoSOAT: url});
                             handleOCR(url, type, 'vigenciaSOAT', 'vehiculo');
                          }}
                        />
                        <div className="pt-2 px-1">
                           <Label className="text-xs flex items-center gap-2">Vigencia SOAT {ocrLoading === 'vigenciaSOAT' && <Loader2 className="w-3 h-3 animate-spin"/>}</Label>
                           <Input type="date" value={vehiculoForm.vigenciaSOAT} onChange={e => setVehiculoForm({...vehiculoForm, vigenciaSOAT: e.target.value})} />
                        </div>
                      </div>

                      {/* RTM */}
                      <div className="space-y-2">
                        <FileUpload 
                          label="Revisión Técnico Mecánica" 
                          path={`contratistas/${contratista.id}/vehiculos/rtm`}
                          onUploadComplete={(url, type) => {
                             setVehiculoForm({...vehiculoForm, documentoRTM: url});
                             handleOCR(url, type, 'vigenciaRTM', 'vehiculo');
                          }}
                        />
                        <div className="pt-2 px-1">
                           <Label className="text-xs flex items-center gap-2">Vigencia RTM {ocrLoading === 'vigenciaRTM' && <Loader2 className="w-3 h-3 animate-spin"/>}</Label>
                           <Input type="date" value={vehiculoForm.vigenciaRTM} onChange={e => setVehiculoForm({...vehiculoForm, vigenciaRTM: e.target.value})} />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                         <FileUpload 
                           label="Certificado Mantenimiento Preventivo (Últimos 3 meses)" 
                           path={`contratistas/${contratista.id}/vehiculos/mtto`} 
                           onUploadComplete={url => setVehiculoForm({...vehiculoForm, soporteMantenimiento: url})}
                         />
                      </div>
                   </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t pt-6 bg-muted/10">
                   <Button onClick={saveVehiculo} disabled={isPending || !vehiculoForm.soporteMantenimiento} className="w-full md:w-auto px-10">
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                      Guardar Vehículo
                   </Button>
                </CardFooter>
             </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer Branding */}
      <footer className="max-w-5xl mx-auto px-6 mt-12 text-center text-muted-foreground text-xs pb-10">
        <p>Sistema PSEV - Powered by RoadWise 360 | © 2024</p>
      </footer>
    </div>
  );
}
