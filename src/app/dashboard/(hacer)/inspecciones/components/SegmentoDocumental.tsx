import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { InspectionFormValues } from '../schema';
import { TipoVehiculo } from '@/types/inspeccion';

interface Props {
    form: UseFormReturn<InspectionFormValues>;
    tipoVehiculo: TipoVehiculo;
}

export function SegmentoDocumental({ form, tipoVehiculo }: Props) {
    // Helpers para los campos condicionales
    const t = tipoVehiculo;
    const requiereRTM = t !== 'GOLF' && t !== 'MAQUINARIA';
    const requiereTarjetaOperacion = ['BUS', 'MINIBUS', 'CAMION', 'TRACTO'].includes(t);
    const requierePermisoOperacion = ['BUS', 'MINIBUS', 'TRACTO', 'AUTOTANQUE'].includes(t);
    const requiereManifiesto = ['CAMION', 'TRACTO', 'AUTOTANQUE', 'FURGON'].includes(t);
    const requiereHazmat = ['AUTOTANQUE', 'CAMION'].includes(t);
    const requiereHojaSeguridad = t === 'AUTOTANQUE';
    const requiereCertOperador = ['MAQUINARIA', 'MINICARGADOR', 'GRUA'].includes(t);

    const renderBoolField = (name: any, label: string, desc?: string) => (
        <FormField control={form.control} name={`documental.${name}` as any} render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/5 bg-background-dark/30 p-3 shadow-sm">
                <div className="space-y-0.5">
                    <FormLabel className="text-[11px] font-bold text-foreground uppercase">{label}</FormLabel>
                    {desc && <FormDescription className="text-[9px] uppercase">{desc}</FormDescription>}
                </div>
                <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
            </FormItem>
        )} />
    );

    const renderDateField = (name: any, label: string) => (
        <FormField control={form.control} name={`documental.${name}` as any} render={({ field }) => (
            <FormItem className="flex flex-col rounded-lg border border-white/5 bg-background-dark/30 p-3 shadow-sm">
                <FormLabel className="text-[10px] font-bold text-text-secondary uppercase">{label}</FormLabel>
                <FormControl>
                    <Input type="date" className="h-8 text-xs bg-background-dark border-border-dark" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
            </FormItem>
        )} />
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-primary/20 text-primary border-none">1</Badge>
                <h3 className="text-sm font-black text-foreground uppercase italic tracking-wider">Documental</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderBoolField('tarjetaPropiedad', 'Tarjeta de Propiedad')}

                <div className="grid grid-cols-2 gap-2">
                    {renderBoolField('soat', 'SOAT Vigente')}
                    {renderDateField('soatVencimiento', 'Vencimiento SOAT')}
                </div>

                {requiereRTM && (
                    <div className="grid grid-cols-2 gap-2">
                        {renderBoolField('rtm', 'RTM Vigente', 'Revisión Tecnomecánica')}
                        {renderDateField('rtmVencimiento', 'Vencimiento RTM')}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                    {renderBoolField('polizaRC', 'Póliza RC Extracontractual')}
                    {renderDateField('polizaRCVencimiento', 'Venc. Póliza RC')}
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {renderBoolField('licencia', 'Licencia Conducción')}
                    <FormField control={form.control} name="documental.licenciaCategoria" render={({ field }) => (
                        <FormItem className="flex flex-col rounded-lg border border-white/5 bg-background-dark/30 p-3 shadow-sm">
                            <FormLabel className="text-[10px] font-bold text-text-secondary uppercase">Categoría</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej. C2" className="h-8 text-xs bg-background-dark border-border-dark uppercase" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                {requiereTarjetaOperacion && renderBoolField('tarjetaOperacion', 'Tarjeta de Operación')}
                {requierePermisoOperacion && renderBoolField('permisoOperacion', 'Permiso de Operación')}
                {requiereManifiesto && renderBoolField('manifiestoCarga', 'Manifiesto de Carga')}
                {requiereHazmat && renderBoolField('docHazmat', 'Permiso Materiales Peligrosos')}
                {requiereHojaSeguridad && renderBoolField('docHojaSeguridad', 'Hoja de Seguridad (Producto)')}
                {requiereCertOperador && renderBoolField('certOperador', 'Certificado de Operador')}
            </div>
        </div>
    );
}
