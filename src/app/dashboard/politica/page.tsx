'use client';

import { useState } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Save, History, Send, ShieldCheck, CheckCircle2, Upload } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

const MOCK_EMPRESA_ID = "demo-empresa-123";

export default function PoliticaPage() {
  const firestore = useFirestore();
  const politicaRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'empresas', MOCK_EMPRESA_ID, 'politicasSeguridadVial', 'actual');
  }, [firestore]);

  const { data: politica, isLoading } = useDoc(politicaRef);
  const [content, setContent] = useState('');

  const handleSave = async () => {
    if (!firestore) return;
    try {
      await setDoc(politicaRef!, {
        titulo: "Política de Seguridad Vial",
        contenidoHtml: content || politica?.contenidoHtml || '',
        version: "2.1",
        fechaAprobacion: new Date().toISOString(),
        estado: "Borrador"
      }, { merge: true });
      toast({ title: "Cambios guardados", description: "La política ha sido actualizada exitosamente." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron guardar los cambios." });
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Política de Seguridad Vial</h1>
          <p className="text-text-secondary mt-1">Liderazgo, compromiso y corresponsabilidad (Pasos 1-5 del PESV)</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="font-bold border-border-dark">
            <History className="w-4 h-4 mr-2" />
            Historial
          </Button>
          <Button className="font-bold shadow-lg shadow-primary/20 bg-primary" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Guardar Cambios
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <Card className="bg-surface-dark border-border-dark min-h-[500px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border-dark">
              <div>
                <CardTitle className="text-lg font-bold text-white">Editor de Política</CardTitle>
                <CardDescription>Redacción oficial del compromiso directivo</CardDescription>
              </div>
              <Badge variant="outline" className="text-emerald-500 border-emerald-500/20">ÚLTIMA VERSIÓN: 2.1</Badge>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <Textarea 
                className="w-full h-full min-h-[400px] bg-transparent border-none p-8 text-white resize-none font-serif leading-relaxed text-lg"
                placeholder="Escriba aquí la política de seguridad vial de la organización..."
                defaultValue={politica?.contenidoHtml || ''}
                onChange={(e) => setContent(e.target.value)}
              />
            </CardContent>
          </Card>

          <Card className="bg-surface-dark border-border-dark">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" /> Documento Firmado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border-dark rounded-xl p-10 text-center hover:border-primary/50 transition-all cursor-pointer group">
                <div className="size-16 rounded-full bg-white/5 mx-auto mb-4 flex items-center justify-center text-text-secondary group-hover:text-primary transition-colors">
                  <Upload className="w-8 h-8" />
                </div>
                <p className="text-white font-bold">Cargar PDF Firmado</p>
                <p className="text-xs text-text-secondary mt-1">Asegúrese de que el documento incluya la firma del representante legal</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="lg:col-span-4 space-y-6">
          <Card className="bg-surface-dark border-border-dark sticky top-24">
            <CardHeader>
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" /> Verificación de Requisitos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                "Compromiso de la alta dirección",
                "Asignación de recursos",
                "Cumplimiento normativo",
                "Mejora continua",
                "Promoción de hábitos seguros"
              ].map((req, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded hover:bg-white/5 transition-colors">
                  <div className="size-5 rounded border border-primary/50 flex items-center justify-center text-primary">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm text-text-secondary">{req}</span>
                </div>
              ))}
              
              <div className="pt-6 border-t border-border-dark mt-6">
                <Button className="w-full bg-primary hover:bg-primary/90 font-bold h-12 gap-2">
                  <Send className="w-4 h-4" />
                  Difundir a la Organización
                </Button>
                <p className="text-[10px] text-text-secondary text-center mt-3">
                  Se notificará vía email y App a 124 colaboradores.
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}