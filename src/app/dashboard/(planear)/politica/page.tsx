
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { doc, setDoc, collection, serverTimestamp, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Save,
  History,
  Send,
  ShieldCheck,
  CheckCircle2,
  Upload,
  AlertTriangle,
  Users,
  Clock,
  Smartphone,
  Check,
  Calendar
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

export default function PoliticaPage() {
  const firestore = useFirestore();
  const { profile } = useUser();
  const [content, setContent] = useState('');
  const [isDistributeOpen, setIsDistributeOpen] = useState(false);

  // --- QUERY POLITICA ACTUAL ---
  const politicaRef = useMemoFirebase(() => {
    if (!firestore || !profile?.empresaId) return null;
    return doc(firestore, 'empresas', profile.empresaId, 'politicasSeguridadVial', 'actual');
  }, [firestore, profile?.empresaId]);
  const { data: politica, isLoading } = useDoc(politicaRef);

  // --- QUERY DIFUSIONES (Tracking de firmas) ---
  const difusionesRef = useMemoFirebase(() => {
    if (!firestore || !profile?.empresaId) return null;
    return collection(firestore, 'empresas', profile.empresaId, 'difusiones_politica');
  }, [firestore, profile?.empresaId]);
  const { data: difusiones } = useCollection(difusionesRef);

  useEffect(() => {
    if (politica?.contenidoHtml) {
      setContent(politica.contenidoHtml);
    }
  }, [politica]);

  const handleSave = async () => {
    if (!firestore || !politicaRef) return;
    try {
      const fechaAprobacion = new Date().toISOString();
      // Cálculo de vencimiento (3 años por norma)
      const vencimiento = new Date();
      vencimiento.setFullYear(vencimiento.getFullYear() + 3);

      await setDoc(politicaRef, {
        titulo: "Política de Seguridad Vial",
        contenidoHtml: content,
        version: "2.1",
        fechaAprobacion,
        fechaVencimiento: vencimiento.toISOString(),
        estado: "Publicada",
        actualizadoPor: profile?.email,
        empresaId: profile?.empresaId
      }, { merge: true });
      toast({ title: "Compromiso Directivo Publicado", description: "La política ha sido actualizada y su vigencia es de 3 años." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron guardar los cambios." });
    }
  };

  const handleDistribute = async () => {
    if (!firestore || !profile?.empresaId) return;
    // Simulación de envío masivo
    toast({ title: "Email & WhatsApp Masivo Enviado", description: "Se ha solicitado la firma digital a todos los colaboradores." });
    setIsDistributeOpen(false);
  };

  const coveragePct = useMemo(() => {
    if (!difusiones?.length) return 0;
    const signed = difusiones.filter((d: any) => d.aceptado).length;
    return Math.round((signed / difusiones.length) * 100);
  }, [difusiones]);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight uppercase italic">Política de Seguridad Vial</h1>
          <p className="text-text-secondary mt-1">Compromiso, lineamientos y corresponsabilidad (Paso 3)</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="font-bold border-border-dark text-foreground hover:bg-white/10 h-11 uppercase text-xs tracking-widest">
            <History className="w-4 h-4 mr-2" /> Historial
          </Button>
          <Button className="font-black shadow-lg shadow-primary/20 bg-primary h-11 uppercase px-8" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" /> Publicar Política
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <Card className="bg-surface-dark border-border-dark shadow-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-white/[0.02]">
              <div>
                <CardTitle className="text-lg font-black uppercase text-foreground tracking-tighter italic">Cuerpo de la Política</CardTitle>
                <CardDescription className="text-text-secondary">Redacción oficial del compromiso organizacional</CardDescription>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-3 uppercase text-[9px] font-black tracking-widest">VERSIÓN: 2.1</Badge>
                {politica?.fechaVencimiento && (
                  <span className="text-[9px] font-bold text-amber-500 flex items-center gap-1"><Clock className="size-3" /> Vence: {new Date(politica.fechaVencimiento).toLocaleDateString()}</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Textarea
                className="w-full min-h-[500px] bg-transparent border-none p-10 text-foreground resize-none font-serif leading-relaxed text-lg focus-visible:ring-0 custom-scrollbar"
                placeholder="Escriba aquí la política de seguridad vial de la organización..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </CardContent>
          </Card>

          <Card className="bg-surface-dark border-border-dark shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-black uppercase text-foreground flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" /> Tracking de Divulgación y Firmas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              <div className="flex justify-between items-center bg-black/20 p-6 rounded-2xl border border-white/5">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Cobertura de Divulgación</p>
                  <p className="text-3xl font-black text-foreground">{coveragePct}% <span className="text-xs text-text-secondary font-normal italic">Personas registradas</span></p>
                </div>
                <Users className="size-10 text-foreground/10" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase text-text-secondary">
                  <span>Aceptación del Compromiso</span>
                  <span className="text-primary">{coveragePct}% Firmado</span>
                </div>
                <Progress value={coveragePct} className="h-1.5 bg-white/5" indicatorClassName="bg-primary" />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                  <p className="text-[10px] font-bold text-text-secondary uppercase">Leído</p>
                  <p className="text-lg font-black text-foreground">45</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                  <p className="text-[10px] font-bold text-text-secondary uppercase">Pendiente</p>
                  <p className="text-lg font-black text-amber-500">12</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                  <p className="text-[10px] font-bold text-text-secondary uppercase">Con Firma</p>
                  <p className="text-lg font-black text-emerald-500">38</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                  <p className="text-[10px] font-bold text-text-secondary uppercase">OTP Validado</p>
                  <p className="text-lg font-black text-blue-500">100%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="lg:col-span-4 space-y-6">
          <Card className="bg-surface-dark border-border-dark sticky top-24 shadow-xl border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="text-base font-black uppercase text-foreground flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" /> Checklist Legal (Paso 3)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                "Idoneidad de la Alta Dirección",
                "Asignación Presupuestal Expresa",
                "Difusión a todos los Niveles",
                "Inclusión de Hábitos Seguros",
                "Revisión Anual Documentada"
              ].map((req, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all group">
                  <div className="size-6 rounded-full border-2 border-primary/30 flex items-center justify-center text-primary group-hover:bg-primary/20">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-text-secondary group-hover:text-foreground uppercase tracking-tight">{req}</span>
                </div>
              ))}

              <div className="pt-6 border-t border-white/5 mt-6 space-y-4">
                <Button onClick={() => setIsDistributeOpen(true)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase h-14 gap-3 shadow-xl shadow-emerald-900/20">
                  <Send className="w-5 h-5" /> Difundir Política
                </Button>
                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex gap-3">
                  <AlertTriangle className="size-5 text-amber-500 shrink-0" />
                  <p className="text-[10px] text-amber-200/50">La política vence cada 3 años. El sistema le notificará 30 días antes de quedar obsoleta.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface-dark border-border-dark">
            <CardHeader><CardTitle className="text-sm font-black uppercase text-foreground">Firma de Representante Legal</CardTitle></CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border-dark rounded-2xl p-8 flex flex-col items-center justify-center hover:border-primary/50 transition-all cursor-pointer bg-black/20 group">
                <Upload className="size-8 text-foreground/20 group-hover:text-primary mb-2 transition-colors" />
                <p className="text-[10px] font-black text-text-secondary uppercase">Cargar PDF Escaneado</p>
                <p className="text-[8px] text-text-secondary italic mt-1">Soporte físico con firma y sello.</p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* DIALOG DISTRIBUCIÓN */}
      <Dialog open={isDistributeOpen} onOpenChange={setIsDistributeOpen}>
        <DialogContent className="max-w-md bg-surface-dark border-border-dark text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic text-emerald-500">Notificación Masiva</DialogTitle>
            <DialogDescription>Se enviará una solicitud de firma digital por WhatsApp y Correo a los 57 colaboradores de la flota.</DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 flex gap-3">
              <CheckCircle2 className="size-6 text-emerald-500" />
              <p className="text-xs">El sistema rastreará quién leyó el documento y quién ya aplicó su firma digital (Touch/OTP).</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Mensaje Personalizado</Label>
              <Textarea className="bg-background-dark h-24 text-xs" defaultValue="Por favor lee y firma la nueva Política de Seguridad Vial de la organización para cumplir con el proceso PESV 2024." />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleDistribute} className="w-full bg-emerald-600 font-black h-12 uppercase">Iniciar Difusión</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
