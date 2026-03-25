
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Check,
  ChevronRight,
  Info,
  ListTodo,
  Printer,
  ArrowRight,
  Building2,
  Users,
  UserCircle,
  Truck,
  MapPin,
  ShieldAlert,
  Link,
  Copy,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { useUser } from '@/firebase';

// --- Esquemas de Validación ---

const sedesSchema = z.object({
  nombreSede: z.string().min(3, "Nombre requerido"),
  municipioSede: z.string().min(2, "Municipio requerido"),
  serviciosQuePresta: z.string().min(5, "Describa los servicios"),
});

const contratistasSchema = z.object({
  razonSocial: z.string().min(3, "Razón social requerida"),
  nit: z.string().min(5, "NIT/Cédula requerida"),
  tipoContratista: z.enum(["Ocasional", "Permanente"]),
  tipoVinculacion: z.enum(["Tercerización", "Subcontratación", "Outsourcing", "Intermediación laboral"]),
  tipoFlotaAsociada: z.enum(["Fidelizada", "Ocasional", "Afiliada"]),
  objetoContrato: z.string().min(5, "Describa el objeto"),
});

const censoSchema = z.object({
  nombreCompleto: z.string().min(3, "Nombre requerido"),
  numeroIdentificacion: z.string().min(5, "Identificación requerida"),
  fechaNacimiento: z.string(),
  genero: z.enum(["Masculino", "Femenino", "Otro"]),
  estadoCivil: z.enum(["Soltero", "Casado", "Unión libre", "Viudo", "Divorciado"]),
  escolaridad: z.enum(["Primaria", "Bachiller", "Técnico", "Tecnólogo", "Profesional", "Posgrado"]),
  cargo: z.string().min(2, "Cargo requerido"),
  fechaVinculacion: z.string(),
  medioTransporte: z.enum(["A pie", "Bicicleta", "Motocicleta", "Transporte público", "Transporte empresarial", "Vehículo particular"]),
  rolEnVia: z.enum(["Peatón", "Pasajero", "Ciclista", "Motociclista", "Conductor"]),
  tipoVehiculoConduce: z.enum(["Automotor", "No Automotor", "N/A"]),
  categoriaLicencia: z.enum(["A1", "A2", "B1", "B2", "B3", "C1", "C2", "C3", "N/A"]),
  fechaVencimientoLicencia: z.string().optional().or(z.literal("")),
  siniestrosPrevios: z.coerce.number().min(0).default(0),
  infraccionesTransito: z.coerce.number().min(0).default(0),
  evaluacionCompetencia: z.enum(["Apto", "No Apto", "En Proceso"]),
});

export default function DiagnosticoPage() {
  const { profile } = useUser();
  const [activeTab, setActiveTab] = useState("contexto");
  const [surveyLink, setSurveyLink] = useState("");

  const formSedes = useForm<z.infer<typeof sedesSchema>>({
    resolver: zodResolver(sedesSchema),
    defaultValues: { nombreSede: "", municipioSede: "", serviciosQuePresta: "" }
  });

  const formContratistas = useForm<z.infer<typeof contratistasSchema>>({
    resolver: zodResolver(contratistasSchema),
    defaultValues: {
      razonSocial: "", nit: "", tipoContratista: "Permanente",
      tipoVinculacion: "Tercerización", tipoFlotaAsociada: "Fidelizada", objetoContrato: ""
    }
  });

  const generateSurveyLink = () => {
    if (!profile?.empresaId) return;
    const link = `${window.location.origin}/survey/${profile.empresaId}`;
    setSurveyLink(link);
    toast({ title: "Link Generado", description: "El enlace de encuesta para colaboradores ha sido creado." });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(surveyLink);
    toast({ title: "Copiado", description: "Enlace copiado al portapapeles." });
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Diagnóstico Integral PESV</h1>
          <p className="text-text-secondary mt-1">Línea base para indicadores y planes de acción (Resolución 40595 - Paso 5)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-border-dark text-foreground font-bold" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" /> Exportar Diagnóstico
          </Button>
        </div>
      </div>

      <Tabs defaultValue="contexto" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="bg-surface-dark border-border-dark w-full justify-start overflow-x-auto h-auto p-1 gap-1">
          <TabsTrigger value="contexto" className="data-[state=active]:bg-primary font-bold py-2 gap-2">
            <Building2 className="w-4 h-4" /> 1. Sedes
          </TabsTrigger>
          <TabsTrigger value="contratistas" className="data-[state=active]:bg-primary font-bold py-2 gap-2">
            <Users className="w-4 h-4" /> 2. Contratistas
          </TabsTrigger>
          <TabsTrigger value="censo" className="data-[state=active]:bg-primary font-bold py-2 gap-2">
            <UserCircle className="w-4 h-4" /> 3. Censo
          </TabsTrigger>
          <TabsTrigger value="flota" className="data-[state=active]:bg-primary font-bold py-2 gap-2">
            <Truck className="w-4 h-4" /> 4. Flota
          </TabsTrigger>
          <TabsTrigger value="rutas" className="data-[state=active]:bg-primary font-bold py-2 gap-2">
            <MapPin className="w-4 h-4" /> 5. Rutas
          </TabsTrigger>
          <TabsTrigger value="emergencias" className="data-[state=active]:bg-primary font-bold py-2 gap-2">
            <ShieldAlert className="w-4 h-4" /> 6. Emergencias
          </TabsTrigger>
        </TabsList>

        <div className="mt-8">
          {/* --- 1. SEDES --- */}
          <TabsContent value="contexto">
            <Card className="bg-surface-dark border-border-dark shadow-2xl overflow-hidden">
              <CardHeader className="bg-white/5 border-b border-border-dark">
                <CardTitle className="text-lg font-bold text-foreground uppercase tracking-wider">Información de Sedes y Servicios</CardTitle>
                <CardDescription>Contexto institucional y geográfico de la organización.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Form {...formSedes}>
                  <form className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={formSedes.control} name="nombreSede" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase text-text-secondary">Nombre de la Sede</FormLabel>
                          <FormControl><Input placeholder="Principal, Bodega Norte, etc." {...field} className="bg-background-dark border-border-dark text-foreground" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={formSedes.control} name="municipioSede" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase text-text-secondary">Municipio</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="bg-background-dark border-border-dark text-foreground"><SelectValue placeholder="Seleccione..." /></SelectTrigger></FormControl>
                            <SelectContent className="bg-surface-dark border-border-dark text-foreground">
                              <SelectItem value="Bogota">Bogotá D.C.</SelectItem>
                              <SelectItem value="Medellin">Medellín</SelectItem>
                              <SelectItem value="Cali">Cali</SelectItem>
                              <SelectItem value="Barranquilla">Barranquilla</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={formSedes.control} name="serviciosQuePresta" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase text-text-secondary">Servicios que presta</FormLabel>
                        <FormControl><Textarea placeholder="Describa brevemente la actividad económica en esta sede..." {...field} className="bg-background-dark border-border-dark text-foreground min-h-[100px]" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="button" className="bg-primary font-bold">Agregar Sede</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- 2. CONTRATISTAS --- */}
          <TabsContent value="contratistas">
            <Card className="bg-surface-dark border-border-dark shadow-2xl overflow-hidden">
              <CardHeader className="bg-white/5 border-b border-border-dark">
                <CardTitle className="text-lg font-bold text-foreground uppercase tracking-wider">Lista de Contratistas y Terceros</CardTitle>
                <CardDescription>Empresas o personas que realizan viajes para la organización.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Form {...formContratistas}>
                  <form className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={formContratistas.control} name="razonSocial" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase text-text-secondary">Razón Social</FormLabel>
                          <FormControl><Input {...field} className="bg-background-dark border-border-dark text-foreground" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={formContratistas.control} name="nit" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase text-text-secondary">NIT / Cédula</FormLabel>
                          <FormControl><Input {...field} className="bg-background-dark border-border-dark text-foreground" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField control={formContratistas.control} name="tipoContratista" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase text-text-secondary">Tipo</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="bg-background-dark border-border-dark text-foreground"><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent className="bg-surface-dark border-border-dark text-foreground">
                              <SelectItem value="Ocasional">Ocasional</SelectItem>
                              <SelectItem value="Permanente">Permanente</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                      <FormField control={formContratistas.control} name="tipoVinculacion" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase text-text-secondary">Vinculación</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="bg-background-dark border-border-dark text-foreground"><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent className="bg-surface-dark border-border-dark text-foreground">
                              <SelectItem value="Tercerización">Tercerización</SelectItem>
                              <SelectItem value="Subcontratación">Subcontratación</SelectItem>
                              <SelectItem value="Outsourcing">Outsourcing</SelectItem>
                              <SelectItem value="Intermediación laboral">Intermediación laboral</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                      <FormField control={formContratistas.control} name="tipoFlotaAsociada" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase text-text-secondary">Flota Asociada</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="bg-background-dark border-border-dark text-foreground"><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent className="bg-surface-dark border-border-dark text-foreground">
                              <SelectItem value="Fidelizada">Fidelizada</SelectItem>
                              <SelectItem value="Ocasional">Ocasional</SelectItem>
                              <SelectItem value="Afiliada">Afiliada</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={formContratistas.control} name="objetoContrato" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase text-text-secondary">Objeto del Contrato</FormLabel>
                        <FormControl><Textarea {...field} className="bg-background-dark border-border-dark text-foreground" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="button" className="bg-primary font-bold">Vincular Contratista</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- 3. CENSO (Encuesta) --- */}
          <TabsContent value="censo">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <Card className="bg-primary/10 border-primary/20 shadow-xl overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
                      <Link className="w-5 h-5" /> Enlace de Encuesta
                    </CardTitle>
                    <CardDescription className="text-primary/70">Genere un enlace para que los empleados completen su censo desde su móvil.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button onClick={generateSurveyLink} className="w-full bg-primary font-black uppercase">
                      Generar Nuevo Link
                    </Button>

                    {surveyLink && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <div className="flex gap-2">
                          <Input value={surveyLink} readOnly className="bg-black/20 border-primary/20 text-xs font-mono" />
                          <Button size="icon" variant="outline" className="shrink-0" onClick={copyToClipboard}><Copy className="w-4 h-4" /></Button>
                        </div>
                        <p className="text-[10px] text-primary/60 italic text-center">Enlace válido por 30 días para recolección de datos.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-surface-dark border-border-dark border-l-4 border-l-emerald-500">
                  <CardHeader className="pb-2">
                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Respuesta de Censo</p>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black text-foreground">42 / 120</div>
                    <div className="w-full bg-white/5 h-2 rounded-full mt-2 overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: '35%' }}></div>
                    </div>
                    <p className="text-xs text-text-secondary mt-2">35% de participación</p>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                <Card className="bg-surface-dark border-border-dark shadow-2xl h-full">
                  <CardHeader className="bg-white/5 border-b border-border-dark">
                    <CardTitle className="text-lg font-bold text-foreground uppercase tracking-wider">Censo Sociodemográfico Manual</CardTitle>
                    <CardDescription>Registro individual para casos excepcionales.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="text-sm text-text-secondary mb-6 text-center italic">Formulario completo vinculado a la base de datos de Actores Viales (Paso 10). Se recomienda el uso del link de encuesta para eficiencia.</p>
                    <div className="flex justify-center">
                      <Button variant="outline" className="border-border-dark text-foreground font-bold gap-2">
                        <Plus className="w-4 h-4" /> Registrar Colaborador Individual
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* --- 4. FLOTA --- */}
          <TabsContent value="flota">
            <Card className="bg-surface-dark border-border-dark shadow-2xl overflow-hidden">
              <CardHeader className="bg-white/5 border-b border-border-dark">
                <CardTitle className="text-lg font-bold text-foreground uppercase tracking-wider">Inventario de Vehículos</CardTitle>
                <CardDescription>Levantamiento de la flota activa para el diagnóstico inicial.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                  <p className="text-xs text-blue-900/80 dark:text-blue-100/70 leading-relaxed">
                    Esta lista se sincroniza automáticamente con el <span className="font-bold text-foreground">Módulo de Vehículos (Paso 16)</span>. Solo se muestran los campos relevantes para el diagnóstico.
                  </p>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow className="border-border-dark">
                      <TableHead className="text-xs font-bold text-text-secondary uppercase">Placa</TableHead>
                      <TableHead className="text-xs font-bold text-text-secondary uppercase">Clase</TableHead>
                      <TableHead className="text-xs font-bold text-text-secondary uppercase">Propiedad</TableHead>
                      <TableHead className="text-xs font-bold text-text-secondary uppercase text-center">Plan Manto.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-border-dark">
                      <TableCell className="font-mono font-bold text-foreground">ABC-123</TableCell>
                      <TableCell className="text-xs text-text-secondary">Automóvil</TableCell>
                      <TableCell className="text-xs text-text-secondary">Propio</TableCell>
                      <TableCell className="text-center"><Badge className="bg-emerald-500/10 text-emerald-500 border-none">SÍ</Badge></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <div className="flex justify-end pt-4">
                  <Button variant="outline" className="border-border-dark text-foreground font-bold" onClick={() => toast({ title: "Sincronizando...", description: "Actualizando inventario desde Paso 16." })}>
                    Manual Sync
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- 5. RUTAS --- */}
          <TabsContent value="rutas">
            <Card className="bg-surface-dark border-border-dark shadow-2xl overflow-hidden">
              <CardHeader className="bg-white/5 border-b border-border-dark">
                <CardTitle className="text-lg font-bold text-foreground uppercase tracking-wider">Rutas Frecuentes de Desplazamientos</CardTitle>
                <CardDescription>Mapeo de la exposición al riesgo en la vía.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-text-secondary">Origen</label>
                      <Input placeholder="Ej: Bogotá Sede Norte" className="bg-background-dark border-border-dark text-foreground" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-text-secondary">Destino</label>
                      <Input placeholder="Ej: Medellín Planta" className="bg-background-dark border-border-dark text-foreground" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-text-secondary">Kilómetros</label>
                      <Input type="number" placeholder="0" className="bg-background-dark border-border-dark text-foreground" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-text-secondary">Frecuencia</label>
                      <Select>
                        <SelectTrigger className="bg-background-dark border-border-dark text-foreground"><SelectValue placeholder="Periodo" /></SelectTrigger>
                        <SelectContent className="bg-surface-dark border-border-dark text-foreground">
                          <SelectItem value="Semanal">Semanal</SelectItem>
                          <SelectItem value="Mensual">Mensual</SelectItem>
                          <SelectItem value="Anual">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-text-secondary">Veces x Periodo</label>
                      <Input type="number" placeholder="Ej: 5" className="bg-background-dark border-border-dark text-foreground" />
                    </div>
                  </div>
                  <Button type="button" className="bg-primary font-bold">Agregar Ruta</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- 6. EMERGENCIAS --- */}
          <TabsContent value="emergencias">
            <Card className="bg-surface-dark border-border-dark shadow-2xl overflow-hidden">
              <CardHeader className="bg-white/5 border-b border-border-dark">
                <CardTitle className="text-lg font-bold text-foreground uppercase tracking-wider">Capacidades para Emergencias</CardTitle>
                <CardDescription>Evaluación de preparación ante siniestros viales.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-text-secondary">Colaboradores Capacitados</label>
                      <Input type="number" placeholder="0" className="bg-background-dark border-border-dark text-foreground" />
                      <p className="text-[10px] text-text-secondary italic">Primeros auxilios y manejo de emergencias.</p>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase text-text-secondary">Equipos Disponibles</label>
                      <div className="grid grid-cols-1 gap-2">
                        {["Botiquín", "Extintor", "Equipo carretera", "Camilla", "Kit derrames"].map(item => (
                          <div key={item} className="flex items-center gap-2 p-2 rounded bg-white/5 hover:bg-white/10 transition-colors">
                            <input type="checkbox" className="accent-primary" id={item} />
                            <label htmlFor={item} className="text-sm text-foreground">{item}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-background-dark p-6 rounded-2xl border border-border-dark space-y-4">
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest">Simulacros</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">¿Simulacro realizado?</span>
                        <input type="checkbox" className="accent-primary size-5" />
                      </div>
                      <div className="space-y-2 pt-2">
                        <label className="text-[10px] font-bold uppercase text-text-secondary">Última Fecha</label>
                        <Input type="date" className="bg-surface-dark border-border-dark text-foreground text-xs" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-text-secondary">Tipo de Simulacro</label>
                        <Input placeholder="Ej: Choque simple, Incendio..." className="bg-surface-dark border-border-dark text-foreground text-xs" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-6 border-t border-border-dark flex justify-between items-center">
                  <p className="text-xs text-text-secondary">Asegúrese de guardar antes de salir para que los resultados de clasificación se actualicen.</p>
                  <Button className="bg-emerald-600 hover:bg-emerald-500 font-black uppercase px-8 h-12 gap-2 shadow-lg shadow-emerald-500/20">
                    <Check className="w-5 h-5" /> Guardar Diagnóstico Final
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
