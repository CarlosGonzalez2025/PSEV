import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { InspectionFormValues } from '../schema';
import { TipoVehiculo } from '@/types/inspeccion';
import { AlertTriangle } from 'lucide-react';

interface Props {
    form: UseFormReturn<InspectionFormValues>;
    tipoVehiculo: TipoVehiculo;
}

export function SegmentoKitCarretera({ form, tipoVehiculo }: Props) {
    const t = tipoVehiculo;

    const renderBool = (name: any, label: string, desc?: string, critico: boolean = false) => (
        <FormField control={form.control} name={`kitCarretera.${name}` as any} render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/5 bg-background-dark/30 p-3 shadow-sm">
                <div className="space-y-0.5">
                    <FormLabel className="text-[11px] font-bold text-white uppercase flex items-center gap-1">
                        {label} {critico && <AlertTriangle className="size-3 text-red-500" />}
                    </FormLabel>
                    {desc && <FormDescription className="text-[9px] uppercase">{desc}</FormDescription>}
                </div>
                <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
            </FormItem>
        )} />
    );

    const renderDate = (name: any, label: string) => (
        <FormField control={form.control} name={`kitCarretera.${name}` as any} render={({ field }) => (
            <FormItem className="flex flex-col rounded-lg border border-white/5 bg-background-dark/30 p-3 shadow-sm">
                <FormLabel className="text-[10px] font-bold text-text-secondary uppercase">{label}</FormLabel>
                <FormControl>
                    <Input type="date" className="h-8 text-xs bg-background-dark border-border-dark" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
            </FormItem>
        )} />
    );

    const renderNumber = (name: any, label: string) => (
        <FormField control={form.control} name={`kitCarretera.${name}` as any} render={({ field }) => (
            <FormItem className="flex flex-col rounded-lg border border-white/5 bg-background-dark/30 p-3 shadow-sm">
                <FormLabel className="text-[10px] font-bold text-text-secondary uppercase">{label}</FormLabel>
                <FormControl>
                    <Input type="number" className="h-8 text-xs bg-background-dark border-border-dark" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
            </FormItem>
        )} />
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-orange-500/20 text-orange-400 border-none">5</Badge>
                <h3 className="text-sm font-black text-white uppercase italic tracking-wider">Kit de Carretera y Emergencias</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid grid-cols-2 gap-2">
                    {renderBool('extintor', 'Extintor', 'Cargado y vigente', true)}
                    {renderDate('extintorVencimiento', 'Fecha Vencimiento')}
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {renderBool('botiquin', 'Botiquín Primera Ayuda', 'Insumos vigentes', true)}
                    {renderDate('botiquinVencimiento', 'Fecha Vencimiento')}
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {renderNumber('conos', 'Conos / Triángulos')}
                    {renderBool('chaleco', 'Chaleco Reflectivo')}
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {renderBool('linterna', 'Linterna')}
                    {renderBool('herramientas', 'Herramienta Básica')}
                </div>

                {['LIVIANO', 'FURGON', 'CAMION', 'TRACTO'].includes(t) && (
                    <div className="grid grid-cols-2 gap-2">
                        {renderBool('gato', 'Gato Mecánico/Hidr.')}
                        {renderBool('cruceta', 'Cruceta')}
                    </div>
                )}

                {['CAMION', 'TRACTO', 'BUS'].includes(t) && renderBool('tacos', 'Tacos/Cuñas', 'Para inmovilizar')}
                {['CAMION', 'TRACTO'].includes(t) && renderBool('cadenasArrastre', 'Cadenas Arrastre', 'Zonas lodo/nieve')}

                {t === 'MOTO' && (
                    <>
                        {renderBool('casco', 'Casco Certificado', 'Uso Obligatorio', true)}
                        <FormField control={form.control} name={`kitCarretera.cascoCertificacion`} render={({ field }) => (
                            <FormItem className="flex flex-col rounded-lg border border-white/5 bg-background-dark/30 p-3 shadow-sm">
                                <FormLabel className="text-[10px] font-bold text-text-secondary uppercase">Certificación Casco</FormLabel>
                                <FormControl><Input placeholder="NTC 4533 / DOT" className="h-8 text-xs bg-background-dark border-border-dark" {...field} value={field.value || ''} /></FormControl>
                            </FormItem>
                        )} />
                        {renderBool('epp', 'EPP Motociclista', 'Rodilleras, Guantes')}
                    </>
                )}

                {['AUTOTANQUE', 'CAMION'].includes(t) && renderBool('antiderrame', 'Kit Antiderrame', '', true)}
                {t === 'AUTOTANQUE' && renderBool('absorbentes', 'Paños Absorbentes')}

                {renderBool('radio', 'Radio de Com.', 'Si aplica a la zona')}
                {renderBool('gps', 'GPS Activo', 'Funcional y reportando')}

                {t === 'AMBULANCIA' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 col-span-1 md:col-span-2 gap-2">
                        {renderBool('camilla', 'Camilla Anclada')}
                        {renderBool('aed', 'Desfibrilador')}
                        {renderBool('oxigeno', 'Oxígeno Portátil')}
                        {renderNumber('oxigenoNivel', 'Nivel de Oxígeno (%)')}
                    </div>
                )}
            </div>
        </div>
    );
}
